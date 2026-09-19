import { Navigate } from "react-router-dom"
import { useStore } from "../lib/store"
import { useAuth } from "../lib/auth"

export default function Guard({ role, children }) {
  const { sessionUser } = useStore()
  const { user, loading } = useAuth()

  if (loading) return null; // or a spinner

  if (role === "employee") {
    if (!user) return <Navigate to="/login" replace />
    if (!user.onboarded) return <Navigate to="/onboarding" replace />
    return children
  }

  if (role === "hr") {
    if (!sessionUser) return <Navigate to="/login?role=hr" replace />
    if (sessionUser.role !== "hr") return <Navigate to="/app" replace />
    return children
  }

  return children
}
