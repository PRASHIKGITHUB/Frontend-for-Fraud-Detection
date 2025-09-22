// src/App.jsx
import { useState } from "react"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"   // <-- import shadcn Input

import Transaction1Form from "@/components/TransactionForm1"
import Transaction2Form from "@/components/TransactionForm2"
import GetData from "@/components/GetTransaction"
import GraphView from "@/components/GetNeighbourByID"

export default function App() {
  const [view, setView] = useState("t1") // "t1" | "t2" | "get" | "graph"
  const [inputId, setInputId] = useState("")
  const [submittedId, setSubmittedId] = useState(null)

  return (
    <div className="p-6 space-y-6">
      <Toaster richColors closeButton />

      {/* Navigation buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant={view === "t1" ? "default" : "outline"} onClick={() => setView("t1")}>
          Create Type 1
        </Button>
        <Button variant={view === "t2" ? "default" : "outline"} onClick={() => setView("t2")}>
          Create Type 2
        </Button>
        <Button variant={view === "get" ? "default" : "outline"} onClick={() => setView("get")}>
          Get Data
        </Button>
        <Button variant={view === "graph" ? "default" : "outline"} onClick={() => setView("graph")}>
          Graph View
        </Button>
      </div>

      {/* Render based on active view */}
      {view === "t1" && (
        <>
          <h1 className="text-2xl font-semibold">Transaction Type 1</h1>
          <Transaction1Form />
        </>
      )}

      {view === "t2" && (
        <>
          <h1 className="text-2xl font-semibold">Transaction Type 2</h1>
          <Transaction2Form />
        </>
      )}

      {view === "get" && (
        <>
          <h1 className="text-2xl font-semibold">Fetch Data</h1>
          <GetData />
        </>
      )}

      {view === "graph" && (
        <>
          <h1 className="text-2xl font-semibold">Graph View</h1>
          <GraphView />
          
        </>
      )}
    </div>
  )
}


// npm i reactflow
// import React from "react";
// import ReactFlow, { Background, Controls } from "reactflow";
// import "reactflow/dist/style.css";

// const nodes = [
//   { id: "1", data: { label: "Node 1" }, position: { x: 50, y: 50 } },
//   { id: "2", data: { label: "Node 2" }, position: { x: 250, y: 150 } },
// ];
// const edges = [{ id: "e1-2", source: "1", target: "2" }];

// export default function MyFlow() {
//   return (
//     <div style={{ height: 500, border: "1px solid #ddd" }}>
//       <ReactFlow nodes={nodes} edges={edges}>
//         <Background />
//         <Controls />
//       </ReactFlow>
//     </div>
//   );
// }


// npm i react-force-graph
// import React from "react";
// import ForceGraph2D from "react-force-graph-2d";

// const data = {
//   nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
//   links: [{ source: "A", target: "B" }, { source: "A", target: "C" }],
// };

// export default function ForceDemo() {
//   return (
//     <div style={{ height: 500 }}>
//       <ForceGraph2D
//         graphData={data}
//         nodeLabel="id"
//         nodeAutoColorBy="id"
//         width={800}
//         height={500}
//       />
//     </div>
//   );
// }

