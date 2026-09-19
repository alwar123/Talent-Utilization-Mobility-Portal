import { Navigate } from "react-router-dom"
import { useStore } from "../lib/store"

export default function Guard({ role, children }) {
  const { sessionUser } = useStore()
  if (!sessionUser) return <Navigate to="/login" replace />
  if (role && sessionUser.role !== role) return <Navigate to={sessionUser.role === "hr" ? "/hr" : "/app"} replace />
  if (role === "employee" && !sessionUser.onboarded) return <Navigate to="/onboarding" replace />
  return children
}
