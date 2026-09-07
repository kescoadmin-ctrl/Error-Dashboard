import React, { useState, useEffect } from 'react'
import { getSnapshot, getSnapshotRecords } from '../../utils/db'

export default function Flagged({ user, snapshots, onBreadcrumbChange }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [flaggedRows, setFlaggedRows] = useState([])

  useEffect(() => {
    onBreadcrumbChange('Home › Overview › Flagged Rows')
    if (snapshots.length > 0) {
      setSelectedDate(snapshots[0].dateStr)
    }
  }, [snapshots, onBreadcrumbChange])

  useEffect(() => {
    const loadFlagged = async () => {
      if (selectedDate) {
        const records = await getSnapshotRecords(user.id, selectedDate)
        setFlaggedRows(records.flagged || [])
      }
    }
    loadFlagged()
  }, [selectedDate, user.id])

  return (
    <div className="panel">
      <h2 className="serif flex-between">
        <span>Flagged Rows</span>
        <span className="badge">{flaggedRows.length}</span>
      </h2>
      <p className="mb-10 text-muted" style={{ fontSize: '12px' }}>
        Rows flagged during parsing (missing fields, duplicates, bad dates) and day-over-day mismatches
      </p>
      <div className="mb-10">
        Date:
        <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ marginLeft: '5px' }}>
          {snapshots.map(s => (
            <option key={s.dateStr} value={s.dateStr}>{s.dateStr}</option>
          ))}
        </select>
      </div>

      {flaggedRows.length === 0 ? (
        <div className="empty-state">No flagged rows for this data file.</div>
      ) : (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Complaint No.</th>
                <th>Details / Reason</th>
                <th>Row Data Snippet</th>
              </tr>
            </thead>
            <tbody>
              {flaggedRows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.type}</td>
                  <td>{row.id}</td>
                  <td>{row.details}</td>
                  <td>{row.row}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
