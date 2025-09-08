import React, { useCallback, useMemo, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

// ---------------- Sample data (nodes) ----------------
// Each object has a label (type of node) and props (its details)
const sampleData = [
  { label: "Transaction", props: { id: "T1-3150", ip_address: "183.138.87.116", timestamp: "2024-06-02T05:43:59.734506Z" } },
  { label: "Person", props: { age: 79, gender: "Other", name: "Urmi Toor", uid: "3150" } },
  { label: "Contact", props: { contact: "8536315737" } },
  { label: "Location", props: { location: "145407" } },
  { label: "Operator", props: { id: "10685", name: "James Peterson MD" } },
  { label: "Person", props: { age: 71, gender: "Other", name: "Tamanna Sabharwal", uid: "4554" } },
  { label: "Person", props: { age: 58, gender: "Male", name: "Raghav Ramachandran", uid: "2052" } },
  { label: "Person", props: { age: 31, gender: "Male", name: "Tarak Gola", uid: "4970" } },
  { label: "Machine", props: { id: "5104", installation: "2023-10-22", serial: "SN-5104-82063" } },
  { label: "Machine", props: { id: "5535", installation: "2019-01-17", serial: "SN-5535-91927" } },
  { label: "Machine", props: { id: "6171", installation: "2018-01-20", serial: "SN-6171-89635" } },
  { label: "Machine", props: { id: "6705", installation: "2020-01-16", serial: "SN-6705-20279" } },
  { label: "Transaction", props: { id: "T1-1153", ip_address: "100.43.170.36", timestamp: "2024-08-04T23:05:42.705457Z" } },
  { label: "Person", props: { age: 40, gender: "Male", name: "Ikbal Bajwa", uid: "1153" } },
  { label: "Station", props: { id: "3705" } },
  { label: "Operator", props: { id: "8290", name: "Richard Johnson" } },
  { label: "Operator", props: { id: "8859", name: "Joseph Pratt" } },
  { label: "Operator", props: { id: "10690", name: "Samantha Macias" } },
  { label: "Transaction", props: { id: "T1-5", ip_address: "180.214.196.207", timestamp: "2025-07-22T21:49:09.687644Z" } },
  { label: "Transaction", props: { id: "T1-4507", ip_address: "148.118.226.180", timestamp: "2023-08-28T00:51:33.753906Z" } },
  { label: "Device", props: { id: "14345", type: "Scanner" } },
  { label: "Transaction", props: { id: "T1-4081", ip_address: "195.182.203.209", timestamp: "2025-04-08T00:28:56.747862Z" } },
];

// ---------------- Utility: arrange nodes on a simple grid ----------------
function createNodesFromSample(data) {
  const cols = 4; // number of columns in grid
  return data.map((item, i) => {
    const x = (i % cols) * 220; // horizontal spacing
    const y = Math.floor(i / cols) * 140; // vertical spacing
    return {
      id: `${item.label}-${i}`, // unique id per node
      position: { x, y }, // coordinates on canvas
      data: { label: item.label, props: item.props }, // custom data for node
      type: "typedNode", // tells ReactFlow which custom renderer to use
      extent: "prevent", // prevents dragging nodes outside viewport
    };
  });
}

// ---------------- Custom Node Renderer ----------------
// Draws different colored shapes depending on the node label
function SimpleNode({ data }) {
  const label = (data.label || "").toLowerCase();

  function renderShape() {
    // Circle for Person
    if (label === "person") {
      return (
        <svg width="100" height="60" viewBox="0 0 100 60">
          <circle cx="50" cy="30" r="24" className="fill-green-300 stroke-green-700 stroke-2" />
        </svg>
      );
    }
    // Rectangle for Transaction
    if (label === "transaction") {
      return (
        <svg width="100" height="60" viewBox="0 0 100 60">
          <rect x="6" y="10" width="88" height="40" rx="6" className="fill-blue-300 stroke-blue-700 stroke-2" />
        </svg>
      );
    }
    // Diamond for Operator
    if (label === "operator") {
      return (
        <svg width="100" height="60" viewBox="0 0 100 60">
          <polygon points="50,2 94,30 50,58 6,30" className="fill-yellow-300 stroke-yellow-700 stroke-2" />
        </svg>
      );
    }
    // Ellipse for Machine
    if (label === "machine") {
      return (
        <svg width="100" height="60" viewBox="0 0 100 60">
          <ellipse cx="50" cy="30" rx="44" ry="22" className="fill-purple-300 stroke-purple-700 stroke-2" />
        </svg>
      );
    }
    // Fallback: gray ellipse for all others
    return (
      <svg width="100" height="60" viewBox="0 0 100 60">
        <ellipse cx="50" cy="30" rx="44" ry="22" className="fill-gray-200 stroke-gray-600 stroke-2" />
      </svg>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
      {renderShape()}
      {/* Display name if available, else label */}
      <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">
        {data.props?.name || data.label}
      </div>
    </div>
  );
}

// Map node type name to the custom component
const nodeTypes = { typedNode: SimpleNode };

// ---------------- Main Component ----------------
export default function GraphVisualizer() {
  // State to hold node currently hovered
  const [hoveredNode, setHoveredNode] = useState(null);

  // Prepare nodes & edges
  const nodes = useMemo(() => createNodesFromSample(sampleData), []);
  const edges = useMemo(() => [], []); // no edges for now

  // Event handlers to update hovered node state
  const onNodeMouseEnter = useCallback((event, node) => {
    setHoveredNode(node?.data ?? null);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  return (
    <div className="relative h-[80vh] w-full rounded-lg border p-2 bg-white">
      {/* Top-right panel showing node details */}
      <div className="absolute top-3 right-3 z-30 w-72 rounded-lg border bg-slate-50 p-3 shadow">
        <div className="text-sm font-semibold">Node details</div>
        {/* Show hint if no node is hovered */}
        {!hoveredNode && <div className="mt-2 text-xs text-slate-500">Hover a node to see its properties</div>}
        {/* Show properties if node hovered */}
        {hoveredNode && (
          <div className="mt-2 text-xs text-slate-700">
            <div className="font-medium">{hoveredNode.label}</div>
            <div className="mt-1 space-y-1 max-h-40 overflow-auto">
              {Object.entries(hoveredNode.props || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-1">
                  <span className="text-[11px] text-slate-500 font-semibold">{k}</span>
                  <span className="text-[11px] truncate ml-2">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* React Flow canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        fitView
      >
        {/* Grid background and controls */}
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
