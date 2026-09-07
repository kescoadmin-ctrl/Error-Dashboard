import React, { useState, useEffect } from 'react'
import { getSnapshotRecords } from '../../utils/db'
import { exportToCSV, exportToPNG, exportToPDF } from '../../utils/export'

export default function Download({ user, snapshots, onBreadcrumbChange }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [filename, setFilename] = useState('')
  const [format, setFormat] = useState('csv')
  const [message, setMessage] = useState('')

  useEffect(() => {
    onBreadcrumbChange('Home › Tools › Download Output')
    setFilename(`KESCO_Dashboard_${new Date().toISOString().split('T')[0]}`)
    if (snapshots.length > 0) {
      setSelectedDate(snapshots[0].dateStr)
    }
  }, [snapshots, onBreadcrumbChange])

  const handleDownload = async () => {
    if (!filename) {
      alert('Enter a filename')
      return
    }

    try {
      setMessage('Preparing download...')

      if (format === 'csv') {
        const records = await getSnapshotRecords(user.id, selectedDate)
        exportToCSV(records.records, `${filename}.csv`)
      } else if (format === 'png') {
        await exportToPNG('printArea', `${filename}.png`)
      } else if (format === 'pdf') {
        await exportToPDF('printArea', `${filename}.pdf`)
      }

      setMessage('Download started')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    }
  }

  return (
    <div className="panel">
      <h2 className="serif">Download Output</h2>

      <div className="mb-10">
        <label>Data File (for CSV):</label>
        <br />
        <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ marginTop: '10px', width: '300px' }}>
          {snapshots.map(s => (
            <option key={s.dateStr} value={s.dateStr}>{s.dateStr}</option>
          ))}
        </select>
      </div>

      <div className="mb-10">
        <label>File Name:</label>
        <br />
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          style={{ width: '300px', marginTop: '10px' }}
        />
      </div>

      <div className="mb-10">
        <label>Format:</label>
        <br />
        <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: '300px', marginTop: '10px' }}>
          <option value="csv">CSV (Raw Data of Current Data File)</option>
          <option value="png">PNG (Image of Dashboard)</option>
          <option value="pdf">PDF (Document of Dashboard)</option>
        </select>
      </div>

      <button className="primary" onClick={handleDownload}>
        Save As...
      </button>

      {message && (
        <p className="mt-10 text-muted" style={{ fontSize: '12px' }}>
          {message}
        </p>
      )}
    </div>
  )
}
