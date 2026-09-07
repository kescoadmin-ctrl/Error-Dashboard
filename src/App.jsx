import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { supabase } from './supabase'

import RoleSelector from './pages/RoleSelector'
import LoginPage from './pages/LoginPage'
import CoordinatorLayout from './pages/CoordinatorLayout'
import AdminLayout from './pages/AdminLayout'
import PrivateRoute from './components/PrivateRoute'
import AppErrorBoundary from './components/AppErrorBoundary'

import './index.css'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Restore an existing session before rendering protected routes.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await fetchUserRole(session.user.id)
      }
      if (mounted) setLoading(false)
    }).catch((error) => {
      console.error('Error restoring session:', error)
      if (mounted) setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchUserRole(session.user.id)
      } else {
        setUser(null)
        setUserRole(null)
      }
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  async function fetchUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) {
        setUserRole(data.role)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <AppErrorBoundary>
      <Router>
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<RoleSelector />} />
        <Route path="/login/administrator" element={<LoginPage role="administrator" />} />
        <Route path="/login/coordinator" element={<LoginPage role="coordinator" />} />

        {/* Protected routes */}
        <Route
          path="/coordinator/*"
          element={
            <PrivateRoute user={user} userRole={userRole} requiredRole="coordinator">
              <CoordinatorLayout user={user} />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <PrivateRoute user={user} userRole={userRole} requiredRole="administrator">
              <AdminLayout user={user} />
            </PrivateRoute>
          }
        />
        </Routes>
      </Router>
    </AppErrorBoundary>
  )
}

export default App
