'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  ConnectionLineType,
  type Node,
  type Edge,
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import 'reactflow/dist/style.css';
import { organigramaApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

// --- Tipos ---
interface EmpOrg {
  id: number;
  nombre: string;
  estatus: string;
}

interface PuestoOrg {
  id: number;
  nombre_puesto: string;
  hierarchyLevel: number;
  reporta_a_puesto_id: number | null;
  reporta_matricialmente_a_id?: number | null;
  es_rol_staff?: boolean;
  empleados: EmpOrg[];
}

interface AreaOrg {
  id: number;
  nombre: string;
  puestos: PuestoOrg[];
}

interface OrgData {
  areas: AreaOrg[];
  sinArea: PuestoOrg[];
}

// --- Configuración y Paleta ---
const PALETTE = [
  { area: '#A7313A', light: '#fcf0f1', dark: '#8F2930' },
  { area: '#44474A', light: '#f3f4f6', dark: '#2d2f31' },
  { area: '#10b981', light: '#ecfdf5', dark: '#065f46' },
  { area: '#f97316', light: '#fff7ed', dark: '#c2410c' },
  { area: '#a855f7', light: '#fdf4ff', dark: '#7e22ce' },
  { area: '#3b82f6', light: '#eff6ff', dark: '#1d4ed8' },
  { area: '#ef4444', light: '#fef2f2', dark: '#b91c1c' },
];

function initials(name: string) {
  if (!name) return '';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// --- Componente Nodo Personalizado ---
type PuestoCardData = {
  area: string;
  nombre_puesto: string;
  hierarchyLevel: number;
  empleados: { id: number; nombre: string }[];
  colorIdx: number;
  isRoot: boolean;
  isStaff: boolean;
};
const PuestoCard = ({ data }: { data: PuestoCardData }) => {
  const p = PALETTE[data.colorIdx % PALETTE.length];
  const isEmpty = data.empleados.length === 0;

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${isEmpty ? 'border-2 border-dashed border-gray-300 opacity-80' : 'border border-gray-200'} ${data.isRoot ? 'ring-2 ring-offset-2 ring-[#A7313A]' : ''}`}
      style={{ width: '260px' }}
    >
      <Handle type="target" position={Position.Top} id="top-target" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="right-source" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="left-target" className="opacity-0" />

      <div
        className="py-2 px-4 text-center text-xs font-bold text-white uppercase tracking-wider"
        style={{ background: isEmpty ? '#9ca3af' : p.area }}
      >
        {data.area ?? 'Sin área'} {data.isStaff && '(Staff)'}
      </div>

      <div className="p-4 bg-transparent border-b border-[#E1DFE0] relative">
        {data.isStaff && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[0.6rem] font-bold rounded-full uppercase">
            Staff
          </div>
        )}
        <div className="font-bold text-[#44474A] text-sm text-center">{data.nombre_puesto}</div>
        <div className="text-[0.65rem] text-[#858789] text-center mt-1 uppercase tracking-wider">
          Nivel {data.hierarchyLevel}
        </div>
      </div>

      <div className="p-2 flex flex-col gap-2">
        {isEmpty ? (
          <div className="text-center py-4 text-sm font-medium text-gray-400">
            Vacante / Sin empleado
          </div>
        ) : (
          data.empleados.map((emp: { id: number; nombre: string }) => (
            <div
              key={emp.id}
              className="flex items-center gap-3 p-2 bg-white border border-[#E1DFE0] rounded-lg shadow-sm"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner"
                style={{ background: p.area }}
              >
                {initials(emp.nombre)}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-[#44474A] text-[0.8rem] truncate">{emp.nombre}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom-source" className="opacity-0" />
    </div>
  );
};

// --- Layout Dagre ---
const CARD_W = 260;
// Calculamos el alto aproximado basado en la cantidad de empleados
const getCardHeight = (numEmpleados: number) => {
  if (numEmpleados === 0) return 150; // Vacante
  return 110 + numEmpleados * 50; // Header + N empleados
};

function applyLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80, marginx: 40, marginy: 40 });

  nodes.forEach((n) =>
    g.setNode(n.id, { width: CARD_W, height: getCardHeight(n.data.empleados.length) })
  );
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id);
      const h = getCardHeight(n.data.empleados.length);
      return { ...n, position: { x: pos.x - CARD_W / 2, y: pos.y - h / 2 } };
    }),
    edges,
  };
}

// --- Construcción del Grafo ---
function buildGraph(data: OrgData, compact: boolean): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const addNode = (id: string, type: string, d: Record<string, unknown>) => {
    nodes.push({ id, type, data: d, position: { x: 0, y: 0 } });
  };
  const addEdge = (
    src: string,
    tgt: string,
    color: string,
    width = 2,
    hidden = false,
    isMatrix = false
  ) => {
    edges.push({
      id: `e-${isMatrix ? 'matrix' : 'solid'}-${src}-${tgt}`,
      source: src,
      target: tgt,
      sourceHandle: 'bottom-source',
      targetHandle: 'top-target',
      type: 'smoothstep',
      style: {
        stroke: color,
        strokeWidth: width,
        opacity: hidden ? 0 : 1,
        strokeDasharray: isMatrix ? '5,5' : 'none',
      },
    });
  };

  // Recopilar todos los puestos con su area
  const allPuestos = new Map<number, PuestoOrg & { areaObj?: AreaOrg }>();
  data.areas.forEach((a) => {
    a.puestos.forEach((p) => allPuestos.set(p.id, { ...p, areaObj: a }));
  });
  data.sinArea.forEach((p) => {
    allPuestos.set(p.id, { ...p, areaObj: undefined });
  });

  // Encontrar Puestos Raíz
  const allPuestosArr = Array.from(allPuestos.values());
  const minLevel =
    allPuestosArr.length > 0 ? Math.min(...allPuestosArr.map((p) => p.hierarchyLevel ?? 99)) : 99;

  // Global roots: no tienen jefe válido Y están en el nivel más alto de la empresa (minLevel)
  const globalRoots = allPuestosArr.filter(
    (p) =>
      (!p.reporta_a_puesto_id || !allPuestos.has(p.reporta_a_puesto_id)) &&
      (p.hierarchyLevel ?? 99) === minLevel
  );
  if (globalRoots.length === 0 && allPuestosArr.length > 0) {
    // Fallback si por alguna razón no hay coincidencia
    const anyRoot =
      allPuestosArr.find((p) => !p.reporta_a_puesto_id || !allPuestos.has(p.reporta_a_puesto_id)) ||
      allPuestosArr[0];
    globalRoots.push(anyRoot);
  }

  allPuestos.forEach((puesto) => {
    const tieneDependientes = allPuestosArr.some(
      (child) => child.reporta_a_puesto_id === puesto.id
    );
    const isGlobalRoot = globalRoots.some((r) => r.id === puesto.id);
    const isOrphan =
      (!puesto.reporta_a_puesto_id || !allPuestos.has(puesto.reporta_a_puesto_id)) && !isGlobalRoot;

    if (compact && !tieneDependientes && !isGlobalRoot) {
      return;
    }

    const areaId = puesto.areaObj ? puesto.areaObj.id : 1;

    addNode(`puesto-${puesto.id}`, 'puesto', {
      area: puesto.areaObj?.nombre || 'Sin área',
      nombre_puesto: puesto.nombre_puesto,
      hierarchyLevel: puesto.hierarchyLevel,
      empleados: puesto.empleados,
      colorIdx: areaId,
      isRoot: isGlobalRoot,
      isStaff: puesto.es_rol_staff,
    });

    // Conectar al jefe directo
    if (puesto.reporta_a_puesto_id && allPuestos.has(puesto.reporta_a_puesto_id)) {
      addEdge(`puesto-${puesto.reporta_a_puesto_id}`, `puesto-${puesto.id}`, '#A0AEC0');
    } else if (isOrphan && globalRoots.length > 0) {
      // Es un huérfano (nivel > minLevel). Lo ligamos a una raíz global con una línea invisible
      // para que Dagre lo ponga en los niveles inferiores y flote solo.
      addEdge(`puesto-${globalRoots[0].id}`, `puesto-${puesto.id}`, '#000000', 1, true);
    }

    // Conectar al jefe matricial
    if (puesto.reporta_matricialmente_a_id && allPuestos.has(puesto.reporta_matricialmente_a_id)) {
      addEdge(
        `puesto-${puesto.reporta_matricialmente_a_id}`,
        `puesto-${puesto.id}`,
        '#F59E0B',
        2,
        false,
        true
      ); // Naranja, punteada
    }
  });

  const layout = applyLayout(nodes, edges);

  // Agregar líneas laterales para hermanos (mismo jefe o ambos son globalRoots)
  const siblingsMap = new Map<number, string[]>(); // parentId -> array of child node IDs

  // Group rendered nodes by their parent
  allPuestosArr.forEach((p) => {
    if (!layout.nodes.find((n) => n.id === `puesto-${p.id}`)) return; // Skip if not rendered

    let parentId = p.reporta_a_puesto_id;
    const isGlobalRoot = globalRoots.some((r) => r.id === p.id);
    if (isGlobalRoot) parentId = -1; // Group global roots together

    if (parentId !== null && parentId !== undefined) {
      if (!siblingsMap.has(parentId)) siblingsMap.set(parentId, []);
      siblingsMap.get(parentId)!.push(`puesto-${p.id}`);
    }
  });

  siblingsMap.forEach((siblingIds) => {
    if (siblingIds.length < 2) return;

    // Sort siblings left-to-right based on their calculated X position
    const sortedSiblings = siblingIds
      .map((id) => layout.nodes.find((n) => n.id === id)!)
      .sort((a, b) => a.position.x - b.position.x);

    for (let i = 0; i < sortedSiblings.length - 1; i++) {
      const leftNode = sortedSiblings[i];
      const rightNode = sortedSiblings[i + 1];

      layout.edges.push({
        id: `lateral-${leftNode.id}-${rightNode.id}`,
        source: leftNode.id,
        target: rightNode.id,
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
        type: 'straight',
        style: { stroke: '#CBD5E1', strokeWidth: 1.5, strokeDasharray: '5,5' },
      });
    }
  });

  return layout;
}

// --- Vista Principal ---
export default function OrganigramaPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [compact, setCompact] = useState(false);
  const [orgData, setOrgData] = useState<OrgData | null>(null);

  const nodeTypes = useMemo(() => ({ puesto: PuestoCard }), []);

  const fetchOrg = useCallback(async () => {
    setLoading(true);
    try {
      const res = await organigramaApi.get();
      setOrgData(res);
    } catch (error) {
      console.error('Error al cargar organigrama', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrg();
  }, [fetchOrg]);

  useEffect(() => {
    if (orgData) {
      const { nodes: n, edges: e } = buildGraph(orgData, compact);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNodes(n);
      setEdges(e);
    }
  }, [orgData, compact]);

  const totalEmps = orgData
    ? orgData.areas.reduce(
        (s, a) => s + a.puestos.reduce((sum, p) => sum + p.empleados.length, 0),
        0
      ) + orgData.sinArea.reduce((sum, p) => sum + p.empleados.length, 0)
    : 0;

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col bg-transparent">
      <div className="p-6 pb-4 bg-white border-b border-[#E1DFE0] flex justify-between items-center z-10 shadow-sm">
        <div>
          <h1 className="text-[1.5rem] font-bold text-[#44474A] tracking-[-0.02em]">Organigrama</h1>
          <p className="text-[#858789] text-sm mt-1">
            {orgData?.areas.length || 0} áreas · {totalEmps} colaboradores
          </p>
        </div>
        <div className="flex bg-[#F3F4F6] p-1 rounded-xl">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!compact ? 'bg-white text-[#A7313A] shadow-sm' : 'text-[#858789] hover:text-[#44474A]'}`}
            onClick={() => setCompact(false)}
          >
            Completo
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${compact ? 'bg-white text-[#A7313A] shadow-sm' : 'text-[#858789] hover:text-[#44474A]'}`}
            onClick={() => setCompact(true)}
          >
            Solo Jefes
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent">
            <Loader2 size={40} className="animate-spin text-[#A7313A] mb-4" />
            <p className="text-[#858789] font-medium">Dibujando estructura...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            minZoom={0.1}
            maxZoom={1.5}
          >
            <Background color="#E1DFE0" gap={20} size={1} />
            <Controls className="bg-white border-[#E1DFE0] shadow-md rounded-lg overflow-hidden" />
            <MiniMap
              className="bg-white border border-[#E1DFE0] rounded-xl overflow-hidden shadow-md"
              maskColor="rgba(243, 244, 246, 0.7)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
