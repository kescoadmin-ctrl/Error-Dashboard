import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

export default function LoginPage({ role }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      const user = data.user

      // Fetch user role from database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) throw new Error('User profile not found')

      const userRole = userProfile.role

      // Check if the user's role matches the login page role
      if (userRole !== role) {
        await supabase.auth.signOut()
        throw new Error(`Invalid login. This account is registered as a ${userRole}.`)
      }

      // Redirect based on role
      if (role === 'administrator') {
        navigate('/admin/dashboard')
      } else if (role === 'coordinator') {
        navigate('/coordinator/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const roleDisplay = role === 'administrator' ? 'Administrator' : 'Coordinator'

  return (
    <div>
      <div className="top-band">
        <div className="top-band-left">
          <div className="title-block">
            <h1 className="serif">Error Dashboard</h1>
            <p>Data Management & Monitoring System</p>
          </div>
        </div>
      </div>
      <div className="tricolour"></div>

      <div className="auth-container">
        <div className="auth-card">
          <h1>{roleDisplay} Login</h1>
          <p>Sign in to your account</p>

          <form onSubmit={handleLogin} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              <a onClick={() => navigate('/')}>← Back to Role Selection</a>
            </p>
          </div>
        </div>
      </div>

      <div className="footer">
        <div>Error Dashboard | For internal use only.</div>
        <div>Helpline: 1912</div>
      </div>
    </div>
  )
}
