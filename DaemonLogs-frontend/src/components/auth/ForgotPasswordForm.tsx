import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { apiFetch, ApiError } from "@/lib/api"

const schema = z.object({
  email: z.string().email("E-mail inválido"),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const navigate = useNavigate()
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      })
      // Sempre exibir a mesma mensagem — não revelar se e-mail existe
      toast.success("Se o e-mail existir, um código foi enviado.")
      navigate("/auth/reset-password")
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail da conta</FormLabel>
              <FormControl>
                <Input type="email" placeholder="voce@email.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AsyncButton type="submit" loading={form.formState.isSubmitting} className="w-full">
          Enviar código de recuperação
        </AsyncButton>
      </form>
    </Form>
  )
}
