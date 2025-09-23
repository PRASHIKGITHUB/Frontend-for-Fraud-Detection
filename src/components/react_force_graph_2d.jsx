import React, { useRef, useEffect, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";

/**
 * ForceGraphDirected — supports multiple components (subgraphs)
 *
 * Usage examples:
 *  <ForceGraphDirected /> // demo
 *  <ForceGraphDirected component={[compA, compB]} />
 *  <ForceGraphDirected payload={{ components: [compA, compB] }} />
 *
 * Where a component object is: { nodes: [{id, labels, props}], relationships: [{startId, endId, type}] }
 */
export default function ForceGraphDirected({ payload, component: componentProp, autoFetchUrl, height = 750 }) {
  // demo: properly represent two components using an array (no duplicate keys)
  const defaultPayload = {
    components: [
      {
        nodes: [
          { id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", labels: ["Person"], props: { id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", weight: 1 } },
          { id: "45b9aefb-e32f-4d69-885c-6580b5654a5d", labels: ["Person"], props: { id: "45b9aefb-e32f-4d69-885c-6580b5654a5d", weight: 1 } },
          { id: "e2e1869d-5263-4dee-bb48-058e221655e8", labels: ["Person"], props: { id: "e2e1869d-5263-4dee-bb48-058e221655e8", weight: 1 } },
        ],
        relationships: [
          { endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", startId: "45b9aefb-e32f-4d69-885c-6580b5654a5d", type: "MATCHES" },
          { endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", startId: "e2e1869d-5263-4dee-bb48-058e221655e8", type: "MATCHES" },
        ],
      },
      {
        nodes: [
          { id: "123", labels: ["Person"], props: { id: "123", weight: 1 } },
          { id: "1", labels: ["Person"], props: { id: "1", weight: 1 } },
          { id: "3", labels: ["Person"], props: { id: "3", weight: 1 } },
        ],
        relationships: [
          { endId: "123", startId: "1", type: "MATCHES" },
          { endId: "123", startId: "3", type: "MATCHES" },
        ],
      },
    ],
  };

  // normalize input into an array of component objects
  const normalizeComponents = (input) => {
    if (!input) return null;
    if (Array.isArray(input)) return input; // already array of components
    if (input.components && Array.isArray(input.components)) return input.components; // payload.components
    if (input.component && Array.isArray(input.component)) return input.component; // payload.component array
    if (input.nodes || input.relationships) return [input]; // single component
    return null;
  };

  // priority: component prop > payload (component(s)) > default demo
  const resolved = componentProp ?? (payload ?? defaultPayload);
  const normalizedComponents = normalizeComponents(resolved) || [defaultPayload.components[0]];

  // Build merged nodes (dedupe by id) but tag componentIndex (first occurrence)
  const { mergedNodes, mergedLinks } = useMemo(() => {
    const nodeMap = new Map();
    const links = [];

    normalizedComponents.forEach((comp, compIdx) => {
      (comp.nodes || []).forEach((n) => {
        if (!nodeMap.has(n.id)) {
          nodeMap.set(n.id, { id: n.id, labels: n.labels, props: n.props, componentIndex: compIdx });
        } else {
          // If node id appears in multiple components, we keep first occurrence.
          // Optionally merge props here if you prefer.
        }
      });
      (comp.relationships || []).forEach((r) => {
        // preserve relationships as provided (cross-component links are allowed)
        // normalize start/end keys to source/target internally later
        links.push({ startId: r.startId, endId: r.endId, type: r.type });
      });
    });

    return { mergedNodes: Array.from(nodeMap.values()), mergedLinks: links };
  }, [normalizedComponents]);

  // Prepare ForceGraph data and place clusters around a circle
  const graphData = useMemo(() => {
    const numClusters = Math.max(1, normalizedComponents.length);
    const clusterRadius = 220; // cluster centers distance from origin
    const clusterCenters = [];
    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2;
      clusterCenters.push({ x: Math.cos(angle) * clusterRadius, y: Math.sin(angle) * clusterRadius });
    }

    const palette = ["#4a90e2", "#50e3c2", "#f5a623", "#bd10e0", "#7ed321", "#b8e986"];

    const nodes = mergedNodes.map((n) => {
      const compIdx = typeof n.componentIndex === "number" ? n.componentIndex : 0;
      const center = clusterCenters[compIdx % clusterCenters.length];
      const jitter = 40;
      return {
        id: n.id,
        label: n.props?.id || n.id,
        val: n.props?.weight || 1,
        x: center.x + (Math.random() - 0.5) * jitter,
        y: center.y + (Math.random() - 0.5) * jitter,
        color: palette[compIdx % palette.length],
        componentIndex: compIdx,
      };
    });

    const links = mergedLinks.map((r, i) => ({
      id: `l-${i}-${r.startId}-${r.endId}`,
      source: r.startId,
      target: r.endId,
      type: r.type || "",
    }));

    return { nodes, links };
  }, [mergedNodes, mergedLinks, normalizedComponents]);

  const shortId = (id) => (id ? id.toString().slice(0, 8) : "");

  return (
    <div style={{ position: "relative", height, border: "2px solid #ddd", borderRadius: 6, overflow: "hidden", background: "#fff" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeId="id"
        nodeLabel={(n) => `${n.label}`}
        nodeVal={(n) => n.val}
        linkDirectionalArrowLength={8}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={0}
        linkLabel={(l) => (l.type ? `${l.type}` : "")}
        linkWidth={1}
        linkColor="#999"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const fontSize = 12 / Math.sqrt(globalScale);
          ctx.font = `${fontSize}px Sans-Serif`;

          const radius = Math.max(6, Math.sqrt(node.val || 1) * 6);

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color || "#4a90e2";
          ctx.fill();

          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.stroke();

          const text = shortId(node.id);
          const textWidth = ctx.measureText(text).width;
          const padding = 4 / Math.sqrt(globalScale);

          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fillRect(node.x - textWidth / 2 - padding, node.y + radius + 4, textWidth + padding * 2, fontSize + padding);

          ctx.fillStyle = "#111";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(text, node.x, node.y + radius + 4);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const radius = Math.max(6, Math.sqrt(node.val || 1) * 6) + 6;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        d3VelocityDecay={0.2}
        d3AlphaMin={0.01}
        d3AlphaDecay={0.03}
        warmupTicks={40}
      />
    </div>
  );
}
