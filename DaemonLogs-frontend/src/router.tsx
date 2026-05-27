import { Navigate, createBrowserRouter } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { GuestRoute } from "@/components/auth/GuestRoute"
import { AppShell } from "@/components/layout/AppShell"
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ActivatePage } from "@/pages/auth/ActivatePage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { LandingPage } from "@/pages/LandingPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { HowItWorksPage } from "@/pages/HowItWorksPage"
import { MonitoringPage } from "@/pages/MonitoringPage"
import { MonitoringContributePage } from "@/pages/MonitoringContributePage"
import { TargetsPage } from "@/pages/TargetsPage"
import { EventsPage } from "@/pages/EventsPage"
import { ToolsPage } from "@/pages/ToolsPage"
import { PaymentsPage } from "@/pages/PaymentsPage"
import { ProfilePage } from "@/pages/ProfilePage"

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  {
    element: <GuestRoute />,
    children: [
      { path: "/auth/login", element: <LoginPage /> },
      { path: "/auth/register", element: <RegisterPage /> },
      { path: "/auth/activate", element: <ActivatePage /> },
      { path: "/auth/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/auth/reset-password", element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/how-it-works", element: <HowItWorksPage /> },
          { path: "/monitoring", element: <MonitoringPage /> },
          { path: "/monitoring-contribute", element: <MonitoringContributePage /> },
          { path: "/targets", element: <TargetsPage /> },
          { path: "/events", element: <EventsPage /> },
          { path: "/tools", element: <ToolsPage /> },
          { path: "/payments", element: <PaymentsPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
