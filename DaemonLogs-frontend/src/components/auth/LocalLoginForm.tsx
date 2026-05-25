import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { apiFetch, ApiError } from "@/lib/api"
import { setToken } from "@/lib/auth"

const schema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
})

type FormData = z.infer<typeof schema>

export function LocalLoginForm() {
  const navigate = useNavigate()
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      })
      setToken(res.token)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.error === "SESSION_IP_BLOCKED") {
          const retryAt = (err.meta?.retryAt as string) ?? ""
          toast.error(`Acesso bloqueado até ${retryAt ? new Date(retryAt).toLocaleString("pt-BR") : "amanhã"}.`)
        } else if (err.error === "ACCOUNT_NOT_ACTIVATED") {
          toast.error("Conta não ativada. Verifique seu e-mail.")
          navigate("/auth/activate")
        } else {
          toast.error(err.message)
        }
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuário</FormLabel>
              <FormControl>
                <Input placeholder="seu_usuario" autoComplete="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AsyncButton
          type="submit"
          loading={form.formState.isSubmitting}
          className="w-full"
        >
          Entrar
        </AsyncButton>
      </form>
    </Form>
  )
}
