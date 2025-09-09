// src/components/GetNeighbourByID.jsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";


function createNodesFromData(data) {
  const cols = 5;
  return data.map((item, i) => {
    const x = (i % cols) * 220;
    const y = Math.floor(i / cols) * 140;
    return {
      id: `${item.label}-${i}`,
      position: { x, y },
      data: { label: item.label, props: item.props },
      type: "typedNode",
      extent: "prevent",
    };
  });
}

/* ---------------- SimpleNode: colored shapes for different labels ---------------- */
function SimpleNode({ data }) {
  const label = (data.label || "").toLowerCase();

  if (label === "person") {
    return (
      <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
        <svg width="100" height="60" viewBox="0 0 100 60">
          <circle cx="50" cy="30" r="24" className="fill-green-300 stroke-green-700 stroke-2" />
        </svg>
        <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.name || data.label}</div>
      </div>
    );
  }

  if (label === "transaction") {
    return (
      <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
        <svg width="100" height="60" viewBox="0 0 100 60">
          <rect x="6" y="10" width="88" height="40" rx="6" className="fill-blue-300 stroke-blue-700 stroke-2" />
        </svg>
        <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.id || data.label}</div>
      </div>
    );
  }

  if (label === "operator") {
    return (
      <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
        <svg width="100" height="60" viewBox="0 0 100 60">
          <polygon points="50,2 94,30 50,58 6,30" className="fill-yellow-300 stroke-yellow-700 stroke-2" />
        </svg>
        <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.name || data.label}</div>
      </div>
    );
  }

  if (label === "machine") {
    return (
      <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
        <svg width="100" height="60" viewBox="0 0 100 60">
          <ellipse cx="50" cy="30" rx="44" ry="22" className="fill-purple-300 stroke-purple-700 stroke-2" />
        </svg>
        <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.id || data.label}</div>
      </div>
    );
  }

  // fallback gray shape
  return (
    <div className="flex flex-col items-center justify-center p-1" style={{ width: 120 }}>
      <svg width="100" height="60" viewBox="0 0 100 60">
        <ellipse cx="50" cy="30" rx="44" ry="22" className="fill-gray-200 stroke-gray-600 stroke-2" />
      </svg>
      <div className="mt-1 text-xs font-medium text-slate-800 truncate w-28 text-center">{data.props?.name || data.label}</div>
    </div>
  );
}

/* ---------------- Main Component ---------------- */
export default function GetNeighbourByID() {
  // Vite env var (set VITE_API_BASE in .env) or fallback to localhost.
  const defaultBase = import.meta?.env?.VITE_API_BASE || "http://localhost:8000";

  /* ---------- Inputs & UI state ---------- */
  const [baseUrl, setBaseUrl] = useState(defaultBase);
  const [txnId, setTxnId] = useState("");
  const [maxHops, setMaxHops] = useState(2);

  /* ---------- Data state (starts empty) ---------- */
  const [rawNodesData, setRawNodesData] = useState([]); // array of objects { label, props }
  const [nodes, setNodes] = useState([]); // ReactFlow nodes (created from rawNodesData)
  const [edges, setEdges] = useState([]); // ReactFlow edges

  /* ---------- UI helpers ---------- */
  const [hoveredNode, setHoveredNode] = useState(null); // data shown in details panel
  const [availableLabels, setAvailableLabels] = useState([]); // unique labels from rawNodesData
  const [visibleLabels, setVisibleLabels] = useState(new Set()); // which labels are toggled on
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------- Memoized nodeTypes for React Flow (avoid warnings) ---------------- */
  const nodeTypes = useMemo(() => ({ typedNode: SimpleNode }), []);

  /* ---------------- When rawNodesData changes: compute RF nodes + labels ---------------- */
  useEffect(() => {
    const created = createNodesFromData(rawNodesData);
    setNodes(created);

    const labels = Array.from(new Set(rawNodesData.map((n) => n.label)));
    setAvailableLabels(labels);

    // default visible labels -> all labels (only if user hasn't chosen anything yet)
    setVisibleLabels((prev) => {
      if (prev && prev.size > 0) return prev;
      return new Set(labels);
    });
  }, [rawNodesData]);

  /* ---------------- Filter nodes according to visibleLabels ---------------- */
  const filteredNodes = useMemo(() => {
    if (!visibleLabels || visibleLabels.size === 0) return nodes;
    return nodes.filter((n) => visibleLabels.has(n.data.label));
  }, [nodes, visibleLabels]);

  /* ---------------- Toggle label visibility ---------------- */
  const toggleLabel = useCallback((label) => {
    setVisibleLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  /* ---------------- Fetch blast from API and REPLACE canvas with result ONLY ---------------- */
  const fetchBlast = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!txnId) {
        setError("Please enter txnId before fetching.");
        setLoading(false);s
        return;
      }

      const url = `${baseUrl.replace(/\/$/, "")}/transaction/blast/${encodeURIComponent(txnId)}/${encodeURIComponent(maxHops)}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

      const data = await res.json();
      console.log(data);
      

      // Accept either array or { nodes, edges }
      const apiNodes = Array.isArray(data) ? data : data.nodes || [];
      const apiEdges = data.edges || [];

      // REPLACE rawNodesData with API nodes only (do NOT merge with any sample)
      setRawNodesData(apiNodes);

      // convert API edges to ReactFlow edges if provided
      if (apiEdges && apiEdges.length) {
        const rfEdges = apiEdges.map((e, i) => ({
          id: `e-${i}`,
          source: e.fromId || e.source,
          target: e.toId || e.target,
        }));
        setEdges(rfEdges);
      } else {
        setEdges([]); // clear edges if API returned none
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [baseUrl, txnId, maxHops]);

  /* ---------------- Hover handlers for details panel ---------------- */
  const onNodeMouseEnter = useCallback((event, node) => setHoveredNode(node?.data ?? null), []);
  const onNodeMouseLeave = useCallback(() => setHoveredNode(null), []);

  /* ---------------- UI: no Reset (so sample data is never reintroduced) ---------------- */

  return (
    <div className="relative h-[90vh] w-full rounded-lg border p-3 bg-white">
      {/* ---------- Controls ---------- */}
      <div className="mb-3 flex gap-2">
        <input className="rounded border px-2 py-1 text-sm w-60" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="API base URL" />
        <input className="rounded border px-2 py-1 text-sm w-40" value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="txnId (e.g. T1-3150)" />
        <input type="number" className="rounded border px-2 py-1 text-sm w-28" value={maxHops} onChange={(e) => setMaxHops(Number(e.target.value))} min={1} max={10} />
        <button className="rounded bg-blue-600 px-3 py-1 text-white text-sm" onClick={fetchBlast} disabled={loading || !txnId}>
          {loading ? "Loading..." : "Fetch Blast"}
        </button>
      </div>

      {/* ---------- Right side: filters + details ---------- */}
      <div className="absolute top-3 right-3 z-40 flex flex-col items-end gap-3">
        {/* Filters */}
        <div className="rounded border bg-slate-50 p-2 shadow">
          <div className="text-xs font-semibold mb-2">Filter node types</div>
          <div className="flex flex-col text-xs max-h-40 overflow-auto">
            {availableLabels.length === 0 && <div className="text-xs text-slate-500">No labels</div>}
            {availableLabels.map((label) => (
              <label key={label} className="inline-flex items-center gap-2">
                <input type="checkbox" checked={visibleLabels.has(label)} onChange={() => toggleLabel(label)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Details panel */}
        <div className="w-72 rounded-lg border bg-slate-50 p-3 shadow">
          <div className="text-sm font-semibold">Node details</div>
          {!hoveredNode && <div className="mt-2 text-xs text-slate-500">Hover a node to see its properties</div>}
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
      </div>

      {/* ---------- Main canvas (shows only fetched nodes) ---------- */}
      <div style={{ height: "75vh" }} className="rounded">
        <ReactFlow nodes={filteredNodes} edges={edges} nodeTypes={nodeTypes} onNodeMouseEnter={onNodeMouseEnter} onNodeMouseLeave={onNodeMouseLeave} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* ---------- Footer: status + legend ---------- */}
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-slate-500">{error ? `Error: ${error}` : `Nodes: ${rawNodesData.length}`}</div>

        <div className="flex gap-3 items-center text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-300" /> <span>Person</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-300" /> <span>Transaction</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-300" /> <span>Operator</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-300" /> <span>Machine</span></div>
        </div>
      </div>
    </div>
  );
}
