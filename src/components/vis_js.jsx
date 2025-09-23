// // ForceGraphVis.jsx
// import React, { useEffect, useRef, useMemo } from "react";
// // <-- Fixed import
// import { DataSet, Network } from "vis-network/standalone";
// import "vis-network/styles/vis-network.css";

// /**
//  * ForceGraphVis (vis-network)
//  *
//  * Props:
//  *  - payload: { components: [...] } OR { component: {...} } OR array of components
//  *  - component: same as above (alt prop)
//  *  - height: number | string (default 750)
//  */
// export default function ForceGraphVis({ payload, component: componentProp, height = 750 }) {
//   const containerRef = useRef(null);
//   const networkRef = useRef(null);

//   const normalizeComponents = (input) => {
//     if (!input) return null;
//     if (Array.isArray(input)) return input;
//     if (input.components && Array.isArray(input.components)) return input.components;
//     if (input.component && Array.isArray(input.component)) return input.component;
//     if (input.nodes || input.relationships) return [input];
//     return null;
//   };

//   const demoComponents = [
//     {
//       nodes: [
//         { id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", labels: ["Person"], props: { id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", weight: 1 } },
//         { id: "45b9aefb-e32f-4d69-885c-6580b5654a5d", labels: ["Person"], props: { id: "45b9aefb-e32f-4d69-885c-6580b5654a5d", weight: 1 } },
//         { id: "e2e1869d-5263-4dee-bb48-058e221655e8", labels: ["Person"], props: { id: "e2e1869d-5263-4dee-bb48-058e221655e8", weight: 1 } },
//       ],
//       relationships: [
//         { startId: "45b9aefb-e32f-4d69-885c-6580b5654a5d", endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", type: "MATCHES" },
//         { startId: "e2e1869d-5263-4dee-bb48-058e221655e8", endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", type: "MATCHES" },
//       ],
//     }
    
//   ];

//   const resolved = componentProp ?? payload ?? { components: demoComponents };
//   const normalizedComponents = normalizeComponents(resolved) || demoComponents;

//   const { visNodes, visEdges, groups } = useMemo(() => {
//     const nodeMap = new Map();
//     const edges = [];
//     const palette = ["#4a90e2", "#50e3c2", "#f5a623", "#bd10e0", "#7ed321", "#b8e986"];

//     normalizedComponents.forEach((comp, compIdx) => {
//       (comp.nodes || []).forEach((n) => {
//         if (!nodeMap.has(n.id)) {
//           const label = n.props?.id || n.id;
//           nodeMap.set(n.id, {
//             id: n.id,
//             label,
//             title: `<div><strong>ID:</strong> ${n.id}<br/><strong>Labels:</strong> ${(n.labels||[]).join(", ")}<br/><strong>Props:</strong><pre style="white-space:pre-wrap">${JSON.stringify(n.props||{},null,2)}</pre></div>`,
//             group: `g${compIdx}`,
//             value: n.props?.weight ?? 1,
//           });
//         }
//       });

//       (comp.relationships || []).forEach((r, i) => {
//         edges.push({
//           id: `e-${compIdx}-${i}-${r.startId}-${r.endId}`,
//           from: r.startId,
//           to: r.endId,
//           arrows: "to",
//           label: r.type || "",
//           font: { align: "top" },
//         });
//       });
//     });

//     const groups = {};
//     normalizedComponents.forEach((_, i) => {
//       groups[`g${i}`] = {
//         color: { background: palette[i % palette.length], border: "#666" },
//         shape: "dot",
//       };
//     });

//     return { visNodes: Array.from(nodeMap.values()), visEdges: edges, groups };
//   }, [normalizedComponents]);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     const nodesDS = new DataSet(visNodes);
//     const edgesDS = new DataSet(visEdges);

//     const data = { nodes: nodesDS, edges: edgesDS };

//     const options = {
//       physics: {
//         stabilization: true,
//         barnesHut: {
//           gravitationalConstant: -8000,
//           springLength: 200,
//           springConstant: 0.04,
//           avoidOverlap: 0.5,
//         },
//         minVelocity: 0.75,
//       },
//       nodes: {
//         shape: "dot",
//         size: 16,
//         font: { multi: true, vadjust: -10 },
//       },
//       edges: {
//         smooth: { type: "continuous" },
//         arrows: { to: { enabled: true, scaleFactor: 0.8, type: "triangle" } },
//         color: { color: "#888", highlight: "#ff4500" },
//       },
//       groups,
//       interaction: {
//         hover: true,
//         tooltipDelay: 100,
//         navigationButtons: true,
//         keyboard: true,
//       },
//     };

//     if (networkRef.current) {
//       try { networkRef.current.destroy(); } catch (e) {}
//       networkRef.current = null;
//     }

//     networkRef.current = new Network(containerRef.current, data, options);

//     networkRef.current.once("stabilizationIterationsDone", () => {
//       try { networkRef.current.fit({ animation: { duration: 300 } }); } catch (e) {}
//     });

//     return () => {
//       if (networkRef.current) {
//         try { networkRef.current.destroy(); } catch (e) {}
//         networkRef.current = null;
//       }
//     };
//   }, [visNodes, visEdges, groups]);

//   return (
//     <div
//       ref={containerRef}
//       style={{
//         width: "100%",
//         height: typeof height === "number" ? `${height}px` : height,
//         border: "1px solid #e6e6e6",
//         borderRadius: 6,
//         background: "#fff",
//       }}
//     />
//   );
// }









// ForceGraphVis-with-fetch.jsx
import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
// <-- Fixed import
import { DataSet, Network } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";

/**
 * ForceGraphVis (vis-network) - enhanced with fetch-by-id
 *
 * Usage notes:
 *  - This component will call `${process.env.REACT_APP_BASE_URL}/components/{id}` when you click Fetch
 *    (make sure REACT_APP_BASE_URL is defined in your .env, e.g. REACT_APP_BASE_URL=http://localhost:8080)
 *  - If the endpoint returns { component: { nodes: [...], relationships: [...] } } it will be handled.
 *  - You can also pass `payload` or `component` props as before.
 *
 * Props:
 *  - payload: { components: [...] } OR { component: {...} } OR array of components
 *  - component: same as above (alt prop)
 *  - height: number | string (default 750)
 */
export default function ForceGraphVis({ payload, component: componentProp, height = 750 }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  // UI state for fetching by id
  const [idInput, setIdInput] = useState("");
  const [fetchedResolved, setFetchedResolved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeComponents = (input) => {
    if (!input) return null;
    if (Array.isArray(input)) return input;
    if (input.components && Array.isArray(input.components)) return input.components;
    if (input.component && Array.isArray(input.component)) return input.component;
    if (input.nodes || input.relationships) return [input];
    return null;
  };

  const demoComponents = [
    {
      nodes: [
        { id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", labels: ["Person"], props: { id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", weight: 1 } },
        { id: "45b9aefb-e32f-4d69-885c-6580b5654a5d", labels: ["Person"], props: { id: "45b9aefb-e32f-4d69-885c-6580b5654a5d", weight: 1 } },
        { id: "e2e1869d-5263-4dee-bb48-058e221655e8", labels: ["Person"], props: { id: "e2e1869d-5263-4dee-bb48-058e221655e8", weight: 1 } },
      ],
      relationships: [
        { startId: "45b9aefb-e32f-4d69-885c-6580b5654a5d", endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", type: "MATCHES" },
        { startId: "e2e1869d-5263-4dee-bb48-058e221655e8", endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", type: "MATCHES" },
      ],
    },
  ];

  // Decide resolved source in this order: explicit prop -> payload prop -> fetched -> demo
  const resolvedSource = componentProp ?? payload ?? fetchedResolved ?? { components: demoComponents };
  const normalizedComponents = normalizeComponents(resolvedSource) || demoComponents;

  const { visNodes, visEdges, groups } = useMemo(() => {
    const nodeMap = new Map();
    const edges = [];
    const palette = ["#4a90e2", "#50e3c2", "#f5a623", "#bd10e0", "#7ed321", "#b8e986"];

    normalizedComponents.forEach((comp, compIdx) => {
      (comp.nodes || []).forEach((n) => {
        if (!nodeMap.has(n.id)) {
          const label = n.props?.id || n.id;
          nodeMap.set(n.id, {
            id: n.id,
            label,
            title: `<div><strong>ID:</strong> ${n.id}<br/><strong>Labels:</strong> ${(n.labels||[]).join(", ")}<br/><strong>Props:</strong><pre style="white-space:pre-wrap">${JSON.stringify(n.props||{},null,2)}</pre></div>`,
            group: `g${compIdx}`,
            value: n.props?.weight ?? 1,
          });
        }
      });

      (comp.relationships || []).forEach((r, i) => {
        edges.push({
          id: `e-${compIdx}-${i}-${r.startId}-${r.endId}`,
          from: r.startId,
          to: r.endId,
          arrows: "to",
          label: r.type || "",
          font: { align: "top" },
        });
      });
    });

    const groups = {};
    normalizedComponents.forEach((_, i) => {
      groups[`g${i}`] = {
        color: { background: palette[i % palette.length], border: "#666" },
        shape: "dot",
      };
    });

    return { visNodes: Array.from(nodeMap.values()), visEdges: edges, groups };
  }, [normalizedComponents]);

  // Fetch function
  const fetchById = useCallback(async (id, signal) => {
    setError(null);
    if (!id) {
      setError("Please provide an id.");
      return;
    }

    const base = process.env.REACT_APP_BASE_URL || process.env.BASE_URL || "";
    const baseClean = base.replace(/\/$/, "");
    const url = `${baseClean}/components/${encodeURIComponent(id)}`;

    setLoading(true);
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      const json = await res.json();

      // server may return { component: {...} } or { components: [...] } or array
      if (json.component) {
        setFetchedResolved({ component: json.component });
      } else if (json.components) {
        setFetchedResolved({ components: json.components });
      } else {
        setFetchedResolved(json);
      }
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') return; // ignore abort
      console.error(err);
      setError(err.message || String(err));
      setFetchedResolved(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep reference to in-flight fetch to abort on unmount or new fetch
  useEffect(() => {
    const controller = new AbortController();
    return () => controller.abort();
  }, []);

  // Re-create the network whenever nodes/edges/groups change
  useEffect(() => {
    if (!containerRef.current) return;

    const nodesDS = new DataSet(visNodes);
    const edgesDS = new DataSet(visEdges);

    const data = { nodes: nodesDS, edges: edgesDS };

    const options = {
      physics: {
        stabilization: true,
        barnesHut: {
          gravitationalConstant: -8000,
          springLength: 200,
          springConstant: 0.04,
          avoidOverlap: 0.5,
        },
        minVelocity: 0.75,
      },
      nodes: {
        shape: "dot",
        size: 16,
        font: { multi: true, vadjust: -10 },
      },
      edges: {
        smooth: { type: "continuous" },
        arrows: { to: { enabled: true, scaleFactor: 0.8, type: "triangle" } },
        color: { color: "#888", highlight: "#ff4500" },
      },
      groups,
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: true,
        keyboard: true,
      },
    };

    if (networkRef.current) {
      try { networkRef.current.destroy(); } catch (e) {}
      networkRef.current = null;
    }

    networkRef.current = new Network(containerRef.current, data, options);

    networkRef.current.once("stabilizationIterationsDone", () => {
      try { networkRef.current.fit({ animation: { duration: 300 } }); } catch (e) {}
    });

    return () => {
      if (networkRef.current) {
        try { networkRef.current.destroy(); } catch (e) {}
        networkRef.current = null;
      }
    };
  }, [visNodes, visEdges, groups]);

  // Handlers
  const handleFetchClick = async () => {
    const controller = new AbortController();
    await fetchById(idInput.trim(), controller.signal);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleFetchClick();
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <input
          placeholder="Enter component id"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', flex: '0 0 420px' }}
        />
        <button onClick={handleFetchClick} disabled={loading} style={{ padding: '8px 12px', borderRadius: 6 }}>
          {loading ? 'Fetching...' : 'Fetch'}
        </button>
        <div style={{ color: error ? '#b00020' : '#666', marginLeft: 8 }}>{error || (fetchedResolved ? 'Loaded from server' : '')}</div>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: typeof height === "number" ? `${height}px` : height,
          border: "1px solid #e6e6e6",
          borderRadius: 6,
          background: "#fff",
        }}
      />
    </div>
  );
}




