import React, { useEffect } from 'react'

export default function SnapshotsReadOnly({ user, snapshots, onBreadcrumbChange }) {
  useEffect(() => {
    onBreadcrumbChange('Home › Data Management › Uploaded Data Files')
  }, [onBreadcrumbChange])

  return (
    <div className="panel">
      <h2 className="serif">Uploaded Data Files (History Register)</h2>

      {snapshots.length === 0 ? (
        <div className="empty-state">No data files available.</div>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
