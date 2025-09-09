// JS component for Transaction Type 1
import { z } from "zod"
import { DynamicForm } from "@/components/DynamicForm" 


const Schema = z.object({
  id: z.string().min(1),
  person: z.object({
    uid: z.string().min(1),
    name: z.string().min(1),
  
    age: z.preprocess((val) => {
      if (typeof val === "string" && val.trim() !== "") return Number(val)
      return val
    }, z.number().int().min(0)),
    gender: z.string().min(1),
    contact: z.string().min(1),
    location: z.string().min(1),
  }),
  ip_address: z.string().min(1),
  timestamp: z.string().min(1), 
  operator_id: z.string().min(1),
  machine_id: z.string().min(1),

 
  devices_json: z.string().optional().default("[]"),

  introducer_id: z.string().optional(),
  relation_with_introducer: z.string().optional(),
})


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
    
      beforeSubmit={(values) => {
 
        const personFromDotted = {
          uid: values["person.uid"],
          name: values["person.name"],
          age: values["person.age"],
          gender: values["person.gender"],
          contact: values["person.contact"],
          location: values["person.location"],
        }

        const person = values.person && typeof values.person === "object"
          ? {
              uid: values.person.uid ?? personFromDotted.uid ?? "",
              name: values.person.name ?? personFromDotted.name ?? "",
              age: values.person.age ?? personFromDotted.age ?? 0,
              gender: values.person.gender ?? personFromDotted.gender ?? "",
              contact: values.person.contact ?? personFromDotted.contact ?? "",
              location: values.person.location ?? personFromDotted.location ?? "",
            }
          : {
              uid: personFromDotted.uid ?? "",
              name: personFromDotted.name ?? "",
              age: personFromDotted.age ?? 0,
              gender: personFromDotted.gender ?? "",
              contact: personFromDotted.contact ?? "",
              location: personFromDotted.location ?? "",
            }

   
        person.age = Number(person.age) || 0

        let devices = []
        try {
          const parsed =
            values.devices_json && typeof values.devices_json === "string"
              ? JSON.parse(values.devices_json)
              : values.devices || []
          if (Array.isArray(parsed)) devices = parsed
        } catch (e) {

          devices = []
        }

    
        let timestamp = values.timestamp || ""
        if (timestamp) {
        
          const d = new Date(timestamp)
          if (!isNaN(d.getTime())) {
            timestamp = d.toISOString()
          }
        }

      
        const payload = {
          id: values.id,
          person,
          ip_address: values.ip_address,
          timestamp,
          operator_id: values.operator_id,
          machine_id: values.machine_id,
          devices,
        }
        console.log(payload);
        

        if (values.introducer_id && values.introducer_id.toString().trim() !== "") {
          payload.introducer_id = values.introducer_id
        }
        if (
          values.relation_with_introducer &&
          values.relation_with_introducer.toString().trim() !== ""
        ) {
          payload.relation_with_introducer = values.relation_with_introducer
        }

        return payload
      }}
   
      api={{
        baseUrl: import.meta.env.VITE_API_BASE_URL, 
        method: "POST",
        headers: { "X-Transaction": "1" }, 
        routes: { 1: "/transaction/1" },
        onSuccess: (data) => console.log("Type1 OK:", data),
        onError: (err) => console.error("Type1 ERR:", err),
      }}
   
      getEndpoint={() => "/transaction/1"}
    />
  )
}
