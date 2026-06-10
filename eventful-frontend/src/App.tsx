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
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import VerifyEmail from "./pages/VerifyEmail"
import Profile from "./pages/Profile"
import Reminders from "./pages/Reminders"
import PaymentCallback from "./pages/PaymentCallback"
import GoogleCallback from "./pages/GoogleCallback"
import NotFound from "./pages/NotFound"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/login" element={<AuthPage />} />
            <Route path="/auth/signup" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
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
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["CREATOR", "EVENTEE"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoute allowedRoles={["CREATOR", "EVENTEE"]}>
                  <Reminders />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
