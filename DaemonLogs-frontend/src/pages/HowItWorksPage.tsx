import { BookOpen, Compass, Radio, Rows3, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MonitoringContributeTrigger } from "@/components/shared/MonitoringContributeTrigger"

const TOPICS = [
  {
    icon: Compass,
    title: "Guias práticos",
    description: "Explicações objetivas para entender a rede, configurar recursos e decidir o próximo passo.",
  },
  {
    icon: Rows3,
    title: "Seções organizadas",
    description: "Este espaço concentra artigos específicos, para você consultar sem se perder entre telas operacionais.",
  },
  {
    icon: Sparkles,
    title: "Mais conteúdos no futuro",
    description: "Novos artigos e FAQs podem ser adicionados aqui sem misturar documentação com as ações do painel.",
  },
]

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
          Guia do sistema
        </Badge>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Como funciona?</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Este espaço reúne explicações mais completas sobre a rede do DaemonLogs. A ideia
            é concentrar guias, artigos e instruções operacionais sem poluir as telas de uso
            diário.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TOPICS.map((topic) => (
          <Card key={topic.title} className="bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <topic.icon className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-sm font-semibold text-foreground">{topic.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {topic.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-surface">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <Radio className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Contribuir com monitoramentos
              </CardTitle>
              <CardDescription className="mt-1 text-sm leading-relaxed">
                Entenda como a rede de contas de monitoramento funciona, por que ela cresce com
                a colaboração dos usuários e qual é o fluxo para adicionar novas contas ao sistema.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Esse artigo é o primeiro bloco deste centro de ajuda. Outros guias podem entrar aqui
            depois, mantendo tudo organizado por assunto.
          </p>
          <div className="flex flex-wrap gap-3">
            <MonitoringContributeTrigger size="sm" />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/monitoring-contribute">
                Abrir artigo
                <BookOpen className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}