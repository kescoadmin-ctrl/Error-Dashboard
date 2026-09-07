import React, { useState, useEffect } from 'react'
import { getSnapshotRecords } from '../../utils/db'

export default function Errors({ user, snapshots, onBreadcrumbChange }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [errorRows, setErrorRows] = useState([])

  useEffect(() => {
    onBreadcrumbChange('Home › Data Management › Errors & Conflicts')
    if (snapshots.length > 0) {
      setSelectedDate(snapshots[0].dateStr)
    }
  }, [snapshots, onBreadcrumbChange])

  useEffect(() => {
    const loadErrors = async () => {
      if (selectedDate) {
        const records = await getSnapshotRecords(user.id, selectedDate)
        setErrorRows(records.flagged || [])
      }
    }
    loadErrors()
  }, [selectedDate, user.id])

  return (
    <div className="panel">
      <h2 className="serif flex-between">
        <span>Errors & Conflicts</span>
        <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
          {snapshots.map(s => (
            <option key={s.dateStr} value={s.dateStr}>{s.dateStr}</option>
          ))}
        </select>
      </h2>
      <p className="mb-10 text-muted">Rows flagged during parsing or day-over-day mismatch.</p>

      {errorRows.length === 0 ? (
        <div className="empty-state">No errors for this data file.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
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
              {errorRows.map((row, idx) => (
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
