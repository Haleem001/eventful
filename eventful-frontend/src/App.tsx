import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"
import ProtectedRoute from "./components/ProtectedRoute"
import LandingPage from "./pages/LandingPage"
import ExploreEvents from "./pages/ExploreEvents"
import EventDetails from "./pages/EventDetails"
import MyTicket from "./pages/MyTicket"
import TicketDetail from "./pages/TicketDetail"
import CreatorDashboard from "./pages/CreatorDashboard"
import ScanTickets from "./pages/ScanTickets"
import ManageEvents from "./pages/ManageEvents"
import ManageTickets from "./pages/ManageTickets"
import AuthPage from "./pages/AuthPage"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/explore" element={<ExploreEvents />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route
              path="/ticket"
              element={
                <ProtectedRoute allowedRoles={["EVENTEE"]}>
                  <MyTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ticket/:ticketId"
              element={
                <ProtectedRoute allowedRoles={["EVENTEE"]}>
                  <TicketDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["CREATOR"]}>
                  <CreatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scan"
              element={
                <ProtectedRoute allowedRoles={["CREATOR"]}>
                  <ScanTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/events"
              element={
                <ProtectedRoute allowedRoles={["CREATOR"]}>
                  <ManageEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage/tickets/:eventId"
              element={
                <ProtectedRoute allowedRoles={["CREATOR"]}>
                  <ManageTickets />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
