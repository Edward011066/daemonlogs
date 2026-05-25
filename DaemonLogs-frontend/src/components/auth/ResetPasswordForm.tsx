import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { apiFetch, ApiError } from "@/lib/api"

const codeSchema = z.object({ code: z.string().length(6, "O código tem 6 dígitos") })
const resetSchema = z.object({
  code: z.string().length(6),
  new_password: z.string().min(6, "Mínimo 6 caracteres"),
})

type CodeForm = z.infer<typeof codeSchema>
type ResetForm = z.infer<typeof resetSchema>

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [validCode, setValidCode] = useState<string | null>(null)

  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const onVerify = async (data: CodeForm) => {
    try {
      const res = await apiFetch<{ valid: boolean }>("/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify(data),
      })
      if (res.valid) {
        setValidCode(data.code)
        resetForm.setValue("code", data.code)
      } else {
        codeForm.setError("code", { message: "Código inválido." })
      }
    } catch (err) {
      if (err instanceof ApiError) codeForm.setError("code", { message: err.message })
    }
  }

  const onReset = async (data: ResetForm) => {
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      })
      toast.success("Senha redefinida com sucesso!")
      navigate("/auth/login")
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  if (!validCode) {
    return (
      <Form {...codeForm}>
        <form onSubmit={codeForm.handleSubmit(onVerify)} className="space-y-4">
          <FormField
            control={codeForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de recuperação</FormLabel>
                <FormControl>
                  <Input placeholder="123456" maxLength={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <AsyncButton type="submit" loading={codeForm.formState.isSubmitting} className="w-full">
            Validar código
          </AsyncButton>
        </form>
      </Form>
    )
  }

  return (
    <Form {...resetForm}>
      <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
        <FormField
          control={resetForm.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AsyncButton type="submit" loading={resetForm.formState.isSubmitting} className="w-full">
          Redefinir senha
        </AsyncButton>
      </form>
    </Form>
  )
}
