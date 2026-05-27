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
import { BackNavigationLink } from "@/components/shared/BackNavigationLink"
import { MonitoringContributeTrigger } from "@/components/shared/MonitoringContributeTrigger"
import { ServerMonitoringLookupCard } from "@/components/shared/ServerMonitoringLookupCard"
import { ServersMarquee } from "@/components/shared/ServersMarquee"
import { getAuthMode, getToken } from "@/lib/auth"
import { useTargetsAmount } from "@/hooks/useTargetsAmount"
import { useGuestAwareNavigate } from "@/hooks/useGuestAwareNavigate"

const FEATURES = [
  {
    icon: Eye,
    title: "Monitoramento em tempo real",
    description:
      "Saiba em qual servidor e canal, mensagens enviadas, deletadas em diferentes canais e servidores dos usuários que você desejar. Cada movimento registrado.",
  },
  {
    icon: Radio,
    title: "Múltiplas contas de coleta",
    description:
      "Adicione vários tokens selfbot para ampliar o alcance. Mais contas, cobertura total — nenhum evento escapa.",
  },
  {
    icon: Users,
    title: "Gestão de alvos",
    description:
      "Cadastre os IDs Discord que você quer rastrear. O sistema registra tudo automaticamente, 24h por dia, sem você precisar estar online.",
  },
  {
    icon: Activity,
    title: "Feed de eventos",
    description:
      "Histórico filtrado e completo de todos os eventos: por alvo, por tipo, por período. Nada se perde, nada some.",
  },
  {
    icon: MessageSquareOff,
    title: "Clear Chat",
    description:
      "Apague suas mensagens em DMs específicas, canais ou servidores inteiros com um clique. Controle total sobre o rastro que você deixou no Discord.",
  },
  {
    icon: Terminal,
    title: "Automações de conta",
    description:
      "Várias ferramentas de automação: clear chat, fechar DMs, sair de servidores, desfazer amizades, monitoramentos e muito mais.",
  },
]

export function LandingPage() {
  const isLoggedIn = !!getToken()
  const isLocalAuth = getAuthMode() === "local"
  const guestPrimaryLink = isLocalAuth ? "/auth/register" : "/auth/login"
  const guestPrimaryText = isLocalAuth ? "Começar agora" : "Entrar com Discord"
  const guestNavigate = useGuestAwareNavigate()
  const { data: targetsData } = useTargetsAmount()

  const handleExplore = () => {
    guestNavigate("/dashboard")
  }

  const handleMonitorTarget = () => {
    guestNavigate("/targets")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
              <Eye className="h-4 w-4 text-accent" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">DaemonLogs</span>
          </div>

          <nav className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button asChild size="sm" className="shadow-sm shadow-accent/20">
                <Link to="/dashboard">Acessar painel</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth/login">Entrar</Link>
                </Button>
                {isLocalAuth && (
                  <Button size="sm" className="shadow-sm shadow-accent/20" asChild>
                    <Link to="/auth/register">Criar conta</Link>
                  </Button>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 pt-4">
        <BackNavigationLink />
      </div>

      {/* Hero */}
      <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center overflow-hidden px-6 pb-24 pt-20 text-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center">
          <div className="h-[400px] w-[900px] rounded-full bg-accent/8 blur-3xl" />
        </div>

        <Badge
          variant="outline"
          className="mb-6 border-accent/40 bg-accent/10 px-4 py-1 text-accent shadow-sm shadow-accent/10"
        >
          Monitoramento Discord
        </Badge>

        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Olhe para a tela e diga:{" "}
          <span className="text-accent drop-shadow-[0_0_30px_hsl(265_88%_78%_/_0.4)]">
            estou de olho em você.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          DaemonLogs monitora atividades no Discord de forma silenciosa. Saiba em qual servidor e canal os usuários estão, o que escrevem, apagam e editam — em tempo real, sem você fazer nada.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" className="shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-shadow" asChild>
            <Link to={isLoggedIn ? "/dashboard" : guestPrimaryLink}>
              {isLoggedIn ? "Acessar painel" : guestPrimaryText}
            </Link>
          </Button>
          {!isLoggedIn && (
            <>
              <Button size="lg" variant="outline" className="border-border/60" asChild>
                <Link to="/auth/login">{isLocalAuth ? "Já tenho conta" : "Entrar"}</Link>
              </Button>
              <Button size="lg" variant="ghost" onClick={handleExplore}>
                Explorar painel
              </Button>
            </>
          )}
        </div>

        <Button
          variant="link"
          className="mt-2 h-auto px-0 text-sm text-accent"
          onClick={handleMonitorTarget}
        >
          Quero monitorar uma conta
        </Button>

        {/* Live targets counter */}
        {targetsData && targetsData.total > 0 && (
          <div className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-accent/20 bg-accent/5 px-5 py-2.5 shadow-sm shadow-accent/5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-sm text-foreground">
             Usuários da DaemonLogs estão monitorando {" "}
              <span className="font-bold text-accent">
                {targetsData.total.toLocaleString("pt-BR")}
              </span>{" "}
              contas agora. Quer monitorar também? Faça login e insira o ID da conta.
            </span>
          </div>
        )}

        <ServerMonitoringLookupCard className="mt-8" />

        <ServersMarquee
          className="mt-16 w-full text-left"
          title="Alguns dos servidores monitorados"
          showTotalSummary
        />

        <div className="mt-5 flex w-full flex-col gap-3 rounded-2xl border border-border/60 bg-surface/70 p-4 text-left sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Quer fortalecer a rede de monitoramento?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Entenda como contribuir com novas contas e ampliar a cobertura da rede.
            </p>
          </div>
          <MonitoringContributeTrigger className="sm:shrink-0" size="sm" />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-surface/40 py-20">
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
              <Card
                key={feature.title}
                className="group border-border/50 bg-surface transition-all duration-200 hover:border-accent/30 hover:bg-surface-2 hover:shadow-lg hover:shadow-accent/5"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                      <feature.icon className="h-5 w-5 text-accent" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{feature.title}</CardTitle>
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
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[300px] w-[600px] rounded-full bg-accent/6 blur-3xl" />
        </div>
        <div className="mx-auto max-w-xl px-6 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 shadow-lg shadow-accent/10">
            <Zap className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Pronto para saber de tudo?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Configure em minutos. Sem complexidade, sem instalação local. Só resultados.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-shadow" asChild>
              <Link to={isLoggedIn ? "/dashboard" : guestPrimaryLink}>
                {isLoggedIn ? "Ir para o painel" : isLocalAuth ? "Criar conta grátis" : "Entrar com Discord"}
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
