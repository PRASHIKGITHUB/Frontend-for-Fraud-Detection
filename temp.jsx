// // src/components/GetNeighbourByID.jsx
// import React, { useCallback, useMemo, useState, useEffect } from "react";
// import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
// import "reactflow/dist/style.css";

// // SAMPLE data (use this for now). We'll wire real API later.
// const SAMPLE = {
//   component: {
//     nodes: [
//       {
//         id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c",
//         labels: ["Person"],
//         props: { id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", weight: 1 },
//       },
//       {
//         id: "45b9aefb-e32f-4d69-885c-6580b5654a5d",
//         labels: ["Person"],
//         props: { id: "45b9aefb-e32f-4d69-885c-6580b5654a5d", weight: 1 },
//       },
//       {
//         id: "e2e1869d-5263-4dee-bb48-058e221655e8",
//         labels: ["Person"],
//         props: { id: "e2e1869d-5263-4dee-bb48-058e221655e8", weight: 1 },
//       },
//     ],
//     relationships: [
//       {
//         endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c",
//         startId: "45b9aefb-e32f-4d69-885c-6580b5654a5d",
//         type: "MATCHES",
//       },
//       {
//         endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c",
//         startId: "e2e1869d-5263-4dee-bb48-058e221655e8",
//         type: "MATCHES",
//       },
//     ],
//   },
// };

// function createNodesFromData(data) {
//   const cols = 5;
//   return data.map((item, i) => {
//     const x = (i % cols) * 220;
//     const y = Math.floor(i / cols) * 140;
//     // use stable id from source if available
//     const nodeId = item.id || `${item.label}-${i}`;
//     return {
//       id: nodeId,
//       position: { x, y },
//       data: { label: item.label, props: item.props },
//       type: "typedNode",
//       extent: "prevent",
//     };
//   });
// }

// function SimpleNode({ data }) {
//   const label = (data.label || "").toLowerCase();

//   if (label === "person") {
//     return (
//       <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
//         <svg width="100" height="60" viewBox="0 0 100 60">
//           <circle cx="50" cy="30" r="24" className="fill-green-300 stroke-green-700 stroke-2" />
//         </svg>
//         <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">
//           {data.props?.name || data.props?.id || data.label}
//         </div>
//       </div>
//     );
//   }

//   if (label === "transaction") {
//     return (
//       <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
//         <svg width="100" height="60" viewBox="0 0 100 60">
//           <rect x="6" y="10" width="88" height="40" rx="6" className="fill-blue-300 stroke-blue-700 stroke-2" />
//         </svg>
//         <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.id || data.label}</div>
//       </div>
//     );
//   }

//   if (label === "operator") {
//     return (
//       <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
//         <svg width="100" height="60" viewBox="0 0 100 60">
//           <polygon points="50,2 94,30 50,58 6,30" className="fill-yellow-300 stroke-yellow-700 stroke-2" />
//         </svg>
//         <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.name || data.props?.id || data.label}</div>
//       </div>
//     );
//   }

//   if (label === "machine") {
//     return (
//       <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
//         <svg width="100" height="60" viewBox="0 0 100 60">
//           <ellipse cx="50" cy="30" rx="44" ry="22" className="fill-purple-300 stroke-purple-700 stroke-2" />
//         </svg>
//         <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.id || data.label}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
//       <svg width="100" height="60" viewBox="0 0 100 60">
//         <ellipse cx="50" cy="30" rx="44" ry="22" className="fill-gray-200 stroke-gray-600 stroke-2" />
//       </svg>
//       <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.name || data.props?.id || data.label}</div>
//     </div>
//   );
// }

// export default function GetNeighbourByID() {
//   const defaultBase = import.meta?.env?.VITE_API_BASE || "http://localhost:8000";

//   const [baseUrl, setBaseUrl] = useState(defaultBase);
//   const [txnId, setTxnId] = useState("");

//   // rawNodesData uses shape: { id, label, props }
//   const [rawNodesData, setRawNodesData] = useState([]);
//   const [nodes, setNodes] = useState([]);
//   const [edges, setEdges] = useState([]);

//   const [hoveredNode, setHoveredNode] = useState(null);
//   const [availableLabels, setAvailableLabels] = useState([]);
//   const [visibleLabels, setVisibleLabels] = useState(new Set());
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const nodeTypes = useMemo(() => ({ typedNode: SimpleNode }), []);

//   // On mount - load the SAMPLE data into the canonical shape we expect
//   useEffect(() => {
//     const nodesFromSample = (SAMPLE.component.nodes || []).map((n) => ({
//       id: n.id,
//       label: n.labels?.[0] || "Node",
//       props: n.props || {},
//     }));

//     const rels = SAMPLE.component.relationships || [];

//     // Create edges - stable, simple config that works across reactflow versions
//     const rfEdges = rels.map((r, i) => {
//       // markerEnd: use MarkerType if available, otherwise fallback string 'arrowclosed'
//       const markerEnd = { type: MarkerType && MarkerType.ArrowClosed ? MarkerType.ArrowClosed : "arrowclosed" };
//       return {
//         id: `e-${i}`,
//         source: r.startId,
//         target: r.endId,
//         label: r.type,
//         type: "straight", // simplest guaranteed-to-render type
//         animated: false,
//         markerEnd,
//         // visible style to ensure it's easy to see during debugging
//         style: { strokeWidth: 2, stroke: "#0f172a" },
//         data: { raw: r }, // keep original rel props if you want to open on click later
//       };
//     });

//     setRawNodesData(nodesFromSample);
//     setEdges(rfEdges);
//   }, []);

//   useEffect(() => {
//     const created = createNodesFromData(rawNodesData);
//     setNodes(created);

//     const labels = Array.from(new Set(rawNodesData.map((n) => n.label)));
//     setAvailableLabels(labels);

//     setVisibleLabels((prev) => {
//       if (prev && prev.size > 0) return prev;
//       return new Set(labels);
//     });
//   }, [rawNodesData]);

//   // filter nodes based on visible labels
//   const filteredNodes = useMemo(() => {
//     if (!visibleLabels || visibleLabels.size === 0) return nodes;
//     return nodes.filter((n) => visibleLabels.has(n.data.label));
//   }, [nodes, visibleLabels]);

//   // only show edges whose both ends are currently visible (so filter respects label toggles)
//   const filteredEdges = useMemo(() => {
//     const visibleIds = new Set(filteredNodes.map((n) => n.id));
//     return edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
//   }, [edges, filteredNodes]);

//   const toggleLabel = useCallback((label) => {
//     setVisibleLabels((prev) => {
//       const next = new Set(prev);
//       if (next.has(label)) next.delete(label);
//       else next.add(label);
//       return next;
//     });
//   }, []);

//   const onNodeMouseEnter = useCallback((event, node) => setHoveredNode(node?.data ?? null), []);
//   const onNodeMouseLeave = useCallback(() => setHoveredNode(null), []);

//   // DEBUG logging to inspect shapes & ids in console
//   useEffect(() => {
//     console.log("DEBUG rawNodesData:", rawNodesData);
//     console.log("DEBUG nodes:", nodes);
//     console.log("DEBUG edges:", edges);
//     console.log("DEBUG filteredNodes ids:", filteredNodes.map((n) => n.id));
//     console.log("DEBUG filteredEdges:", filteredEdges);
//   }, [rawNodesData, nodes, edges, filteredNodes, filteredEdges]);

//   return (
//     <div className="relative h-[90vh] w-full rounded-lg border p-3 bg-white">
//       {/* ---------- Controls ---------- */}
//       <div className="mb-3 flex gap-2">
//         <input className="rounded border px-2 py-1 text-sm w-60" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="API base URL" />
//         <input className="rounded border px-2 py-1 text-sm w-40" value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="txn/component id (e.g. ff9d...)" />
//         {/* removed blast radius input as requested */}
//         <button className="rounded bg-blue-600 px-3 py-1 text-white text-sm" disabled={loading}>
//           {loading ? "Loading..." : "Fetch (not wired yet)"}
//         </button>
//       </div>

//       {/* ---------- Right side: filters + details ---------- */}
//       <div className="absolute top-3 right-3 z-40 flex flex-col items-end gap-3">
//         {/* Filters */}
//         <div className="rounded border bg-slate-50 p-2 shadow">
//           <div className="text-xs font-semibold mb-2">Filter node types</div>
//           <div className="flex flex-col text-xs max-h-40 overflow-auto">
//             {availableLabels.length === 0 && <div className="text-xs text-slate-500">No labels</div>}
//             {availableLabels.map((label) => (
//               <label key={label} className="inline-flex items-center gap-2">
//                 <input type="checkbox" checked={visibleLabels.has(label)} onChange={() => toggleLabel(label)} />
//                 <span>{label}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         {/* Details panel */}
//         <div className="w-72 rounded-lg border bg-slate-50 p-3 shadow">
//           <div className="text-sm font-semibold">Node details</div>
//           {!hoveredNode && <div className="mt-2 text-xs text-slate-500">Hover a node to see its properties</div>}
//           {hoveredNode && (
//             <div className="mt-2 text-xs text-slate-700">
//               <div className="font-medium">{hoveredNode.label}</div>
//               <div className="mt-1 space-y-1 max-h-40 overflow-auto">
//                 {Object.entries(hoveredNode.props || {}).map(([k, v]) => (
//                   <div key={k} className="flex justify-between border-b py-1">
//                     <span className="text-[11px] text-slate-500 font-semibold">{k}</span>
//                     <span className="text-[11px] truncate ml-2">{String(v)}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ---------- Main canvas (shows nodes + relationships) ---------- */}
//       <div style={{ height: "75vh" }} className="rounded">
//         <ReactFlow
//           nodes={filteredNodes}
//           // prefer filteredEdges (respects label toggles). If filteredEdges is empty but edges exists,
//           // we fall back to edges so debugging shows relationships even if filtering accidentally removed them.
//           edges={filteredEdges.length > 0 ? filteredEdges : edges}
//           nodeTypes={nodeTypes}
//           onNodeMouseEnter={onNodeMouseEnter}
//           onNodeMouseLeave={onNodeMouseLeave}
//           fitView
//         >
//           <Background />
//           <Controls />
//         </ReactFlow>
//       </div>

//       {/* ---------- Footer: status + legend ---------- */}
//       <div className="mt-2 flex items-center justify-between">
//         <div className="text-xs text-slate-500">{error ? `Error: ${error}` : `Nodes: ${rawNodesData.length}`}</div>

//         <div className="flex gap-3 items-center text-xs">
//           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-300" /> <span>Person</span></div>
//           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-300" /> <span>Transaction</span></div>
//           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-300" /> <span>Operator</span></div>
//           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-300" /> <span>Machine</span></div>
//         </div>
//       </div>
//     </div>
//   );
// }




// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$44


// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import ForceGraph2D from 'react-force-graph-2d';

// // Updated component: only two node types (Probe, Query) and one relation type (matches).
// // Still uses react-force-graph-2d for scalable Canvas rendering. Click "Fetch Nodes"
// // to generate random sample data (no blast radius input). Replace the generator with an
// // API call later that returns the same shape: { nodes: [...], links: [...] }.

// export default function GetNeighbourByID() {
//   const [baseUrl, setBaseUrl] = useState(import.meta?.env?.VITE_API_BASE || 'http://localhost:8000');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // graph state
//   const [graphData, setGraphData] = useState({ nodes: [], links: [] });
//   const [availableLabels, setAvailableLabels] = useState([]);
//   const [visibleLabels, setVisibleLabels] = useState(new Set());
//   const [hoveredNode, setHoveredNode] = useState(null);

//   const fgRef = useRef();

//   // only two labels now
//   const LABELS = ['Probe', 'Query'];

//   // generate random graph: numProbes + numQueries = totalNodes
//   function generateRandomGraph(totalNodes = 1000, probeRatio = 0.2, avgMatchesPerProbe = 3) {
//     const numProbes = Math.max(1, Math.round(totalNodes * probeRatio));
//     const numQueries = Math.max(1, totalNodes - numProbes);

//     const nodes = [];
//     // probes: id like P1, P2...
//     for (let i = 0; i < numProbes; i++) {
//       nodes.push({ id: `P${i + 1}`, label: 'Probe', props: { probeId: `P${i + 1}`, value: Math.floor(Math.random() * 1000) } });
//     }
//     // queries: id like Q1, Q2...
//     for (let j = 0; j < numQueries; j++) {
//       nodes.push({ id: `Q${j + 1}`, label: 'Query', props: { queryId: `Q${j + 1}`, text: `query_text_${j + 1}` } });
//     }

//     const links = [];
//     // For each probe, create a few matches to random queries
//     for (let i = 0; i < numProbes; i++) {
//       const probeId = `P${i + 1}`;
//       const matches = Math.max(1, Math.round(avgMatchesPerProbe + (Math.random() - 0.5) * 2));
//       for (let k = 0; k < matches; k++) {
//         const qIdx = Math.floor(Math.random() * numQueries) + 1;
//         links.push({ source: probeId, target: `Q${qIdx}`, type: 'matches', props: { score: Math.random().toFixed(3) } });
//       }
//     }

//     return { nodes, links };
//   }

//   // update labels set when graph changes
//   useEffect(() => {
//     const labels = Array.from(new Set(graphData.nodes.map((n) => n.label)));
//     setAvailableLabels(labels);
//     setVisibleLabels((prev) => (prev && prev.size > 0 ? prev : new Set(labels)));
//   }, [graphData]);

//   const filteredGraph = useMemo(() => {
//     if (!visibleLabels || visibleLabels.size === 0) return graphData;
//     const nodes = graphData.nodes.filter((n) => visibleLabels.has(n.label));
//     const nodeSet = new Set(nodes.map((n) => n.id));
//     const links = graphData.links.filter((l) => nodeSet.has(String(l.source)) && nodeSet.has(String(l.target)));
//     return { nodes, links };
//   }, [graphData, visibleLabels]);

//   const toggleLabel = useCallback((label) => {
//     setVisibleLabels((prev) => {
//       const next = new Set(prev);
//       if (next.has(label)) next.delete(label);
//       else next.add(label);
//       return next;
//     });
//   }, []);

//   const fetchNodes = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       // For now we generate local random data shaped as { nodes, links }.
//       // Replace this with your API call later. Example API shape expected:
//       // { nodes: [{id, label, props}], links: [{source, target, type, props}] }
//       const random = generateRandomGraph(1000, 0.2, 3);
//       setGraphData(random);

//       // warm-up layout briefly then pause to save CPU for large graphs
//       setTimeout(() => {
//         try {
//           fgRef.current && fgRef.current.resumeAnimation && fgRef.current.resumeAnimation();
//           setTimeout(() => fgRef.current && fgRef.current.pauseAnimation && fgRef.current.pauseAnimation(), 2000);
//         } catch (e) {}
//       }, 50);
//     } catch (err) {
//       console.error(err);
//       setError(String(err));
//     } finally {
//       setLoading(false);
//     }
//   }, [baseUrl]);

//   // draw fast node shapes on canvas
//   const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
//     const r = Math.max(1.5, 5 / globalScale);
//     ctx.beginPath();

//     if (node.label === 'Probe') {
//       // circle for probe
//       ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
//       ctx.fillStyle = node === hoveredNode ? '#f97316' : '#34d399';
//       ctx.fill();
//       ctx.strokeStyle = '#065f46';
//       ctx.lineWidth = 1;
//       ctx.stroke();
//     } else if (node.label === 'Query') {
//       // square for query
//       const s = r + 2;
//       ctx.rect(node.x - s, node.y - s, s * 2, s * 2);
//       ctx.fillStyle = node === hoveredNode ? '#60a5fa' : '#bfdbfe';
//       ctx.fill();
//       ctx.strokeStyle = '#1e3a8a';
//       ctx.lineWidth = 1;
//       ctx.stroke();
//     } else {
//       ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
//       ctx.fillStyle = '#e5e7eb';
//       ctx.fill();
//       ctx.strokeStyle = '#374151';
//       ctx.stroke();
//     }

//     // draw tiny label when zoomed in
//     if (globalScale > 2) {
//       const label = node.props?.probeId || node.props?.queryId || node.id;
//       ctx.font = `${12 / globalScale}px Sans-Serif`;
//       ctx.fillStyle = '#111827';
//       ctx.textAlign = 'center';
//       ctx.fillText(label, node.x, node.y - (r + 6 / globalScale));
//     }
//   }, [hoveredNode]);

//   return (
//     <div className="relative h-[90vh] w-full rounded-lg border p-3 bg-white">
//       <div className="mb-3 flex gap-2 items-center">
//         <input className="rounded border px-2 py-1 text-sm w-72" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="API base URL" />
//         <button className="rounded bg-blue-600 px-3 py-1 text-white text-sm" onClick={fetchNodes} disabled={loading}>
//           {loading ? 'Loading...' : 'Fetch Nodes'}
//         </button>
//         <div className="text-xs text-slate-500 ml-3">Nodes: {graphData.nodes.length}</div>
//         {error && <div className="text-xs text-red-600 ml-3">Error: {error}</div>}
//       </div>

//       {/* Right: filters + details */}
//       <div className="absolute top-3 right-3 z-40 flex flex-col items-end gap-3">
//         <div className="rounded border bg-slate-50 p-2 shadow">
//           <div className="text-xs font-semibold mb-2">Filter node types</div>
//           <div className="flex flex-col text-xs max-h-40 overflow-auto">
//             {availableLabels.length === 0 && <div className="text-xs text-slate-500">No labels</div>}
//             {availableLabels.map((label) => (
//               <label key={label} className="inline-flex items-center gap-2">
//                 <input type="checkbox" checked={visibleLabels.has(label)} onChange={() => toggleLabel(label)} />
//                 <span>{label}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         <div className="w-72 rounded-lg border bg-slate-50 p-3 shadow">
//           <div className="text-sm font-semibold">Node details</div>
//           {!hoveredNode && <div className="mt-2 text-xs text-slate-500">Hover a node to see its properties</div>}
//           {hoveredNode && (
//             <div className="mt-2 text-xs text-slate-700 max-h-40 overflow-auto">
//               <div className="font-medium">{hoveredNode.props?.probeId || hoveredNode.props?.queryId || hoveredNode.label || hoveredNode.id}</div>
//               <div className="mt-1 space-y-1">
//                 {Object.entries(hoveredNode.props || {}).map(([k, v]) => (
//                   <div key={k} className="flex justify-between border-b py-1">
//                     <span className="text-[11px] text-slate-500 font-semibold">{k}</span>
//                     <span className="text-[11px] truncate ml-2">{String(v)}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Main canvas */}
//       <div style={{ height: '75vh' }} className="rounded">
//         <ForceGraph2D
//           ref={fgRef}
//           graphData={filteredGraph}
//           nodeId="id"
//           linkDirectionalParticles={0}
//           linkWidth={0.6}
//           linkColor={() => 'rgba(124,58,237,0.35)'}
//           nodeCanvasObject={nodeCanvasObject}
//           onNodeHover={(node) => setHoveredNode(node)}
//           onNodeClick={(node) => {
//             setHoveredNode(node);
//             try {
//               fgRef.current.centerAt(node.x, node.y, 400);
//               fgRef.current.zoom(1.2, 400);
//             } catch (e) {}
//           }}
//           enableNodeDrag={true}
//           cooldownTicks={0}
//           width={window.innerWidth}
//           height={600}
//         />
//       </div>

//       {/* Footer */}
//       <div className="mt-2 flex items-center justify-between">
//         <div className="text-xs text-slate-500">Showing nodes: {filteredGraph.nodes.length}</div>
//         <div className="flex gap-3 items-center text-xs">
//           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-300" /> <span>Probe</span></div>
//           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-300" /> <span>Query</span></div>
//           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-300" /> <span>matches (link)</span></div>
//         </div>
//       </div>
//     </div>
//   );
// }


// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$44


// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import ForceGraph2D from 'react-force-graph-2d';

// // Fetches a single component by id from /components/:id and renders it as a graph
// // with two node types: Probe (mapped from labels containing `person` or `probe`) and Query.
// // This version does NOT generate random data — it only renders API responses.

// export default function GetNeighbourByID() {
//   const [baseUrl, setBaseUrl] = useState(import.meta?.env?.VITE_API_BASE || 'http://10.8.12.212:8080');
//   const [componentId, setComponentId] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const [graphData, setGraphData] = useState({ nodes: [], links: [] });
//   const [availableLabels, setAvailableLabels] = useState([]);
//   const [visibleLabels, setVisibleLabels] = useState(new Set());
//   const [hoveredNode, setHoveredNode] = useState(null);

//   const fgRef = useRef();

//   // Map backend labels -> Probe/Query
//   function mapLabelToType(labels) {
//     if (!labels) return 'Query';
//     const low = labels.map((l) => String(l).toLowerCase()).join(',');
//     if (low.includes('person') || low.includes('probe')) return 'Probe';
//     return 'Query';
//   }

//   // Convert single component object -> { nodes, links }
//   function convertComponentToGraph(component) {
//     if (!component) return { nodes: [], links: [] };
//     const nodeMap = new Map();
//     const links = [];

//     for (const n of component.nodes || []) {
//       const id = String(n.id);
//       nodeMap.set(id, {
//         id,
//         label: mapLabelToType(n.labels || []),
//         origLabels: n.labels || [],
//         props: n.props || {},
//       });
//     }

//     for (const r of component.relationships || []) {
//       const source = String(r.startId ?? r.start ?? r.fromId ?? r.startNodeId ?? r.startnode ?? '');
//       const target = String(r.endId ?? r.end ?? r.toId ?? r.endNodeId ?? r.endnode ?? '');
//       if (!source || !target) continue;
//       const relType = String((r.type || r.relType || '').toLowerCase());
//       if (relType && !relType.includes('match')) continue; // only include matches
//       links.push({ source, target, type: 'matches', props: r.props || {} });
//     }

//     const nodes = Array.from(nodeMap.values());
//     return { nodes, links };
//   }

//   // Fetch a single component by id
//   const fetchComponent = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     setGraphData({ nodes: [], links: [] });

//     if (!componentId) {
//       setError('Please enter a component id');
//       setLoading(false);
//       return;
//     }

//     try {
//       const url = `${baseUrl.replace(/\/+$/, '')}/components/${encodeURIComponent(componentId)}`;
//       const res = await fetch(url);
//       if (!res.ok) throw new Error(`API error ${res.status}`);
//       const body = await res.json();

//       // API returns { component: { nodes: [...], relationships: [...] } }
//       const comp = body.component ?? body;
//       if (!comp || (!Array.isArray(comp.nodes) && !Array.isArray(comp.relationships))) {
//         setError('API returned unexpected shape for component');
//         setGraphData({ nodes: [], links: [] });
//         setLoading(false);
//         return;
//       }

//       const graph = convertComponentToGraph(comp);
//       setGraphData(graph);

//       setTimeout(() => {
//         try {
//           fgRef.current?.resumeAnimation?.();
//           setTimeout(() => fgRef.current?.pauseAnimation?.(), 1500);
//         } catch (e) {}
//       }, 30);
//     } catch (err) {
//       console.error('Fetch error:', err);
//       setError(String(err));
//       setGraphData({ nodes: [], links: [] });
//     } finally {
//       setLoading(false);
//     }
//   }, [baseUrl, componentId]);

//   // update label filters when graph changes
//   useEffect(() => {
//     const labels = Array.from(new Set(graphData.nodes.map((n) => n.label)));
//     setAvailableLabels(labels);
//     setVisibleLabels((prev) => (prev && prev.size > 0 ? prev : new Set(labels)));
//   }, [graphData]);

//   const filteredGraph = useMemo(() => {
//     if (!visibleLabels || visibleLabels.size === 0) return graphData;
//     const nodes = graphData.nodes.filter((n) => visibleLabels.has(n.label));
//     const nodeSet = new Set(nodes.map((n) => n.id));
//     const links = graphData.links.filter((l) => nodeSet.has(String(l.source)) && nodeSet.has(String(l.target)));
//     return { nodes, links };
//   }, [graphData, visibleLabels]);

//   const toggleLabel = useCallback((label) => {
//     setVisibleLabels((prev) => {
//       const next = new Set(prev);
//       if (next.has(label)) next.delete(label);
//       else next.add(label);
//       return next;
//     });
//   }, []);

//   const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
//     const r = Math.max(1.5, 5 / globalScale);
//     ctx.beginPath();
//     if (String(node.label).toLowerCase() === 'probe') {
//       ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
//       ctx.fillStyle = node === hoveredNode ? '#f97316' : '#34d399';
//       ctx.fill();
//       ctx.strokeStyle = '#065f46';
//       ctx.stroke();
//     } else {
//       const s = r + 2;
//       ctx.rect(node.x - s, node.y - s, s * 2, s * 2);
//       ctx.fillStyle = node === hoveredNode ? '#60a5fa' : '#bfdbfe';
//       ctx.fill();
//       ctx.strokeStyle = '#1e3a8a';
//       ctx.stroke();
//     }

//     if (globalScale > 2) {
//       const label = node.props?.id || node.props?.probeId || node.props?.queryId || node.id;
//       ctx.font = `${12 / globalScale}px Sans-Serif`;
//       ctx.fillStyle = '#111827';
//       ctx.textAlign = 'center';
//       ctx.fillText(label, node.x, node.y - (r + 6 / globalScale));
//     }
//   }, [hoveredNode]);

//   return (
//     <div className="relative h-[90vh] w-full rounded-lg border p-3 bg-white">
//       <div className="mb-3 flex gap-2 items-center">
//         <input className="rounded border px-2 py-1 text-sm w-72" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="API base URL" />
//         <input className="rounded border px-2 py-1 text-sm w-80" value={componentId} onChange={(e) => setComponentId(e.target.value)} placeholder="Component ID (e.g. ff9dbe64-...)" />
//         <button className="rounded bg-blue-600 px-3 py-1 text-white text-sm" onClick={fetchComponent} disabled={loading || !componentId}>
//           {loading ? 'Loading...' : 'Fetch Nodes'}
//         </button>
//         <div className="text-xs text-slate-500 ml-3">Nodes: {graphData.nodes.length}</div>
//         {error && <div className="text-xs text-red-600 ml-3">Error: {error}</div>}
//       </div>

//       {/* right panel */}
//       <div className="absolute top-3 right-3 z-40 flex flex-col items-end gap-3">
//         <div className="rounded border bg-slate-50 p-2 shadow">
//           <div className="text-xs font-semibold mb-2">Filter node types</div>
//           <div className="flex flex-col text-xs max-h-40 overflow-auto">
//             {availableLabels.length === 0 && <div className="text-xs text-slate-500">No labels</div>}
//             {availableLabels.map((label) => (
//               <label key={label} className="inline-flex items-center gap-2">
//                 <input type="checkbox" checked={visibleLabels.has(label)} onChange={() => toggleLabel(label)} />
//                 <span>{label}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         <div className="w-72 rounded-lg border bg-slate-50 p-3 shadow">
//           <div className="text-sm font-semibold">Node details</div>
//           {!hoveredNode && <div className="mt-2 text-xs text-slate-500">Hover a node to see its properties</div>}
//           {hoveredNode && (
//             <div className="mt-2 text-xs text-slate-700 max-h-40 overflow-auto">
//               <div className="font-medium">{hoveredNode.props?.id || hoveredNode.props?.probeId || hoveredNode.props?.queryId || hoveredNode.label || hoveredNode.id}</div>
//               <div className="mt-1 space-y-1">
//                 {Object.entries(hoveredNode.props || {}).map(([k, v]) => (
//                   <div key={k} className="flex justify-between border-b py-1">
//                     <span className="text-[11px] text-slate-500 font-semibold">{k}</span>
//                     <span className="text-[11px] truncate ml-2">{String(v)}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* canvas */}
//       <div style={{ height: '75vh' }} className="rounded">
//         <ForceGraph2D
//           ref={fgRef}
//           graphData={filteredGraph}
//           nodeId="id"
//           linkDirectionalParticles={0}
//           linkWidth={(link) => (link.props?.score ? Math.max(0.5, Math.min(4, Number(link.props.score) * 4)) : 0.6)}
//           linkColor={() => 'rgba(124,58,237,0.35)'}
//           nodeCanvasObject={nodeCanvasObject}
//           onNodeHover={(node) => setHoveredNode(node)}
//           onNodeClick={(node) => {
//             setHoveredNode(node);
//             try {
//               fgRef.current.centerAt(node.x, node.y, 400);
//               fgRef.current.zoom(1.2, 400);
//             } catch (e) {}
//           }}
//           enableNodeDrag={true}
//           cooldownTicks={0}
//           width={window.innerWidth}
//           height={600}
//         />
//       </div>

//       {/* footer */}
//       <div className="mt-2 flex items-center justify-between">
//         <div className="text-xs text-slate-500">Showing nodes: {filteredGraph.nodes.length}</div>
//         <div className="flex gap-3 items-center text-xs">
//           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-300" /> <span>Probe</span></div>
//           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-300" /> <span>Query</span></div>
//           <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-300" /> <span>matches (link)</span></div>
//         </div>
//       </div>
//     </div>
//   );
// }


// npm i react-force-graph
// Neo4jForceGraph.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

/**
 * Props:
 *  - rawData: an object like the JSON you posted (optional)
 *  - fetchUrl: a string URL to fetch that JSON from (optional)
 *  - width / height: optional numbers
 *
 * Priority: if fetchUrl provided, it will fetch and use that; otherwise it uses rawData.
 */
export default function Neo4jForceGraph({ rawData, fetchUrl, width = 800, height = 500 }) {
  const [data, setData] = useState(rawData ?? null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!fetchUrl) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(fetchUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Failed to load graph data:", err);
      }
    })();
    return () => controller.abort();
  }, [fetchUrl]);

  // Convert your Neo4j-ish JSON structure to ForceGraph's { nodes, links }
  const graph = useMemo(() => {
    if (!data || !data.component) return { nodes: [], links: [] };

    const rawNodes = data.component.nodes ?? [];
    const rawRels = data.component.relationships ?? [];

    const nodes = rawNodes.map((n) => {
      // prefer props.id, fallback to n.id
      const id = (n.props && (n.props.id ?? n.props.uuid)) ?? n.id;
      return {
        id,
        labels: n.labels ?? [],
        label: n.props?.label ?? null,
        val: n.props?.weight ?? 1,
        props: n.props ?? {},
      };
    });

    const links = rawRels.map((r, idx) => ({
      source: r.startId,
      target: r.endId,
      type: r.type ?? "REL",
      id: r.id ?? `rel-${idx}`,
      props: r.props ?? {},
    }));

    return { nodes, links };
  }, [data]);

  // optional: adapt width to container if you want responsive behavior
  // (kept simple here; you can measure containerRef.current.offsetWidth if needed)
  return (
    <div ref={containerRef} style={{ width: "100%", height }}>
      <ForceGraph2D
        graphData={graph}
        nodeLabel={(node) => {
          const label = node.label ?? (node.labels && node.labels.join(", "));
          return `${node.id}${label ? ` — ${label}` : ""}`;
        }}
        nodeAutoColorBy="labels"
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1}
        linkLabel={(l) => l.type}
        width={width}
        height={height}
        nodeVal={(n) => n.val}
        // optional node render increase size of nodes based on val
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label ?? (node.labels && node.labels.join(", "));
          const text = node.id;
          const fontSize = 12 / globalScale + (node.val ? Math.log(node.val + 1) * 2 : 0);
          ctx.beginPath();
          ctx.arc(node.x, node.y, 6 + (node.val ? Math.log(node.val + 1) * 2 : 0), 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillText(text, node.x + 8, node.y + 4);
        }}
        // make dragging smoother
        onNodeDragEnd={(node) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
      />
    </div>
  );
}

