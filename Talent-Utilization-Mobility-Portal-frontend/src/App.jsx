import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AppShell from "./components/AppShell"
import Guard from "./components/Guard"
import Layout from "./components/Layout"
import About from "./pages/About"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Onboarding from "./pages/Onboarding"
import Signup from "./pages/Signup"
import Assessments from "./pages/employee/Assessments"
import Chat from "./pages/employee/Chat"
import EmpDashboard from "./pages/employee/Dashboard"
import JobDetail from "./pages/employee/JobDetail"
import Profile from "./pages/employee/Profile"
import TakeAssessment from "./pages/employee/TakeAssessment"
import Analytics from "./pages/hr/Analytics"
import HrAssessments from "./pages/hr/Assessments"
import HrDashboard from "./pages/hr/Dashboard"
import HrEmployee from "./pages/hr/Employee"
import JobMatches from "./pages/hr/JobMatches"
import HrJobs from "./pages/hr/Jobs"
import NewJob from "./pages/hr/NewJob"
import Schedule from "./pages/hr/Schedule"

function EmpGate() {
  return (
    <Guard role="employee">
      <AppShell variant="employee" />
    </Guard>
  )
}

function HrGate() {
  return (
    <Guard role="hr">
      <AppShell variant="hr" />
    </Guard>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<EmpGate />}>
          <Route index element={<EmpDashboard />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="assessments/:id" element={<TakeAssessment />} />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/hr" element={<HrGate />}>
          <Route index element={<HrDashboard />} />
          <Route path="jobs" element={<HrJobs />} />
          <Route path="jobs/new" element={<NewJob />} />
          <Route path="jobs/:id" element={<JobMatches />} />
          <Route path="employees/:id" element={<HrEmployee />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="assessments" element={<HrAssessments />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
