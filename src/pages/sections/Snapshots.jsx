import React, { useEffect } from 'react'
import { deleteSnapshot } from '../../utils/db'

export default function Snapshots({ user, snapshots, onBreadcrumbChange, onSnapshotsChange }) {
  useEffect(() => {
    onBreadcrumbChange('Home › Data Management › Uploaded Data Files')
  }, [onBreadcrumbChange])

  const handleDelete = async (dateStr) => {
    if (confirm(`Delete data for ${dateStr}?`)) {
      try {
        await deleteSnapshot(user.id, dateStr)
        await onSnapshotsChange?.()
        alert('Data deleted successfully')
      } catch (error) {
        alert(`Delete error: ${error.message}`)
      }
    }
  }

  return (
    <div className="panel">
      <h2 className="serif">Uploaded Data Files (History Register)</h2>

      {snapshots.length === 0 ? (
        <div className="empty-state">No data files uploaded yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Date of Data</th>
              <th>File Name</th>
              <th>Uploaded On</th>
              <th>Records</th>
              <th>Flags</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((snap, idx) => (
              <tr key={snap.dateStr}>
                <td>{idx + 1}</td>
                <td>{snap.dateStr}</td>
                <td>{snap.filename}</td>
                <td>{new Date(snap.updatedAt?.toDate?.() || snap.timestamp).toLocaleString()}</td>
                <td>{snap.recordCount || 0}</td>
                <td>{snap.flagCount || 0}</td>
                <td><span className="badge" style={{ backgroundColor: 'var(--olive)' }}>Active</span></td>
                <td>
                  {snap.userId === user.id && (
                    <button
                      className="btn"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleDelete(snap.dateStr)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
