"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"


export function DynamicForm({
  schema,
  fields,
  defaultValues = {},
  submitLabel = "Submit",
  className = "w-full max-w-xl space-y-6",
  onSubmit,
  beforeSubmit,
  api,
  getEndpoint,
}) {
  const form = useForm({ resolver: schema ? zodResolver(schema) : undefined, defaultValues })
  const { isSubmitting } = form.formState

  async function handleSubmit(values) {
    const payload = beforeSubmit ? beforeSubmit(values) : values


    if (api) {
      try {
    
        let endpoint = getEndpoint ? getEndpoint(payload) : undefined
        if (!endpoint && api?.routes) {
          const t = Number(payload.transaction_type)
          const route = api.routes[t]
          if (Array.isArray(route)) {
       
            endpoint = route.filter(Boolean).join("")
          } else {
            endpoint = route
          }
        }

        if (!endpoint) {
          toast.error("No API route for this transaction type.")
          return
        }

        const url = (api.baseUrl ?? "") + endpoint
        const res = await fetch(url, {
          method: api.method ?? "POST",
          headers: {
            "Content-Type": "application/json",
            ...(api.headers || {}),
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          const err = new Error(text || res.statusText)
          throw err
        }

        let data = null
        try { data = await res.json() } catch (_) {}

        api.onSuccess?.(data, payload)
        toast.success("Saved successfully")
        return
      } catch (error) {
        console.error(error)
        api.onError?.(error, values)
        toast.error("Failed to save", { description: String(error?.message ?? "Unknown error") })
        return
      }
    }

  
    if (onSubmit) return onSubmit(payload)
    toast("Form submitted", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(payload, null, 2)}</code>
        </pre>
      ),
    })
  }

  const renderField = (field) => {
    const common = { name: field.name, control: form.control }
    const label = field.label ?? field.name

    return (
      <FormField
        key={field.name}
        {...common}
        render={({ field: rhf }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              {(() => {
                switch (field.type) {
                  case "text":
                  case "email":
                  case "password":
                  case "number":
                  case "date":
                  case "datetime-local":
                    return (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        {...rhf}
                        onChange={(e) => {
                          if (field.type === "number") {
                            const v = e.target.value
                            rhf.onChange(v === "" ? "" : Number(v))
                          } else {
                            rhf.onChange(e)
                          }
                        }}
                      />
                    )
                  case "textarea":
                    return (
                      <Textarea
                        placeholder={field.placeholder}
                        {...rhf}
                        rows={field.rows ?? 4}
                      />
                    )
                  case "select":
                    return (
                      <Select onValueChange={rhf.onChange} defaultValue={rhf.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  case "checkbox":
                    return (
                      <div className="flex items-center gap-2">
                        <Checkbox checked={!!rhf.value} onCheckedChange={rhf.onChange} />
                        <span className="text-sm text-muted-foreground">
                          {field.checkboxLabel ?? ""}
                        </span>
                      </div>
                    )
                  default:
                    return <Input placeholder={field.placeholder} {...rhf} />
                }
              })()}
            </FormControl>
            {field.description && <FormDescription>{field.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        {fields.map(renderField)}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
