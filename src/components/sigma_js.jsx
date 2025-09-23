// ForceGraphSigma.jsx
import React, { useMemo } from "react";
import { SigmaContainer, ControlsContainer, useRegisterEvents } from "react-sigma-v2";
import Graph from "graphology";
import { CircularDependency } from "graphology-layout"; // not required, kept for reference
import "react-sigma-v2/lib/react-sigma-v2.css";

/**
 * ForceGraphSigma
 *
 * Props:
 *  - payload: object (component / components / array)
 *  - component: same as payload.component (alternate prop)
 *  - height: number | string (default 750)
 *
 * Note:
 *  - Sigma v2 by default doesn't render arrowheads for edges. See note below on how to enable arrowheads (plugin or custom renderer).
 */
export default function ForceGraphSigma({ payload, component: componentProp, height = 750 }) {
  // demo fallback with two components (avoid duplicate keys)
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

  // normalize input into array of components
  const normalizeComponents = (input) => {
    if (!input) return null;
    if (Array.isArray(input)) return input;
    if (input.components && Array.isArray(input.components)) return input.components;
    if (input.component && Array.isArray(input.component)) return input.component;
    if (input.nodes || input.relationships) return [input];
    return null;
  };

  const resolved = componentProp ?? payload ?? { components: demoComponents };
  const normalizedComponents = normalizeComponents(resolved) || demoComponents;

  // Build graphology Graph (dedupe nodes by id, tag componentIndex)
  const graph = useMemo(() => {
    const g = new Graph({ multi: false, allowSelfLoops: false });
    const nodeMap = new Map();
    normalizedComponents.forEach((comp, compIdx) => {
      (comp.nodes || []).forEach((n) => {
        if (!nodeMap.has(n.id)) {
          nodeMap.set(n.id, { id: n.id, labels: n.labels, props: n.props, componentIndex: compIdx });
        }
      });
    });

    // compute cluster centers around a circle and assign preset positions
    const numClusters = Math.max(1, normalizedComponents.length);
    const clusterRadius = 220;
    const clusterCenters = [];
    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2;
      clusterCenters.push({ x: Math.cos(angle) * clusterRadius, y: Math.sin(angle) * clusterRadius });
    }

    const palette = ["#4a90e2", "#50e3c2", "#f5a623", "#bd10e0", "#7ed321", "#b8e986"];

    // add nodes with preset positions to encourage clustering
    Array.from(nodeMap.values()).forEach((nodeObj) => {
      const compIdx = typeof nodeObj.componentIndex === "number" ? nodeObj.componentIndex : 0;
      const center = clusterCenters[compIdx % clusterCenters.length];
      const jitter = 40 * Math.random();
      const x = center.x + (Math.random() - 0.5) * jitter;
      const y = center.y + (Math.random() - 0.5) * jitter;

      g.addNode(nodeObj.id, {
        label: nodeObj.props?.id ?? nodeObj.id,
        x,
        y,
        size: Math.max(6, (nodeObj.props?.weight ?? 1) * 6),
        color: palette[compIdx % palette.length],
        componentIndex: compIdx,
      });
    });

    // add edges (all relationships from all components)
    normalizedComponents.forEach((comp) => {
      (comp.relationships || []).forEach((r, i) => {
        // Graphology expects source/target naming; we keep edge key unique
        const key = `e-${r.startId}-${r.endId}-${i}`;
        // addEdgeWithKey requires unique key for multigraphs; here multi is false, but we'll create safe key
        try {
          g.addEdgeWithKey(key, r.startId, r.endId, {
            label: r.type || "",
            directed: true,
          });
        } catch (e) {
          // ignore duplicate edges or missing nodes
        }
      });
    });

    return g;
  }, [normalizedComponents]);

  // Optional: register events (example: click to center) using a small helper component
  function SigmaEvents() {
    useRegisterEvents({
      clickNode({ event, node }) {
        // center on click (Sigma exposes camera/viewport via event.viewer)
        // but with react-sigma-v2 we can use the sigma instance directly via hook if needed
        // For simplicity, do nothing here or console.log:
        // console.log("node clicked", node);
      },
    });
    return null;
  }

  // Sigma settings
  const settings = {
    // some nice interactions
    minCameraRatio: 0.1,
    maxCameraRatio: 10,
    defaultNodeColor: "#4a90e2",
    labelThreshold: 6, // show labels for nodes >= this size (tweak as needed)
    // Note: Sigma doesn't draw arrowheads by default; see note below
  };

  return (
    <div style={{ height: typeof height === "number" ? `${height}px` : height, border: "1px solid #e6e6e6", borderRadius: 6, background: "#fff" }}>
      <SigmaContainer graph={graph} settings={settings}>
        <SigmaEvents />
        {/* ControlsContainer provides zoom/interaction UI built into react-sigma-v2 */}
        <ControlsContainer />
      </SigmaContainer>
    </div>
  );
}
