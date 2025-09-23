import React, { useMemo } from "react";
import CytoscapeComponent from "react-cytoscapejs";

/**
 * ForceGraphCytoscape
 *
 * Props:
 *  - payload: { components: [...] } OR { component: {...} } OR array of components
 *  - component: same as above (alternative prop)
 *  - height: numeric or css string (default 750)
 *
 * Behavior:
 *  - Accepts multiple components and places each as a cluster using preset positions
 *  - Nodes labeled with their props.id (or id)
 *  - Directed edges (arrowheads) with label = relationship type
 *  - Colors nodes by originating component
 */
export default function ForceGraphCytoscape({ payload, component: componentProp, height = 750 }) {
  // helper: normalize incoming shapes -> array of components
  const normalizeComponents = (input) => {
    if (!input) return null;
    if (Array.isArray(input)) return input;
    if (input.components && Array.isArray(input.components)) return input.components;
    if (input.component && Array.isArray(input.component)) return input.component;
    if (input.nodes || input.relationships) return [input];
    return null;
  };

  // a safe demo default (two components)
  const demoComponents = [
    {
      nodes: [
        { id: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", labels: ["Person"], props: { id: "ff9dbe64-...", weight: 1 } },
        { id: "45b9aefb-e32f-4d69-885c-6580b5654a5d", labels: ["Person"], props: { id: "45b9aefb-...", weight: 1 } },
        { id: "e2e1869d-5263-4dee-bb48-058e221655e8", labels: ["Person"], props: { id: "e2e1869d-...", weight: 1 } },
      ],
      relationships: [
        { startId: "45b9aefb-e32f-4d69-885c-6580b5654a5d", endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", type: "MATCHES" },
        { startId: "e2e1869d-5263-4dee-bb48-058e221655e8", endId: "ff9dbe64-1d50-4f0e-8ce1-1f454319ee6c", type: "MATCHES" },
      ],
    },
    {
      nodes: [
        { id: "123", labels: ["Person"], props: { id: "123", weight: 1 } },
        { id: "1", labels: ["Person"], props: { id: "1", weight: 1 } },
        { id: "3", labels: ["Person"], props: { id: "3", weight: 1 } },
      ],
      relationships: [
        { startId: "1", endId: "123", type: "MATCHES" },
        { startId: "3", endId: "123", type: "MATCHES" },
      ],
    },
  ];

  // choose input source
  const resolved = componentProp ? componentProp : payload ? payload : { components: demoComponents };
  const normalizedComponents = normalizeComponents(resolved) || demoComponents;

  // Build elements for Cytoscape (dedupe nodes, keep componentIndex)
  const elements = useMemo(() => {
    const nodeMap = new Map();
    const edges = [];

    normalizedComponents.forEach((comp, compIdx) => {
      (comp.nodes || []).forEach((n) => {
        if (!nodeMap.has(n.id)) {
          nodeMap.set(n.id, {
            data: {
              id: n.id,
              label: n.props?.id || n.id,
              componentIndex: compIdx,
            },
          });
        }
      });
      (comp.relationships || []).forEach((r, i) => {
        // cytoscape uses source/target keys
        edges.push({
          data: {
            id: `e-${compIdx}-${i}-${r.startId}-${r.endId}`,
            source: r.startId,
            target: r.endId,
            label: r.type || "",
          },
        });
      });
    });

    // compute cluster centers and preset positions (so clusters don't mix)
    const numClusters = Math.max(1, normalizedComponents.length);
    const clusterRadius = 260;
    const clusterCenters = [];
    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2;
      clusterCenters.push({ x: Math.cos(angle) * clusterRadius, y: Math.sin(angle) * clusterRadius });
    }

    // assign positions (preset) with small jitter and a color attribute in data
    const palette = ["#4a90e2", "#50e3c2", "#f5a623", "#bd10e0", "#7ed321", "#b8e986"];
    const jitter = 60;
    const nodes = Array.from(nodeMap.values()).map((nodeObj) => {
      const compIdx = nodeObj.data.componentIndex || 0;
      const center = clusterCenters[compIdx % clusterCenters.length];
      return {
        data: {
          ...nodeObj.data,
          color: palette[compIdx % palette.length],
        },
        position: {
          x: center.x + (Math.random() - 0.5) * jitter,
          y: center.y + (Math.random() - 0.5) * jitter,
        },
      };
    });

    return [...nodes, ...edges];
  }, [normalizedComponents]);

  // Cytoscape style: color by data(color), show node label under node, directed edges with arrows and edge label
  const style = [
    {
      selector: "node",
      style: {
        "background-color": "data(color)",
        label: "data(label)",
        "text-valign": "bottom",
        "text-margin-y": 6,
        "font-size": 10,
        "text-wrap": "wrap",
        color: "#111",
        "width": "mapData(label, 1, 20, 24, 40)", // simple size mapping based on label length (optional)
      },
    },
    {
      selector: "edge",
      style: {
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "target-arrow-color": "#999",
        "line-color": "#999",
        width: 1,
        label: "data(label)",
        "font-size": 9,
        "text-rotation": "autorotate",
        "text-margin-y": -6,
      },
    },
  ];

  // use preset layout because we supply node positions to keep clusters separate
  const layout = { name: "preset" };

  return (
    <div style={{ height: typeof height === "number" ? `${height}px` : height, border: "2px solid #ddd", borderRadius: 6, overflow: "hidden", background: "#fff" }}>
      <CytoscapeComponent elements={elements} style={{ width: "100%", height: "100%" }} stylesheet={style} layout={layout} cy={(cy) => {
        // optional: enable wheel zoom, pan and center fit a bit on initial mount
        setTimeout(() => {
          try {
            cy.fit();
          } catch (e) {}
        }, 50);
      }} />
    </div>
  );
}
