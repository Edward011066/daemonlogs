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
  username: z.string().min(3, "Mínimo 3 caracteres").max(50),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  referral_code: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function RegisterForm() {
  const navigate = useNavigate()
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      })
      toast.success("Conta criada! Verifique seu e-mail para ativar.")
      navigate(`/auth/activate?email=${encodeURIComponent(data.email)}`)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="voce@email.com" autoComplete="email" {...field} />
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
                <Input type="password" placeholder="••••••" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referral_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de indicação <span className="text-muted-foreground">(opcional)</span></FormLabel>
              <FormControl>
                <Input placeholder="ABC12345" {...field} />
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
          Criar conta
        </AsyncButton>
      </form>
    </Form>
  )
}
