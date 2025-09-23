// ForceGraphVis.jsx
import React, { useEffect, useRef, useMemo } from "react";
// <-- Fixed import
import { DataSet, Network } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";

/**
 * ForceGraphVis (vis-network)
 *
 * Props:
 *  - payload: { components: [...] } OR { component: {...} } OR array of components
 *  - component: same as above (alt prop)
 *  - height: number | string (default 750)
 */
export default function ForceGraphVis({ payload, component: componentProp, height = 750 }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

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
    }
    
  ];

  const resolved = componentProp ?? payload ?? { components: demoComponents };
  const normalizedComponents = normalizeComponents(resolved) || demoComponents;

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

  return (
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
  );
}




