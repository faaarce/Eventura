import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAtomValue } from 'jotai'
import { userAtom } from './stores/auth'
import { getCurrentUser } from './utils/auth' 
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import EventsListPage from './pages/events/EventsListPage'
import EventDetailPage from './pages/events/EventDetailPage'
import CheckoutPage from './pages/events/CheckoutPage'
import OrganizerProfilePage from './pages/organizer/OrganizerProfilePage'

import ProfilePage from './pages/ProfilePage'
import TransactionDetailPage from './pages/transactions/TransactionDetailPage'

import DashboardLayout from './pages/organizer/DashboardLayout'
import DashboardStats from './pages/organizer/DashboardStats'
import DashboardEvents from './pages/organizer/DashboardEvents'
import DashboardEventNew from './pages/organizer/DashboardEventNew'
import DashboardEventEdit from './pages/organizer/DashboardEventEdit'
import DashboardAttendees from './pages/organizer/DashboardAttendees'
import DashboardVouchers from './pages/organizer/DashboardVouchers'
import DashboardTransactions from './pages/organizer/DashboardTransactions'

function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode
  role?: 'ORGANIZER' | 'CUSTOMER'
}) {
  const userFromAtom = useAtomValue(userAtom)
  const location = useLocation()

  const user = userFromAtom ?? getCurrentUser()

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  if (role && user.role !== role) {
    return <Navigate to="/events" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="/about" element={<AboutPage />} />

      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      <Route path="/events" element={<EventsListPage />} />
      <Route path="/events/:slug" element={<EventDetailPage />} />
      <Route path="/events/:slug/checkout" element={<CheckoutPage />} />

      <Route path="/organizer/:organizerId" element={<OrganizerProfilePage />} />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />

      <Route
        path="/transactions/:transactionId"
        element={
          <RequireAuth>
            <TransactionDetailPage />
          </RequireAuth>
        }
      />

      <Route
        path="/organizer/dashboard"
        element={
          <RequireAuth role="ORGANIZER">
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardStats />} />
        <Route path="events" element={<DashboardEvents />} />
        <Route path="events/new" element={<DashboardEventNew />} />
        <Route path="events/:eventId/edit" element={<DashboardEventEdit />} />
        <Route path="events/:eventId/attendees" element={<DashboardAttendees />} />
        <Route path="events/:eventId/vouchers" element={<DashboardVouchers />} />
        <Route path="transactions" element={<DashboardTransactions />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}