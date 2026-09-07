import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function RoleSelector() {
  const navigate = useNavigate()

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

      <div className="role-selector">
        <h1 className="serif" style={{ marginTop: '60px' }}>Select Your Role</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Choose how you want to access the dashboard
        </p>

        <div className="role-buttons">
          <div className="role-button" onClick={() => navigate('/login/administrator')}>
            <h2>👤 Administrator</h2>
            <p>View-only access to all reports and analytics</p>
          </div>
          <div className="role-button" onClick={() => navigate('/login/coordinator')}>
            <h2>📊 Coordinator</h2>
            <p>Upload and manage data files</p>
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
