import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    Handle, 
    Position,
    ConnectionLineType,
    type Node,
    type Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import client from '../api/client';
import './styles/OrganizationChart.css';

// --- Types ---
interface Empleado {
    id: number;
    nombre: string;
    puesto: string | null;
}

interface AreaOrg {
    id: number;
    nombre: string;
    jefe: Empleado | null;
    empleados: Empleado[];
}

// --- Custom Nodes ---
const DirectorateNode = ({ data }: any) => (
    <div className="custom-node node-directorate">
        <Handle type="target" position={Position.Top} isConnectable={false} />
        <h3 className="node-title">{data.label}</h3>
        <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
);

const AreaNode = ({ data }: any) => (
    <div className="custom-node node-area">
        <Handle type="target" position={Position.Top} isConnectable={false} />
        <h3 className="node-title">{areaLabel(data)}</h3>
        <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
);

const areaLabel = (data: any) => {
    if (data.viewMode === 'compact') return data.label;
    return (
        <>
            <span className="node-name">{data.label}</span>
            {data.jefe && <span className="node-puesto">{data.jefe}</span>}
        </>
    );
};

const EmployeeNode = ({ data }: any) => (
    <div className="custom-node node-employee">
        <Handle type="target" position={Position.Top} isConnectable={false} />
        {data.viewMode === 'complete' && <span className="node-name">{data.label}</span>}
        <span className="node-puesto">{data.puesto}</span>
        <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
);

const OrganizationChart: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'complete' | 'compact'>('compact');

    const nodeTypes = useMemo(() => ({
        directorate: DirectorateNode,
        area: AreaNode,
        employee: EmployeeNode
    }), []);

    const fetchOrg = useCallback(async () => {
        try {
            const res = await client.get('/api/organigrama');
            const data: AreaOrg[] = res.data;
            
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            // 1. Root: Dirección
            newNodes.push({
                id: 'root',
                type: 'directorate',
                data: { label: viewMode === 'complete' ? 'Dirección General' : 'Dirección' },
                position: { x: 400, y: 0 }
            });

            let areaX = 0;
            const areaSpacing = 250;

            data.forEach((area, areaIdx) => {
                const areaId = `area-${area.id}`;
                
                // 2. Area Node
                newNodes.push({
                    id: areaId,
                    type: 'area',
                    data: { 
                        label: area.nombre, 
                        jefe: area.jefe?.nombre,
                        viewMode 
                    },
                    position: { x: areaX, y: 150 }
                });

                newEdges.push({
                    id: `e-root-${areaId}`,
                    source: 'root',
                    target: areaId,
                    type: 'step' // Right-angled lines
                });

                // 3. Employee Nodes (Vertical Stacking)
                let empY = 280;
                area.empleados
                    .filter(e => e.id !== area.jefe?.id)
                    .forEach((emp, empIdx) => {
                        const empId = `emp-${emp.id}`;
                        newNodes.push({
                            id: empId,
                            type: 'employee',
                            data: { 
                                label: emp.nombre, 
                                puesto: emp.puesto || 'Colaborador',
                                viewMode 
                            },
                            position: { x: areaX + 20, y: empY }
                        });

                        newEdges.push({
                            id: `e-${areaId}-${empId}`,
                            source: areaId,
                            target: empId,
                            type: 'step'
                        });

                        empY += (viewMode === 'complete' ? 100 : 70);
                    });

                areaX += areaSpacing;
            });

            setNodes(newNodes);
            setEdges(newEdges);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(setLoading => false);
        }
    }, [viewMode]);

    useEffect(() => {
        fetchOrg();
    }, [fetchOrg]);

    if (loading) return (
        <div className="org-loader-container">
            <div className="org-spinner"></div>
            <p>Construyendo Arquitectura Corporativa...</p>
        </div>
    );

    return (
        <div className="org-chart-container">
            <header className="org-header">
                <div className="header-text">
                    <h1>Estructura Organizacional</h1>
                    <p>{viewMode === 'compact' ? 'Vista compacta por puestos' : 'Mapeo estratégico detallado'}</p>
                </div>
                <div className="view-selector">
                    <button 
                        className={`btn-mode ${viewMode === 'compact' ? 'active' : ''}`}
                        onClick={() => setViewMode('compact')}
                    >
                        Compacto
                    </button>
                    <button 
                        className={`btn-mode ${viewMode === 'complete' ? 'active' : ''}`}
                        onClick={() => setViewMode('complete')}
                    >
                        Completo
                    </button>
                </div>
            </header>

            <div className="org-content">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    connectionLineType={ConnectionLineType.Step}
                    fitView
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    panOnDrag={true}
                    zoomOnScroll={true}
                    minZoom={0.2}
                    maxZoom={1.5}
                >
                    <Background color="#f1f1f1" gap={20} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
};

export default OrganizationChart;
