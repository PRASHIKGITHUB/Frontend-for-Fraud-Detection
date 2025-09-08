// JS component for Transaction Type 1
import { z } from "zod"
import { DynamicForm } from "@/components/DynamicForm" // uses the API-enabled DynamicForm

// 1) Validation (matches your Go JSON)
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

  // UI-only; we’ll convert to devices[]
  devices_json: z.string().optional().default("[]"),

  introducer_id: z.string().optional(),
  relation_with_introducer: z.string().optional(),
})

// 2) Fields
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

  { name: "introducer_id", type: "text", label: "Introducer ID", placeholder: "user_abc" },
  { name: "relation_with_introducer", type: "text", label: "Relation", placeholder: "colleague / friend" },
]

// 3) Defaults
const defaults = {
  id: "",
  person: { uid: "", name: "", age: 0, gender: "", contact: "", location: "" },
  ip_address: "",
  timestamp: "",
  operator_id: "",
  machine_id: "",
  devices_json: "[]",
  introducer_id: "",
  relation_with_introducer: "",
}

export default function Transaction1Form() {
  return (
    <DynamicForm
      schema={Schema}
      fields={fields}
      defaultValues={defaults}
      submitLabel="Save Type 1"
      // convert UI JSON -> devices[]
      beforeSubmit={(values) => {
        let devices = []
        try {
          const parsed = values.devices_json ? JSON.parse(values.devices_json) : []
          if (Array.isArray(parsed)) devices = parsed
        } catch {}
        const { devices_json, ...rest } = values
        return { ...rest, devices }
      }}
      // call your backend for type 1
      api={{
        baseUrl: import.meta.env.VITE_API_BASE_URL, // set in .env
        method: "POST",
        headers: { "X-Transaction": "1" }, // optional
        routes: { 1: "/api/transactions/type1" }, // not used if getEndpoint provided
        onSuccess: (data) => console.log("Type1 OK:", data),
        onError: (err) => console.error("Type1 ERR:", err),
      }}
      // since this is Type 1, force the endpoint:
      getEndpoint={() => "/api/transactions/type1"}
    />
  )
}
