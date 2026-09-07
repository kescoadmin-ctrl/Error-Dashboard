import React, { useState, useEffect } from 'react'
import { saveSnapshot } from '../../utils/db'
import { parseUploadedFile } from '../../utils/db'

export default function Upload({ user, onSectionChange, onBreadcrumbChange, onSnapshotsChange }) {
  const [parsedData, setParsedData] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedColumns, setSelectedColumns] = useState({})
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    onBreadcrumbChange('Home › Data Management › Upload Data')
  }, [onBreadcrumbChange])

  const handleFileSelect = async (file) => {
    setUploadStatus('Parsing file...')
    try {
      const data = await parseUploadedFile(file)
      setParsedData(data)

      // Initialize column selections (exclude mandatory columns)
      const colSelections = {}
      const mandatory = ['COMPLAINT_NO', 'COMPLAINT_TYPE', 'VERTICAL', 'AGING', 'SUBSTATION']
      const piiColumns = ['CONSUMER_NAME', 'CONSUMER_MOBILE', 'CONSUMER_ADDRESS', 'CONSUMER_ACCOUNT_NO', 'REMARKS']

      data.headers.forEach(h => {
        if (!mandatory.includes(h)) {
          colSelections[h] = !piiColumns.some(pii => h.includes(pii))
        }
      })
      setSelectedColumns(colSelections)

      setUploadStatus(`Parsed ${data.records.length} valid rows, found ${data.flagged.length} flags`)
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`)
    }
  }

  const handleUpload = async () => {
    if (!parsedData || !selectedDate) {
      alert('Please select a date')
      return
    }

    setUploading(true)
    try {
      const mandatory = ['COMPLAINT_NO', 'COMPLAINT_TYPE', 'VERTICAL', 'AGING', 'SUBSTATION']
      const keepCols = [
        ...mandatory,
        ...Object.keys(selectedColumns).filter(k => selectedColumns[k])
      ]

      const cleanRecords = parsedData.records.map(r => {
        const out = {}
        keepCols.forEach(c => {
          if (r[c] !== undefined) out[c] = r[c]
        })
        return out
      })

      await saveSnapshot(user.id, selectedDate, {
        filename: parsedData.filename,
        timestamp: new Date().toISOString(),
        selectedColumns: keepCols,
        hasSource: parsedData.hasSource,
        flagged: parsedData.flagged,
      }, cleanRecords)

      await onSnapshotsChange?.()

      alert(`Data file for ${selectedDate} saved successfully!`)
      setParsedData(null)
      setUploadStatus('')
      setSelectedColumns({})
    } catch (error) {
      setUploadStatus(`Upload error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="panel">
      <h2 className="serif">Upload Data File</h2>
      <p className="mb-10 text-muted">Accepted file types: .xlsx, .xls, .csv — no file size limit.</p>

      <div
        className="drop-zone"
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover') }}
        onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('dragover')
          if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0])
          }
        }}
      >
        <p>Drag & Drop file here or</p>
        <button
          className="primary mt-10"
          onClick={() => document.getElementById('fileInput').click()}
        >
          Choose File
        </button>
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={(e) => {
            if (e.target.files.length) handleFileSelect(e.target.files[0])
          }}
        />
      </div>

      {uploadStatus && (
        <div className="mb-10">
          <strong>Status:</strong> <span>{uploadStatus}</span>
        </div>
      )}

      {parsedData && (
        <div className="mt-10">
          <h3 className="serif mb-10">Select columns to retain</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Required columns are always retained. Deselect PII columns to save storage.
          </p>

          <div className="chip-group">
            {Object.keys(selectedColumns).map(col => (
              <div
                key={col}
                className={`chip ${selectedColumns[col] ? 'selected' : ''}`}
                onClick={() => setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }))}
              >
                {col}
              </div>
            ))}
          </div>

          <div className="mt-10">
            <label>
              Data File Date:{' '}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>
            <button
              className="primary"
              onClick={handleUpload}
              disabled={uploading}
              style={{ marginLeft: '10px' }}
            >
              {uploading ? 'Uploading...' : 'Save Data File'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
