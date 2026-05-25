import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { apiFetch, ApiError } from "@/lib/api"

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  code: z.string().min(1, "Informe o código"),
})

type FormData = z.infer<typeof schema>

export function ActivateForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const emailFromUrl = params.get("email") ?? ""

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailFromUrl },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await apiFetch("/auth/activate", {
        method: "POST",
        body: JSON.stringify(data),
      })
      toast.success("Conta ativada com sucesso!")
      navigate("/auth/login")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.error === "ACCOUNT_ALREADY_ACTIVATED") {
          toast.info("Conta já ativada. Faça login.")
          navigate("/auth/login")
        } else {
          toast.error(err.message)
        }
      }
    }
  }

  const handleResend = async () => {
    const email = form.getValues("email")
    if (!email) { toast.error("Informe o e-mail primeiro."); return }
    try {
      await apiFetch("/auth/resend-activation", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      toast.success("Código reenviado para " + email)
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
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="voce@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de ativação</FormLabel>
              <FormControl>
                <Input placeholder="123456" maxLength={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AsyncButton type="submit" loading={form.formState.isSubmitting} className="w-full">
          Ativar conta
        </AsyncButton>
        <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={handleResend}>
          Reenviar código
        </Button>
      </form>
    </Form>
  )
}
