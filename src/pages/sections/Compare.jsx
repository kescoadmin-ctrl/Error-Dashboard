import React, { useState, useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { getSnapshotRecords, getCompareDiff } from '../../utils/db'
import { getFlowData } from '../../utils/export'

Chart.register(ChartDataLabels)

export default function Compare({ user, snapshots, onBreadcrumbChange }) {
  const [oldDate, setOldDate] = useState('')
  const [newDate, setNewDate] = useState('')
  const [compareResult, setCompareResult] = useState(null)
  const [drillType, setDrillType] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    onBreadcrumbChange('Home › Data Management › Compare Two Dates')
    if (snapshots.length >= 2) {
      setNewDate(snapshots[0].dateStr)
      setOldDate(snapshots[1].dateStr)
    }
  }, [snapshots, onBreadcrumbChange])

  const handleCompare = async () => {
    if (!oldDate || !newDate) {
      alert('Select both dates')
      return
    }

    const oldRecords = await getSnapshotRecords(user.id, oldDate)
    const newRecords = await getSnapshotRecords(user.id, newDate)

    const diff = getCompareDiff(oldRecords.records, newRecords.records)
    setCompareResult({
      oldDate,
      newDate,
      oldFile: snapshots.find(s => s.dateStr === oldDate),
      newFile: snapshots.find(s => s.dateStr === newDate),
      ...diff,
    })

    renderFlowChart(oldRecords.records, newRecords.records)
    setDrillType(null)
  }

  const renderFlowChart = (oldRecords, newRecords) => {
    const data = getFlowData(oldRecords, newRecords)

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = document.getElementById('chartCompareFlow')
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [
            {
              data: data.data,
              backgroundColor: ['#138808', '#0B3866', '#FF9933'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            datalabels: { color: '#fff', font: { weight: 'bold' } },
            legend: { position: 'bottom' },
          },
        },
      })
    }
  }

  const getDrillData = () => {
    if (!compareResult || !drillType) return []
    const data = compareResult[drillType] || []
    return data.filter(r => {
      if (!searchFilter) return true
      return r.COMPLAINT_NO?.toString().includes(searchFilter)
    })
  }

  return (
    <div className="panel">
      <h2 className="serif">Compare Two Specific Dates</h2>

      <div className="mb-10">
        Old Date:
        <select value={oldDate} onChange={(e) => setOldDate(e.target.value)} style={{ marginLeft: '5px' }}>
          <option value="">Select...</option>
          {snapshots.map(s => (
            <option key={s.dateStr} value={s.dateStr}>{s.dateStr}</option>
          ))}
        </select>

        New Date:
        <select value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ marginLeft: '5px' }}>
          <option value="">Select...</option>
          {snapshots.map(s => (
            <option key={s.dateStr} value={s.dateStr}>{s.dateStr}</option>
          ))}
        </select>

        <button className="primary" onClick={handleCompare} style={{ marginLeft: '10px' }}>
          Compare
        </button>
      </div>

      {!compareResult && <div className="empty-state">Upload at least two data files to compare them.</div>}

      {compareResult && (
        <div>
          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '15px 0' }} />

          <div className="grid-2 mb-10">
            <div className="panel" style={{ background: 'var(--table-zebra)', marginBottom: '0' }}>
              <h3 className="serif" style={{ color: 'var(--navy)', marginBottom: '10px' }}>Old Data File</h3>
              <table>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', width: '40%' }}>Date</td><td>{compareResult.oldDate}</td></tr>
                  <tr><td style={{ fontWeight: 'bold' }}>File Name</td><td>{compareResult.oldFile?.filename}</td></tr>
                  <tr><td style={{ fontWeight: 'bold' }}>Total Records</td><td>{compareResult.oldFile?.recordCount}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="panel" style={{ background: 'var(--table-zebra)', marginBottom: '0' }}>
              <h3 className="serif" style={{ color: 'var(--navy)', marginBottom: '10px' }}>New Data File</h3>
              <table>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', width: '40%' }}>Date</td><td>{compareResult.newDate}</td></tr>
                  <tr><td style={{ fontWeight: 'bold' }}>File Name</td><td>{compareResult.newFile?.filename}</td></tr>
                  <tr><td style={{ fontWeight: 'bold' }}>Total Records</td><td>{compareResult.newFile?.recordCount}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2">
            <div className="panel">
              <h3 className="serif" style={{ marginBottom: '10px' }}>Change Summary</h3>
              <p className="mb-10 text-muted" style={{ fontSize: '12px' }}>Click a card to view details.</p>
              <div className="kpi-strip">
                <div className="kpi-card kpi-green clickable" onClick={() => setDrillType('resolved')}>
                  <h3>Resolved</h3>
                  <div className="value">{compareResult.resolved?.length || 0}</div>
                  <div className="subtext">View list</div>
                </div>
                <div className="kpi-card kpi-amber clickable" onClick={() => setDrillType('newAdded')}>
                  <h3>New Added</h3>
                  <div className="value">{compareResult.newAdded?.length || 0}</div>
                  <div className="subtext">View list</div>
                </div>
                <div className="kpi-card kpi-blue clickable" onClick={() => setDrillType('carried')}>
                  <h3>Carried Over</h3>
                  <div className="value">{compareResult.carried?.length || 0}</div>
                  <div className="subtext">View list</div>
                </div>
              </div>
            </div>
            <div className="panel">
              <h3 className="serif" style={{ marginBottom: '10px' }}>Visual Breakdown</h3>
              <div className="chart-container" style={{ height: '220px' }}>
                <canvas ref={chartRef} id="chartCompareFlow"></canvas>
              </div>
            </div>
          </div>

          {drillType && (
            <div className="panel">
              <h2 className="serif flex-between">
                <span>{drillType.charAt(0).toUpperCase() + drillType.slice(1)} Details</span>
                <input
                  type="text"
                  placeholder="Filter by Complaint No..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ width: '220px' }}
                />
              </h2>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr><th>Complaint No.</th><th>Vertical</th><th>Type</th><th>Aging</th></tr>
                  </thead>
                  <tbody>
                    {getDrillData().map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.COMPLAINT_NO}</td>
                        <td>{row.VERTICAL}</td>
                        <td>{row.COMPLAINT_TYPE}</td>
                        <td>{row.AGING}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
