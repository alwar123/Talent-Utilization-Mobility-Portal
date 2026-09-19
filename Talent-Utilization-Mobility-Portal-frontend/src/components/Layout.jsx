import { Link, Outlet, useLocation } from "react-router-dom"
import Footer from "./Footer"
import Header from "./Header"

export default function Layout() {
  const { pathname } = useLocation()
  const hideRail = pathname === "/login" || pathname === "/signup"

  return (
    <div className="relative min-h-svh bg-paper">
      <div className="site-grid" aria-hidden="true" />
      <Header />
      <Outlet />
      <Footer />
      {!hideRail ? (
        <Link
          to="/login"
          className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 bg-coral px-3 py-10 font-mono text-[13px] font-medium tracking-[0.38em] text-ink uppercase [writing-mode:vertical-rl] lg:block"
        >
          Sign In
        </Link>
      ) : null}
    </div>
  )
}
