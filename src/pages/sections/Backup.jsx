import React, { useState, useEffect } from 'react'
import { exportDataToJSON, importDataFromJSON } from '../../utils/db'
import { downloadBlob } from '../../utils/export'

export default function Backup({ user, onBreadcrumbChange }) {
  const [message, setMessage] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    onBreadcrumbChange('Home › Tools › Backup / Restore Data')
  }, [onBreadcrumbChange])

  const handleExport = async () => {
    try {
      setMessage('Exporting data...')
      const data = await exportDataToJSON(user.id)
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      downloadBlob(blob, `kesco_backup_${new Date().toISOString().split('T')[0]}.json`)
      setMessage('Export completed')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(`Export error: ${error.message}`)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage('Importing data...')

    try {
      const text = await file.text()
      const result = await importDataFromJSON(user.id, text)
      setMessage(`Imported ${result.imported} files, skipped ${result.skipped}`)
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(`Import error: ${error.message}`)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="panel">
      <h2 className="serif">Backup & Restore Data</h2>
      <p className="mb-10 text-muted">Use these tools to backup your history or move it to another device.</p>

      <div className="grid-2">
        <div style={{ border: '1px solid var(--border-color)', padding: '15px' }}>
          <h3>Export Data</h3>
          <p className="text-muted mb-10" style={{ fontSize: '12px' }}>
            Download all stored data files as a JSON file.
          </p>
          <button className="primary" onClick={handleExport}>
            Export to JSON
          </button>
        </div>
        <div style={{ border: '1px solid var(--border-color)', padding: '15px' }}>
          <h3>Import Data</h3>
          <p className="text-muted mb-10" style={{ fontSize: '12px' }}>
            Restore from a previously exported JSON file. Warns on overlaps.
          </p>
          <input
            type="file"
            id="importInput"
            accept=".json"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
          <button
            className="btn"
            onClick={() => document.getElementById('importInput').click()}
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Select JSON File'}
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-10 text-muted" style={{ fontSize: '12px' }}>
          {message}
        </p>
      )}
    </div>
  )
}
