import { Link } from "react-router-dom"
import {
  Activity,
  Eye,
  MessageSquareOff,
  Radio,
  Shield,
  Terminal,
  Users,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ServersMarquee } from "@/components/shared/ServersMarquee"
import { getAuthMode, getToken } from "@/lib/auth"

const FEATURES = [
  {
    icon: Eye,
    title: "Monitoramento em tempo real",
    description:
      "Saiba quando um usuário entra ou sai de canal de voz, edita ou apaga mensagens, e quando te menciona. Cada movimento registrado.",
  },
  {
    icon: Radio,
    title: "Múltiplas contas de coleta",
    description:
      "Adicione tokens selfbot para ampliar o alcance do monitoramento. Mais contas, mais cobertura, zero gaps.",
  },
  {
    icon: Users,
    title: "Gestão de alvos",
    description:
      "Cadastre os usuários Discord que você quer acompanhar. O sistema faz o resto — sem você precisar ficar online.",
  },
  {
    icon: Activity,
    title: "Feed de eventos",
    description:
      "Histórico completo e filtrado de todos os eventos: por tipo, por período, por alvo. Nada se perde.",
  },
  {
    icon: MessageSquareOff,
    title: "Limpeza de mensagens",
    description:
      "Apague suas mensagens em DMs, canais ou servidores inteiros com um clique. Controle total sobre o que você deixou para trás.",
  },
  {
    icon: Terminal,
    title: "Automações de conta",
    description:
      "Feche DMs, saia de servidores, remova amizades. Ferramentas de automação para gerenciar sua presença no Discord sem esforço.",
  },
]

export function LandingPage() {
  const isLoggedIn = !!getToken()
  const isLocalAuth = getAuthMode() === "local"
  const guestPrimaryLink = isLocalAuth ? "/auth/register" : "/auth/login"
  const guestPrimaryText = isLocalAuth ? "Começar agora" : "Entrar com Discord"

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold tracking-tight text-foreground">DaemonLogs</span>
          </div>

          <nav className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Acessar painel</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth/login">Entrar</Link>
                </Button>
                {isLocalAuth && (
                  <Button size="sm" asChild>
                    <Link to="/auth/register">Criar conta</Link>
                  </Button>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center">
        <Badge variant="outline" className="mb-6 border-accent/30 bg-accent/5 text-accent">
          Monitoramento Discord
        </Badge>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Olhe para a tela e diga:{" "}
          <span className="text-accent">estou de olho em você.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          DaemonLogs monitora atividades no Discord de forma
          silenciosa, te dá controle real sobre o que acontece ao seu redor. Você pode verificar canais que uma pessoa entra, quem estava lá, mensagens enviadas, editadas, apagadas. Além é claro, de você conseguir automatizar sua conta.
          Joe aprovaria.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link to={isLoggedIn ? "/dashboard" : guestPrimaryLink}>
              {isLoggedIn ? "Acessar painel" : guestPrimaryText}
            </Link>
          </Button>
          {!isLoggedIn && (
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth/login">{isLocalAuth ? "Já tenho conta" : "Entrar"}</Link>
            </Button>
          )}
        </div>

        {/* Decorative stats */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { label: "Tipos de evento", value: "6" },
            { label: "Ferramentas de automação", value: "5+" },
            { label: "Latência de coleta", value: "~1s" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="text-3xl font-bold text-accent">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <ServersMarquee className="mt-16 w-full text-left" />
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-surface/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Tudo que você precisa para manter o controle
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Recursos projetados para quem leva monitoramento a sério.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-border/50 bg-surface">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
                      <feature.icon className="h-4 w-4 text-accent" />
                    </div>
                    <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <Zap className="mx-auto mb-4 h-8 w-8 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">
            Pronto para saber de tudo?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Configure em minutos. Sem complexidade, sem instalação local. Só resultados.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to={isLoggedIn ? "/dashboard" : guestPrimaryLink}>
                {isLoggedIn ? "Ir para o painel" : isLocalAuth ? "Criar conta gratis" : "Entrar com Discord"}
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Plano freemium disponível. Sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>DaemonLogs — Use com responsabilidade.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
