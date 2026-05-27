import { ArrowRight, Network, Radio, Shield, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const STEPS = [
  "Crie uma conta dedicada para monitoramento. Pode ser uma conta separada, mantida apenas para essa finalidade.",
  "Adicione essa conta nos servidores em que você quer ampliar a cobertura da rede.",
  "Pegue o token dessa conta e cadastre-o na página de Monitoramento em /monitoring.",
  "Repita o processo com mais de uma conta sempre que quiser aumentar o alcance da coleta.",
]

const BENEFITS = [
  {
    icon: Network,
    title: "Rede mais espalhada",
    description: "Quanto mais contas válidas existem, mais servidores e contextos passam a ser vistos pela malha de monitoramento.",
  },
  {
    icon: Users,
    title: "Ganho coletivo",
    description: "Você fortalece a sua própria cobertura e também a dos outros usuários que contribuem com contas adicionais.",
  },
  {
    icon: Shield,
    title: "Operação separada",
    description: "Usar contas dedicadas ajuda a manter sua conta principal fora desse fluxo operacional do dia a dia.",
  },
]

export function MonitoringContributePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
          Artigo
        </Badge>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Quero contribuir com monitoramentos
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Usamos um sistema de monitoramento através de contas de usuários. Você pode criar
            uma conta fake e adicionar ela em servidores que deseja contribuir com a monitoração.
            Pega o token dela e adiciona na página de Monitoramento. Você pode usar mais de uma
            conta. Quanto mais contas tiver, melhor para o sistema.
          </p>
        </div>
      </div>

      <Card className="bg-surface">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <Radio className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Como a contribuição entra na rede
              </CardTitle>
              <CardDescription className="mt-1 text-sm leading-relaxed">
                Você estará contribuindo para si e para os outros usuários que também estarão
                adicionando mais contas. Assim a rede se espalha e, juntos, o sistema amplia a
                cobertura sobre o Discord.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              A lógica é simples: cada conta válida adicionada ao monitoramento aumenta a presença
              da rede em servidores diferentes. Isso melhora a descoberta de ambientes, fortalece a
              coleta e distribui melhor o trabalho entre as contas disponíveis.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Você pode fazer isso com uma ou várias contas dedicadas. Quanto mais contas ativas,
              melhor para o sistema como um todo.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resumo rápido
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Use contas dedicadas para monitoramento.</li>
              <li>Adicione essas contas aos servidores desejados.</li>
              <li>Cadastre os tokens em /monitoring.</li>
              <li>Mais contas significam mais cobertura.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title} className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <benefit.icon className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  {benefit.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {benefit.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Passo a passo para contribuir
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Se quiser transformar essa ideia em operação, siga este fluxo básico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {STEPS.map((step, index) => (
            <div key={step} className="flex gap-3 rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                {index + 1}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Próximo passo
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Se você já entendeu o fluxo, abra a área de monitoramento e adicione a primeira conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/monitoring">
              Abrir monitoramento
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/how-it-works">Voltar para Como funciona?</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}