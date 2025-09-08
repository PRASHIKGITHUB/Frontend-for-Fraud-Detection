// src/components/Transaction2Form.jsx
import { z } from "zod"
import { DynamicForm } from "@/components/DynamicForm"

// 1) Validation to match your Go JSON for Transaction2
const Schema = z.object({
  id: z.string().min(1),
  person: z.object({
    uid: z.string().min(1),
    name: z.string().min(1),
    age: z.number().int().min(0),
    gender: z.string().min(1),
    contact: z.string().min(1),
    location: z.string().min(1),
  }),
  ip_address: z.string().min(1),
  timestamp: z.string().min(1), // using <input type="datetime-local" />
  operator_id: z.string().min(1),
  machine_id: z.string().min(1),

  // UI-only field; we’ll convert to devices[] before submit
  devices_json: z.string().optional().default("[]"),
})

// 2) Fields to render (dot paths for nested person.*)
const fields = [
  { name: "id", type: "text", label: "ID", placeholder: "txn_123" },

  { name: "person.uid", type: "text", label: "Person UID", placeholder: "uuid-v4" },
  { name: "person.name", type: "text", label: "Name", placeholder: "Alice" },
  { name: "person.age", type: "number", label: "Age", placeholder: "30" },
  { name: "person.gender", type: "text", label: "Gender", placeholder: "M/F/Other" },
  { name: "person.contact", type: "text", label: "Contact", placeholder: "+91 9XXXXXXXXX" },
  { name: "person.location", type: "text", label: "Location", placeholder: "Mumbai, IN" },

  { name: "ip_address", type: "text", label: "IP Address", placeholder: "192.168.1.10" },
  { name: "timestamp", type: "datetime-local", label: "Timestamp" },

  { name: "operator_id", type: "text", label: "Operator ID", placeholder: "op_001" },
  { name: "machine_id", type: "text", label: "Machine ID", placeholder: "machine_42" },

  {
    name: "devices_json",
    type: "textarea",
    label: "Devices (JSON Array)",
    rows: 5,
    description: 'Example: [{"id":"dev1","type":"sensor"}]',
    placeholder: `[{"id":"dev1","type":"sensor"}]`,
  },
]

// 3) Defaults matching the nested shape
const defaults = {
  id: "",
  person: { uid: "", name: "", age: 0, gender: "", contact: "", location: "" },
  ip_address: "",
  timestamp: "",
  operator_id: "",
  machine_id: "",
  devices_json: "[]",
}

export default function Transaction2Form() {
  return (
    <DynamicForm
      schema={Schema}
      fields={fields}
      defaultValues={defaults}
      submitLabel="Save Type 2"
      // Convert UI JSON -> devices[]
      beforeSubmit={(values) => {
        let devices = []
        try {
          const parsed = values.devices_json ? JSON.parse(values.devices_json) : []
          if (Array.isArray(parsed)) devices = parsed
        } catch {}
        const { devices_json, ...rest } = values
        return { ...rest, devices }
      }}
      // POST to your backend (adjust baseUrl and path)
      api={{
        baseUrl: import.meta.env.VITE_API_BASE_URL, // e.g. http://localhost:8080
        method: "POST",
        routes: { 2: "/api/transactions/type2" }, // not strictly needed because we force the endpoint below
        onSuccess: (data) => console.log("Type2 OK:", data),
        onError: (err) => console.error("Type2 ERR:", err),
      }}
      // Force the endpoint since this component is only for type 2
      getEndpoint={() => "/api/transactions/type2"}
    />
  )
}
