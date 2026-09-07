import React, { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { getSnapshotRecords, getCompareDiff } from '../../utils/db'
import { getFlowData } from '../../utils/export'

Chart.register(...registerables, ChartDataLabels)

function MultiSelectDropdown({ label, options, selected, onChange, open, onToggle }) {
  const toggleOption = (option) => {
    onChange(selected.includes(option)
      ? selected.filter(value => value !== option)
      : [...selected, option])
  }

  return (
    <div className="multi-select">
      <button type="button" className="multi-select-trigger" onClick={onToggle} aria-expanded={open}>
        {label}: {selected.length ? `${selected.length} selected` : 'All'} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="multi-select-menu">
          {options.length === 0 ? (
            <span className="multi-select-empty">No values available</span>
          ) : (
            options.map(option => (
              <label className="multi-select-option" key={option}>
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span>{option}</span>
              </label>
            ))
          )}
          {selected.length > 0 && (
            <button type="button" className="multi-select-clear" onClick={() => onChange([])}>
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Compare({ user, snapshots, onBreadcrumbChange }) {
  const [oldDate, setOldDate] = useState('')
  const [newDate, setNewDate] = useState('')
  const [compareResult, setCompareResult] = useState(null)
  const [drillType, setDrillType] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedVerticals, setSelectedVerticals] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedAgings, setSelectedAgings] = useState([])
  const [openFilter, setOpenFilter] = useState(null)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const filterRef = useRef(null)

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
      oldRecords: oldRecords.records,
      newRecords: newRecords.records,
      ...diff,
    })

    setDrillType(null)
    setSearchFilter('')
    setSelectedVerticals([])
    setSelectedTypes([])
    setSelectedAgings([])
    setOpenFilter(null)
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

  useEffect(() => {
    if (!compareResult) return
    renderFlowChart(compareResult.oldRecords, compareResult.newRecords)
  }, [compareResult])

  useEffect(() => () => {
    chartInstance.current?.destroy()
  }, [])

  const getDrillData = () => {
    if (!compareResult || !drillType) return []
    const data = compareResult[drillType] || []
    return data.filter(r => {
      const matchesSearch = !searchFilter || r.COMPLAINT_NO?.toString().toLowerCase().includes(searchFilter.toLowerCase())
      const matchesVertical = selectedVerticals.length === 0 || selectedVerticals.includes(r.VERTICAL || 'Unknown')
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(r.COMPLAINT_TYPE || 'Unknown')
      const matchesAging = selectedAgings.length === 0 || selectedAgings.includes(r.AGING || 'Unknown')
      return matchesSearch && matchesVertical && matchesType && matchesAging
    })
  }

  const getFilterOptions = (field) => {
    if (!compareResult || !drillType) return []
    return [...new Set((compareResult[drillType] || []).map(row => row[field] || 'Unknown'))].sort()
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setOpenFilter(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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
              </h2>
              <div className="compare-filters" ref={filterRef}>
                <input
                  type="text"
                  placeholder="Filter by Complaint No..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <MultiSelectDropdown
                  label="Vertical"
                  options={getFilterOptions('VERTICAL')}
                  selected={selectedVerticals}
                  onChange={setSelectedVerticals}
                  open={openFilter === 'vertical'}
                  onToggle={() => setOpenFilter(openFilter === 'vertical' ? null : 'vertical')}
                />
                <MultiSelectDropdown
                  label="Type"
                  options={getFilterOptions('COMPLAINT_TYPE')}
                  selected={selectedTypes}
                  onChange={setSelectedTypes}
                  open={openFilter === 'type'}
                  onToggle={() => setOpenFilter(openFilter === 'type' ? null : 'type')}
                />
                <MultiSelectDropdown
                  label="Aging"
                  options={getFilterOptions('AGING')}
                  selected={selectedAgings}
                  onChange={setSelectedAgings}
                  open={openFilter === 'aging'}
                  onToggle={() => setOpenFilter(openFilter === 'aging' ? null : 'aging')}
                />
                <span className="compare-filter-count">
                  Showing {getDrillData().length} of {(compareResult[drillType] || []).length} complaints
                </span>
              </div>
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
