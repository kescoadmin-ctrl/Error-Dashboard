import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Header({ user, userRole, breadcrumb, onThemeToggle, theme }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      <div className="top-band">
        <div className="top-band-left">
          <div className="title-block">
            <h1 className="serif">Error Dashboard</h1>
            <p>Data Management & Monitoring System</p>
          </div>
        </div>
        <div className="top-band-right">
          <div className="user-info">
            {user?.email}
            <div className="user-role">{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : ''}</div>
          </div>
          <button
            className="btn"
            onClick={handleLogout}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="tricolour"></div>
      <div className="sec-bar">
        <div className="breadcrumb">{breadcrumb || 'Home'}</div>
        <div className="sec-bar-controls">
          <button onClick={() => window.location.reload()} style={{ padding: '4px 8px' }}>
            ↻ Refresh
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Dark Mode
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="themeToggle"
                checked={theme === 'dark'}
                onChange={onThemeToggle}
              />
              <span className="slider"></span>
            </div>
          </label>
        </div>
      </div>
    </>
  )
}
