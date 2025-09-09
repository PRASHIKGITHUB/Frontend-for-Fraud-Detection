// src/components/GetData.jsx
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const Schema = z.object({
  resource: z.enum(["person", "transaction"], { required_error: "Pick resource" }),
  mode: z.enum(["all", "single"], { required_error: "Pick mode" }),
  identifier: z.string().optional(), // uid for person, id for transaction
}).superRefine((val, ctx) => {
  if (val.mode === "single" && (!val.identifier || val.identifier.trim() === "")) {
    ctx.addIssue({ code: "custom", message: "ID/UID is required", path: ["identifier"] })
  }
})

export default function GetData() {
  const form = useForm({
    resolver: zodResolver(Schema),
    defaultValues: { resource: "transaction", mode: "single", identifier: "" },
  })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(values) {
    const base = import.meta.env.VITE_API_BASE_URL || ""


    let path = ""
    if (values.resource === "person") {
      path = values.mode === "all"
        ? "/person/"                           
        : `/person/${encodeURIComponent(values.identifier)}`
    } else {
      path = values.mode === "all"
        ? "/transaction/"                       
        : `/transaction/${encodeURIComponent(values.identifier)}`
    }

    const url = base + path

    try {
      setLoading(true)
      setData(null)
      const res = await fetch(url, { method: "GET" })
      if (!res.ok) throw new Error((await res.text()) || res.statusText)
      const json = await res.json().catch(() => ({}))
      setData(json)
      toast.success("Fetched successfully")
    } catch (e) {
      toast.error("Fetch failed", { description: String(e?.message ?? e) })
    } finally {
      setLoading(false)
    }
  }

  const watchResource = form.watch("resource")
  const watchMode = form.watch("mode")

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-4">
          <FormField
            control={form.control}
            name="resource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pick resource" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">Person</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Choose what to fetch.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mode</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pick mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Get all</SelectItem>
                      <SelectItem value="single">Get by ID/UID</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Fetch a single record or the entire list.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchMode === "single" && (
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchResource === "person" ? "Person UID" : "Transaction ID"}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={watchResource === "person" ? "uid_123" : "txn_123"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Fetching..." : "Fetch"}
          </Button>
        </form>
      </Form>

      {data && (
        <pre className="mt-4 max-w-3xl overflow-auto rounded-lg bg-neutral-950 p-4 text-sm text-white">
{JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
