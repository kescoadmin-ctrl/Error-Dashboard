import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Dashboard from './sections/Dashboard'
import Flagged from './sections/Flagged'
import Trend from './sections/Trend'
import Upload from './sections/Upload'
import Snapshots from './sections/Snapshots'
import Compare from './sections/Compare'
import Errors from './sections/Errors'
import Search from './sections/Search'
import Download from './sections/Download'
import Backup from './sections/Backup'
import Settings from './sections/Settings'
import { getAllSnapshots, onSnapshotsUpdate } from '../utils/db'

export default function CoordinatorLayout({ user }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('kesco_theme') || 'light')
  const [snapshots, setSnapshots] = useState([])
  const [flaggedCount, setFlaggedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [breadcrumb, setBreadcrumb] = useState('Home › Overview › Dashboard')

  const applySnapshots = (updatedSnapshots) => {
    setSnapshots(updatedSnapshots)
    const latest = updatedSnapshots[0]
    setFlaggedCount(latest?.flagCount || 0)
    setErrorCount(0)
  }

  const refreshSnapshots = async () => {
    if (!user) return
    applySnapshots(await getAllSnapshots(user.id))
  }

  // Subscribe to snapshot updates
  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshotsUpdate(user.id, applySnapshots)

    return unsubscribe
  }, [user])

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('kesco_theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        user={user}
        userRole="coordinator"
        breadcrumb={breadcrumb}
        onThemeToggle={handleThemeToggle}
        theme={theme}
      />

      <div className="app-container">
        <Sidebar
          isCoordinator={true}
          flaggedCount={flaggedCount}
          errorCount={errorCount}
        />

        <div className="main-content" id="printArea">
          <Routes>
            <Route
              path="dashboard"
              element={<Dashboard user={user} snapshots={snapshots} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route
              path="flagged"
              element={<Flagged user={user} snapshots={snapshots} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route
              path="trend"
              element={<Trend user={user} snapshots={snapshots} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route
              path="upload"
              element={<Upload user={user} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} onSnapshotsChange={refreshSnapshots} />}
            />
            <Route
              path="snapshots"
              element={<Snapshots user={user} snapshots={snapshots} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} onSnapshotsChange={refreshSnapshots} />}
            />
            <Route
              path="compare"
              element={<Compare user={user} snapshots={snapshots} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route
              path="errors"
              element={<Errors user={user} snapshots={snapshots} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route
              path="search"
              element={<Search user={user} snapshots={snapshots} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route
              path="download"
              element={<Download user={user} snapshots={snapshots} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route
              path="backup"
              element={<Backup user={user} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route
              path="settings"
              element={<Settings user={user} onSectionChange={setCurrentSection} onBreadcrumbChange={setBreadcrumb} />}
            />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>

      <div className="footer">
        <div>Error Dashboard | For internal use only.</div>
        <div>Helpline: 1912 | Page generated: <span>{new Date().toLocaleString()}</span></div>
      </div>
    </div>
  )
}
