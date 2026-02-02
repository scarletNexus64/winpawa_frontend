import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import InstallPWA from './components/InstallPWA'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Home from './pages/Home'
import Games from './pages/Games'
import GamePlay from './pages/GamePlay'
import VirtualMatch from './pages/VirtualMatch'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import Affiliate from './pages/Affiliate'
import History from './pages/History'
import Notifications from './pages/Notifications'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import RegisterSuccess from './pages/auth/RegisterSuccess'
import NotFound from './pages/NotFound'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user } = useAuthStore()
  return !user ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a2332',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* PWA Install Prompt */}
      <InstallPWA />

      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <Register />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register/success"
          element={<RegisterSuccess />}
        />

        {/* Game Play Route (Fullscreen - Outside MainLayout) */}
        <Route
          path="games/:slug"
          element={
            <ProtectedRoute>
              <GamePlay />
            </ProtectedRoute>
          }
        />

        {/* Main App Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="games" element={<Games />} />
          <Route path="virtual-match" element={<VirtualMatch />} />
          <Route path="notifications" element={<Notifications />} />

          {/* Protected Routes */}
          <Route
            path="wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="affiliate"
            element={
              <ProtectedRoute>
                <Affiliate />
              </ProtectedRoute>
            }
          />
          <Route
            path="history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
