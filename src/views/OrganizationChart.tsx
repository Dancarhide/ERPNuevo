import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
    Background, Controls, MiniMap,
    Handle, Position, ConnectionLineType,
    type Node, type Edge,
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import 'reactflow/dist/style.css';
import client from '../api/client';
import './styles/OrganizationChart.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmpOrg {
    id:             number;
    nombre:         string;
    puesto:         string | null;
    rol:            string | null;
    hierarchyLevel: number;
}

interface AreaOrg {
    id:        number;
    nombre:    string;
    jefe:      EmpOrg | null;
    empleados: EmpOrg[];
}

interface OrgData {
    areas:   AreaOrg[];
    sinArea: EmpOrg[];
}

// ─── Paleta ───────────────────────────────────────────────────────────────────

const PALETTE = [
    { area: '#6366f1', light: '#eef2ff', dark: '#4338ca' },
    { area: '#10b981', light: '#ecfdf5', dark: '#065f46' },
    { area: '#f97316', light: '#fff7ed', dark: '#c2410c' },
    { area: '#a855f7', light: '#fdf4ff', dark: '#7e22ce' },
    { area: '#3b82f6', light: '#eff6ff', dark: '#1d4ed8' },
    { area: '#ef4444', light: '#fef2f2', dark: '#b91c1c' },
    { area: '#14b8a6', light: '#f0fdfa', dark: '#0f766e' },
];

function initials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

// ─── Tarjeta de persona (único tipo de nodo) ──────────────────────────────────
//
// Layout de cada casilla:
//   ┌───────────────────────┐
//   │  ÁREA                 │  ← header coloreado con el color del área
//   ├───────────────────────┤
//   │  [IC]  Nombre         │  ← iniciales + nombre completo
//   │        Puesto / Rol   │  ← puesto preferido, si no, nombre del rol
//   └───────────────────────┘

const PersonCard = ({ data }: any) => {
    const p = PALETTE[data.colorIdx % PALETTE.length];
    const label = data.puesto || data.rol || 'Colaborador';

    return (
        <div className={`org-card ${data.isRoot ? 'org-card--root' : ''} ${data.isJefe ? 'org-card--jefe' : ''}`}>
            <Handle type="target" position={Position.Top}    isConnectable={false} />

            {/* Header: nombre del área */}
            <div className="org-card__header" style={{ background: p.area }}>
                {data.area ?? 'Sin área'}
            </div>

            {/* Body: avatar + nombre + puesto */}
            <div className="org-card__body">
                <div className="org-card__avatar" style={{ background: p.area }}>
                    {data.initials}
                </div>
                <div className="org-card__info">
                    <span className="org-card__name">{data.nombre}</span>
                    <span className="org-card__puesto">{label}</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} isConnectable={false} />
        </div>
    );
};


// ─── Layout dagre ──────────────────────────────────────────────────────────────

const CARD_W = 190;
const CARD_H = 88;
const JEFE_H = 92;

function applyLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'TB', nodesep: 20, ranksep: 48, marginx: 40, marginy: 40 });

    nodes.forEach(n => g.setNode(n.id, { width: n.data.w ?? CARD_W, height: n.data.h ?? CARD_H }));
    edges.forEach(e => g.setEdge(e.source, e.target));
    dagre.layout(g);

    return {
        nodes: nodes.map(n => {
            const pos = g.node(n.id);
            const w = n.data.w ?? CARD_W;
            const h = n.data.h ?? CARD_H;
            return { ...n, position: { x: pos.x - w / 2, y: pos.y - h / 2 } };
        }),
        edges,
    };
}

// ─── Constructor del grafo ────────────────────────────────────────────────────
//
// Estructura del árbol:
//   Raíz (empresa)
//    └── Jefe del Área  (card: header=área, body=nombre+puesto)
//         └── Empleado1
//         └── Empleado2  (ordenados por hierarchy_level, más senior primero)
//
// Sin nodos de "área" separados — el área va dentro de cada card.

function buildGraph(data: OrgData, compact: boolean): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const addNode = (id: string, type: string, d: Record<string, any>) => {
        nodes.push({ id, type, data: d, position: { x: 0, y: 0 } });
    };
    const addEdge = (src: string, tgt: string, color: string, width = 1.5) => {
        edges.push({
            id: `e-${src}-${tgt}`, source: src, target: tgt,
            type: 'smoothstep',
            style: { stroke: color, strokeWidth: width },
        });
    };

    // ── Por cada área ──────────────────────────────────────────────────────
    data.areas.forEach((area, areaIdx) => {
        const pal        = PALETTE[areaIdx % PALETTE.length];
        const todosMap   = new Map<number, EmpOrg>(area.empleados.map(e => [e.id, e]));
        if (area.jefe && !todosMap.has(area.jefe.id)) todosMap.set(area.jefe.id, area.jefe);

        if (todosMap.size === 0) return; // área sin personal, omitir

        const jefe   = area.jefe;
        const jefeId = jefe ? `emp-${jefe.id}` : null;

        // Nodo del jefe: conecta a la raíz
        if (jefe && jefeId) {
            addNode(jefeId, 'person', {
                area:    area.nombre,
                nombre:  jefe.nombre,
                puesto:  jefe.puesto,
                rol:     jefe.rol,
                initials: initials(jefe.nombre),
                isJefe:  true,
                colorIdx: areaIdx,
                w: CARD_W, h: JEFE_H,
            });
            // jefe es nodo raíz — sin arista de entrada
        }

        if (!compact) {
            // Empleados restantes ordenados: más senior primero
            [...todosMap.values()]
                .filter(e => e.id !== jefe?.id)
                .sort((a, b) => (a.hierarchyLevel ?? 99) - (b.hierarchyLevel ?? 99))
                .forEach(emp => {
                    const empId = `emp-${emp.id}`;
                    addNode(empId, 'person', {
                        area:    area.nombre,
                        nombre:  emp.nombre,
                        puesto:  emp.puesto,
                        rol:     emp.rol,
                        initials: initials(emp.nombre),
                        isJefe:  false,
                        colorIdx: areaIdx,
                        w: CARD_W, h: CARD_H,
                    });
                    // Conectar al jefe del área (o sin padre si no hay jefe)
                    if (jefeId) addEdge(jefeId, empId, pal.area + 'AA', 1.2);
                });
        }
    });

    // ── Empleados sin área ─────────────────────────────────────────────────
    if (!compact) {
        [...data.sinArea]
            .sort((a, b) => (a.hierarchyLevel ?? 99) - (b.hierarchyLevel ?? 99))
            .forEach(emp => {
                const empId = `emp-sa-${emp.id}`;
                addNode(empId, 'person', {
                    area:    'Sin área',
                    nombre:  emp.nombre,
                    puesto:  emp.puesto,
                    rol:     emp.rol,
                    initials: initials(emp.nombre),
                    isJefe:  false,
                    colorIdx: 6,
                    w: CARD_W, h: CARD_H,
                });
                addEdge('root', empId, '#94a3b8', 1.2);
            });
    }

    return applyLayout(nodes, edges);
}

// ─── Vista principal ──────────────────────────────────────────────────────────

const OrganizationChart: React.FC = () => {
    const [nodes, setNodes]     = useState<Node[]>([]);
    const [edges, setEdges]     = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [compact, setCompact] = useState(false);
    const [orgData, setOrgData] = useState<OrgData | null>(null);

    const nodeTypes = useMemo(() => ({ person: PersonCard }), []);

    const fetchOrg = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await client.get('/organigrama');
            setOrgData(res.data);
        } catch {
            setError('No se pudo cargar el organigrama.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (orgData) {
            const { nodes: n, edges: e } = buildGraph(orgData, compact);
            setNodes(n);
            setEdges(e);
        }
    }, [orgData, compact]);

    useEffect(() => { fetchOrg(); }, [fetchOrg]);

    if (loading) return (
        <div className="org-loader-container">
            <div className="org-spinner" />
            <p>Construyendo estructura organizacional...</p>
        </div>
    );

    if (error) return (
        <div className="org-loader-container">
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button className="org-btn active" onClick={fetchOrg}>Reintentar</button>
        </div>
    );

    const totalEmps = orgData
        ? orgData.areas.reduce((s, a) => s + a.empleados.length, 0) + orgData.sinArea.length
        : 0;

    return (
        <div className="org-chart-container">
            <header className="org-header">
                <div className="org-header-text">
                    <h1>Estructura Organizacional</h1>
                    <p>
                        {orgData?.areas.filter(a => a.empleados.length > 0).length ?? 0} áreas ·{' '}
                        {totalEmps} colaboradores ·{' '}
                        {compact ? 'Vista por jefes de área' : 'Vista completa'}
                    </p>
                </div>
                <div className="org-controls">
                    <button className={`org-btn ${!compact ? 'active' : ''}`} onClick={() => setCompact(false)}>
                        Completo
                    </button>
                    <button className={`org-btn ${compact ? 'active' : ''}`} onClick={() => setCompact(true)}>
                        Jefes
                    </button>
                </div>
            </header>

            <div className="org-content">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    fitView
                    fitViewOptions={{ padding: 0.12 }}
                    nodesDraggable
                    nodesConnectable={false}
                    elementsSelectable
                    panOnDrag
                    zoomOnScroll
                    minZoom={0.05}
                    maxZoom={2}
                >
                    <Background color="#e2e8f0" gap={22} size={1} />
                    <Controls showInteractive={false} />
                    <MiniMap
                        nodeColor={n => {
                            if (n.type === 'root') return '#4f46e5';
                            const ci = (n.data?.colorIdx ?? 0) as number;
                            return PALETTE[ci % PALETTE.length].area;
                        }}
                        maskColor="rgba(248,250,252,0.85)"
                        style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}
                    />
                </ReactFlow>
            </div>
        </div>
    );
};

export default OrganizationChart;
