import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AsyncButton } from "@/components/shared/AsyncButton"
import { Lock } from "lucide-react"
import { apiFetch, ApiError } from "@/lib/api"
import { toast } from "sonner"

const schema = z.object({
  current_password: z.string().min(1, "Informe a senha atual."),
  new_password: z.string().min(8, "Nova senha deve ter ao menos 8 caracteres."),
})

type FormData = z.infer<typeof schema>

export function ChangePasswordForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await apiFetch("/me/password", {
        method: "PATCH",
        body: JSON.stringify(data),
      })
      toast.success("Senha alterada com sucesso.")
      form.reset()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.error === "INVALID_CURRENT_PASSWORD") {
          form.setError("current_password", { message: "Senha atual incorreta." })
        } else {
          toast.error(err.message)
        }
      }
    }
  }

  return (
    <Card className="bg-surface">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Alterar senha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Senha atual</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <AsyncButton
              type="submit"
              size="sm"
              className="w-full"
              loading={form.formState.isSubmitting}
            >
              Alterar senha
            </AsyncButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
