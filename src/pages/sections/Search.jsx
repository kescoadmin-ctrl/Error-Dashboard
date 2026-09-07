import React, { useState, useEffect } from 'react'
import { getSnapshotRecords, getAllSnapshots } from '../../utils/db'

export default function Search({ user, snapshots, onBreadcrumbChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    onBreadcrumbChange('Home › Tools › Search Complaint No.')
  }, [onBreadcrumbChange])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      alert('Enter a complaint number')
      return
    }

    const foundResults = []

    for (const snapshot of snapshots) {
      const records = await getSnapshotRecords(user.id, snapshot.dateStr)
      const matching = records.records.filter(r =>
        r.COMPLAINT_NO?.toString().includes(searchTerm)
      )

      if (matching.length > 0) {
        foundResults.push({
          dateStr: snapshot.dateStr,
          filename: snapshot.filename,
          records: matching,
        })
      }
    }

    setResults(foundResults)
  }

  return (
    <div className="panel">
      <h2 className="serif">Search Complaint History</h2>

      <div className="flex-between mb-10" style={{ justifyContent: 'flex-start', gap: '10px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. KS05082603057"
          style={{ width: '300px' }}
        />
        <button className="primary" onClick={handleSearch}>
          Search
        </button>
      </div>

      {results.length === 0 && searchTerm && (
        <div className="empty-state">No results found for "{searchTerm}"</div>
      )}

      {results.map((result, idx) => (
        <div key={idx} className="mt-10">
          <h3 className="serif">{result.dateStr} ({result.filename})</h3>
          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table>
              <thead>
                <tr>
                  <th>Complaint No.</th>
                  <th>Type</th>
                  <th>Vertical</th>
                  <th>Aging</th>
                  <th>Substation</th>
                </tr>
              </thead>
              <tbody>
                {result.records.map((record, ridx) => (
                  <tr key={ridx}>
                    <td>{record.COMPLAINT_NO}</td>
                    <td>{record.COMPLAINT_TYPE}</td>
                    <td>{record.VERTICAL}</td>
                    <td>{record.AGING}</td>
                    <td>{record.SUBSTATION}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
