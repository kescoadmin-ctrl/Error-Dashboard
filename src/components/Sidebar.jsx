import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Sidebar({ isCoordinator, flaggedCount, errorCount }) {
  const navigate = useNavigate()
  const location = useLocation()

  const getNavPath = (target) => {
    const basePath = isCoordinator ? '/coordinator' : '/admin'
    return `${basePath}/${target}`
  }

  const isActive = (path) => {
    return location.pathname.includes(path)
  }

  const NavItem = ({ label, target, badge, isVisible = true }) => {
    if (!isVisible) return null

    return (
      <div
        className={`nav-item ${isActive(target) ? 'active' : ''}`}
        onClick={() => navigate(getNavPath(target))}
      >
        <span>{label}</span>
        {badge > 0 && <span className="badge">{badge}</span>}
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="nav-group">
        <div className="nav-group-title">Overview</div>
        <NavItem label="Dashboard" target="dashboard" />
        <NavItem label="Flagged Rows" target="flagged" badge={flaggedCount} />
        <NavItem label="Trend & History" target="trend" />
      </div>

      <div className="nav-group">
        <div className="nav-group-title">Data Management</div>
        <NavItem label="Upload Data" target="upload" isVisible={isCoordinator} />
        <NavItem label="Uploaded Data Files" target="snapshots" />
        <NavItem label="Compare Two Dates" target="compare" />
        <NavItem label="Errors & Conflicts" target="errors" badge={errorCount} />
      </div>

      <div className="nav-group">
        <div className="nav-group-title">Tools</div>
        <NavItem label="Search Complaint No." target="search" />
        <NavItem label="Download Output" target="download" />
        <NavItem label="Backup / Restore Data" target="backup" isVisible={isCoordinator} />
        <NavItem label="Display Settings" target="settings" isVisible={isCoordinator} />
      </div>
    </div>
  )
}
