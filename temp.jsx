// // src/components/GetNeighbourByID.jsx
// import React, { useMemo, useRef, useState } from "react"
// import axios from "axios"
// import ForceGraph2D from "react-force-graph-2d"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
// import "./GetNeighbourByID.css"

// const NODE_TYPES = [
//   "Transaction",
//   "Person",
//   "Machine",
//   "Device",
//   "Operator",
//   "Contact",
//   "Location",
//   "Station",
//   "EnrollmentAgency",
// ]

// // DEBUG toggle: set true to see console logs
// const DEBUG = false

// export default function GetNeighbourByID() {
//   const [txnId, setTxnId] = useState("")
//   const [maxHops, setMaxHops] = useState("")
//   const [allNodes, setAllNodes] = useState([])
//   const [selectedTypes, setSelectedTypes] = useState(new Set(NODE_TYPES))

//   // hover state (update only when id changes)
//   const [hoveredNode, setHoveredNode] = useState(null)
//   const lastHoverIdRef = useRef(null)

//   const fgRef = useRef(null)
//   const containerRef = useRef(null)

//   // keep last known positions (fallback)
//   const nodePosRef = useRef(new Map())

//   const graphData = useMemo(() => {
//     const nodes = allNodes.filter((n) => selectedTypes.has(n.label))
//     return { nodes, links: [] }
//   }, [allNodes, selectedTypes])

//   // Helper to produce an initial random position within viewport-ish bounds
//   const randomInitPos = () => {
//     const w = Math.max(600, window.innerWidth * 0.6)
//     const h = Math.max(400, window.innerHeight * 0.5)
//     return {
//       x: (Math.random() - 0.5) * w,
//       y: (Math.random() - 0.5) * h,
//     }
//   }

//   // FETCH BLAST RADIUS
//   const fetchBlastRadius = async () => {
//     if (!txnId || !maxHops) {
//       // optional: show toast
//       return
//     }
//     const base = import.meta.env.VITE_API_BASE_URL || ""
//     try {
//       const res = await axios.get(`${base}/transaction/blast/${txnId}/${maxHops}`)
//       const list = Array.isArray(res.data) ? res.data : res.data || []

//       // Build nodes with stable unique ids and guaranteed initial x/y
//       const nodes = list.map((n, idx) => {
//         const props = n.props || {}
//         const idCandidate = props.id ?? props.uid ?? props.contact ?? props.location ?? `${n.label}-${idx}`
//         const uniqueId = `${String(idCandidate)}-${idx}` // append idx to absolutely avoid duplicates

//         const pos = randomInitPos() // ensure an initial x/y exists for immediate hit testing

//         return {
//           id: uniqueId,
//           label: n.label,
//           __props: props, // preserve original props
//           ...props, // flatter convenience fields
//           x: pos.x,
//           y: pos.y,
//         }
//       })

//       if (DEBUG) console.debug("Fetched nodes:", nodes)
//       setAllNodes(nodes)

//       // clear fallback map and hover
//       nodePosRef.current.clear()
//       lastHoverIdRef.current = null
//       setHoveredNode(null)
//     } catch (err) {
//       console.error("Blast radius fetch failed", err)
//       setAllNodes([])
//       nodePosRef.current.clear()
//       lastHoverIdRef.current = null
//       setHoveredNode(null)
//     }
//   }

//   // ---------- drawing & hit testing ----------
//   function drawShapePathAt(ctx, label, x, y, size) {
//     switch (label) {
//       case "Transaction":
//       case "Operator":
//         ctx.beginPath()
//         ctx.arc(x, y, size, 0, 2 * Math.PI)
//         break
//       case "Person":
//         ctx.beginPath()
//         ctx.rect(x - size, y - size, size * 2, size * 2)
//         break
//       case "Machine":
//         ctx.beginPath()
//         ctx.moveTo(x, y - size)
//         ctx.lineTo(x + size, y + size)
//         ctx.lineTo(x - size, y + size)
//         ctx.closePath()
//         break
//       case "Device":
//         ctx.beginPath()
//         ctx.moveTo(x, y - size)
//         ctx.lineTo(x + size, y)
//         ctx.lineTo(x, y + size)
//         ctx.lineTo(x - size, y)
//         ctx.closePath()
//         break
//       default:
//         ctx.beginPath()
//         ctx.arc(x, y, size, 0, 2 * Math.PI)
//         break
//     }
//   }

//   function nodeFillColor(label) {
//     switch (label) {
//       case "Transaction": return "#4CAFEE"
//       case "Person": return "#FF7043"
//       case "Machine": return "#66BB6A"
//       case "Device": return "#AB47BC"
//       case "Operator": return "#FFA726"
//       case "Contact": return "#29B6F6"
//       case "Location": return "#90A4AE"
//       default: return "#BDBDBD"
//     }
//   }

//   // draw nodes and remember their pos
//   const drawNode = (node, ctx, globalScale) => {
//     ctx.save()
//     const size = 8

//     // Prefer node.x/node.y, but we ensured initial x/y on creation.
//     const x = typeof node.x === "number" ? node.x : undefined
//     const y = typeof node.y === "number" ? node.y : undefined
//     if (x == null || y == null) {
//       ctx.restore()
//       return
//     }

//     drawShapePathAt(ctx, node.label, x, y, size)
//     ctx.fillStyle = nodeFillColor(node.label)
//     ctx.fill()

//     // record last drawn position
//     try {
//       nodePosRef.current.set(node.id, { x, y })
//     } catch (e) {
//       if (DEBUG) console.warn("nodePosRef set failed", e)
//     }

//     // label text
//     const text = `${node.label} - ${String(node.id ?? "")}`
//     ctx.font = `${Math.max(10, 12 / globalScale)}px Sans-Serif`
//     ctx.textAlign = "center"
//     ctx.textBaseline = "top"
//     ctx.fillStyle = "#111827"
//     ctx.fillText(text, x, y + size + 4)
//     ctx.restore()
//   }

//   // paint pointer area for accurate hit testing; uses stored pos fallback
//   const nodePointerAreaPaint = (node, color, ctx) => {
//     ctx.save()
//     let x = node.x
//     let y = node.y
//     if (typeof x !== "number" || typeof y !== "number") {
//       const pos = nodePosRef.current.get(node.id)
//       if (pos) {
//         x = pos.x
//         y = pos.y
//       }
//     }
//     if (typeof x !== "number" || typeof y !== "number") {
//       ctx.restore()
//       return
//     }

//     const hitSize = 16 // larger hit area so tiny shapes are easy to hover
//     drawShapePathAt(ctx, node.label, x, y, hitSize)
//     ctx.fillStyle = color
//     ctx.fill()
//     ctx.restore()
//   }

//   // ---------- hover (low-lag) ----------
//   const handleHover = (node) => {
//     if (containerRef.current) containerRef.current.style.cursor = node ? "pointer" : "default"
//     const newId = node ? node.id : null
//     if (lastHoverIdRef.current !== newId) {
//       lastHoverIdRef.current = newId
//       if (node) {
//         const snapshot = {
//           id: node.id,
//           label: node.label,
//           __props: node.__props || {}, // original props (if any)
//         }
//         setHoveredNode(snapshot)
//         if (DEBUG) console.debug("hover snapshot", snapshot)
//       } else {
//         setHoveredNode(null)
//       }
//     }
//   }

//   // click centers on node (optional)
//   const handleClick = (node) => {
//     if (!node || !fgRef.current) return
//     try {
//       fgRef.current.centerAt(node.x, node.y, 300)
//       fgRef.current.zoom(1.2, 300)
//     } catch (e) {
//       if (DEBUG) console.debug("centerAt/zoom not available", e)
//     }
//   }

//   // details builder — always show Label + id, then original props
//   const detailEntries = useMemo(() => {
//     if (!hoveredNode) return []
//     const props = hoveredNode.__props || {}
//     const entries = Object.entries(props)
//     const base = [
//       ["Label", hoveredNode.label ?? "—"],
//       ["id", hoveredNode.id ?? "—"],
//     ]
//     return entries.length ? [...base, ...entries] : [...base, ["info", "no extra properties"]]
//   }, [hoveredNode])

//   // checkboxes helpers
//   const toggleType = (type, checked) => {
//     setSelectedTypes((prev) => {
//       const s = new Set(prev)
//       if (checked) s.add(type)
//       else s.delete(type)
//       return s
//     })
//   }
//   const toggleAll = (checked) => setSelectedTypes(checked ? new Set(NODE_TYPES) : new Set())
//   const allChecked = selectedTypes.size === NODE_TYPES.length
//   const someChecked = selectedTypes.size > 0 && !allChecked

//   return (
//     <div className="space-y-6">
//       <h2 className="text-xl font-semibold">Blast Radius Graph</h2>

//       {/* Inputs */}
//       <div className="flex flex-col gap-3 max-w-md">
//         <Input
//           type="text"
//           placeholder="Enter Transaction ID"
//           value={txnId}
//           onChange={(e) => setTxnId(e.target.value)}
//         />
//         <Input
//           type="number"
//           placeholder="Enter Max Hops"
//           value={maxHops}
//           onChange={(e) => setMaxHops(e.target.value)}
//         />
//         <Button className="my-submit-btn" onClick={fetchBlastRadius}>
//           Submit
//         </Button>
//       </div>

//       {/* Filters */}
//       <div className="rounded-xl border p-4 shadow-sm bg-white">
//         <div className="mb-3 flex items-center gap-3">
//           <Checkbox id="select-all" checked={allChecked} onCheckedChange={(v) => toggleAll(Boolean(v))} />
//           <label htmlFor="select-all" className="text-sm font-medium">Select all</label>
//           {someChecked && <span className="text-xs text-muted-foreground">(partial)</span>}
//         </div>
//         <div className="flex flex-wrap gap-4">
//           {NODE_TYPES.map((type) => (
//             <div key={type} className="flex items-center gap-2">
//               <Checkbox
//                 id={`cb-${type}`}
//                 checked={selectedTypes.has(type)}
//                 onCheckedChange={(v) => toggleType(type, Boolean(v))}
//               />
//               <label htmlFor={`cb-${type}`} className="text-sm">{type}</label>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Graph + details */}
//       <div className="relative w-full h-screen flex justify-center items-center">
//         <div ref={containerRef} className="w-[95%] h-[90%] border-4 border-gray-300 rounded-2xl shadow-lg overflow-hidden">
//           <ForceGraph2D
//             ref={fgRef}
//             graphData={graphData}
//             nodeCanvasObject={drawNode}
//             nodePointerAreaPaint={nodePointerAreaPaint}
//             onNodeHover={handleHover}
//             onNodeClick={handleClick}
//             width={Math.max(600, window.innerWidth * 0.95)}
//             height={Math.max(400, window.innerHeight * 0.9)}
//             backgroundColor="#ffffff"
//           />
//         </div>

//         <div className="absolute right-6 top-6 w-80 max-h-[85%] overflow-auto rounded-xl border bg-white shadow-xl p-4">
//           <div className="mb-2">
//             <h3 className="font-semibold text-lg">Node Details</h3>
//             {!hoveredNode && <p className="text-sm text-gray-500">Hover a node to see its properties.</p>}
//           </div>
//           {hoveredNode && (
//             <div className="space-y-2">
//               {detailEntries.map(([k, v], i) => (
//                 <div key={`${k}-${i}`} className="text-sm break-words">
//                   <span className="font-medium">{k}: </span>
//                   <span className="text-gray-700">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }