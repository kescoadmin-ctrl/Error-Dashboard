import React, { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { getSnapshot, getSnapshotRecords } from '../../utils/db'
import { getCategoryBreakdownData, getFlowData, getAgingBucketData, getSubstationData, getSourceData, getSubstationPerformance } from '../../utils/export'

Chart.register(...registerables, ChartDataLabels)

export default function Dashboard({ user, snapshots, onBreadcrumbChange }) {
  const [dateOld, setDateOld] = useState('')
  const [dateNew, setDateNew] = useState('')
  const [oldData, setOldData] = useState(null)
  const [newData, setNewData] = useState(null)
  const [categoryBy, setCategoryBy] = useState('COMPLAINT_TYPE')
  const [topN, setTopN] = useState(10)
  const chartRefs = useRef({})
  const chartInstances = useRef({})

  useEffect(() => {
    onBreadcrumbChange('Home › Overview › Dashboard')
  }, [onBreadcrumbChange])

  // Set initial dates
  useEffect(() => {
    if (snapshots.length >= 2) {
      setDateNew(snapshots[0].dateStr)
      setDateOld(snapshots[1].dateStr)
    } else if (snapshots.length === 1) {
      setDateNew(snapshots[0].dateStr)
    }
  }, [snapshots])

  // Load data when dates change
  useEffect(() => {
    const loadData = async () => {
      setOldData(null)
      setNewData(null)

      const loadSnapshotData = async (date) => {
        if (!date) return { records: [], flagged: [], hasSource: false }

        const snap = await getSnapshot(user.id, date)
        if (!snap) return { records: [], flagged: [], hasSource: false }

        const storedData = await getSnapshotRecords(user.id, date)
        return {
          records: Array.isArray(storedData.records) ? storedData.records : [],
          flagged: Array.isArray(storedData.flagged) ? storedData.flagged : [],
          hasSource: Boolean(snap.hasSource),
        }
      }

      try {
        const [oldSnapshotData, newSnapshotData] = await Promise.all([
          loadSnapshotData(dateOld),
          loadSnapshotData(dateNew),
        ])
        setOldData(oldSnapshotData)
        setNewData(newSnapshotData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setOldData({ records: [], flagged: [], hasSource: false })
        setNewData({ records: [], flagged: [], hasSource: false })
      }
    }
    loadData()
  }, [dateOld, dateNew, user.id])

  // Update charts when data changes
  useEffect(() => {
    if (!oldData || !newData) return

    try {
      renderCategoryChart()
      renderFlowChart()
      renderAgingChart()
      renderSubstationTable()
      renderSourceChart()
    } catch (error) {
      console.error('Error rendering dashboard charts:', error)
    }
  }, [oldData, newData, categoryBy, topN])

  const renderCategoryChart = () => {
    const data = getCategoryBreakdownData(oldData.records, newData.records, categoryBy, topN)
    updateChart('chartCategory', {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          { label: 'Old', data: data.oldData, backgroundColor: '#6B8E23' },
          { label: 'Present', data: data.newData, backgroundColor: '#0B3866' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    })
  }

  const renderFlowChart = () => {
    const data = getFlowData(oldData.records, newData.records)
    updateChart('chartFlow', {
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

  const renderAgingChart = () => {
    const data = getAgingBucketData(newData.records)
    updateChart('chartAging', {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Count',
            data: data.data,
            backgroundColor: '#FF9933',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { position: 'bottom' } },
      },
    })
  }

  const renderSubstationTable = () => {
    const data = getSubstationData(newData.records, topN)
    const tbody = document.querySelector('#tableSubstation tbody')
    if (tbody) {
      tbody.innerHTML = data.labels
        .map((station, idx) => `<tr><td>${station}</td><td>${data.data[idx]}</td></tr>`)
        .join('')
    }
  }

  const renderSourceChart = () => {
    const emptyState = document.getElementById('sourceEmptyState')
    const chartContainer = document.getElementById('chartSourceContainer')
    if (!emptyState || !chartContainer) return

    if (!newData.hasSource) {
      emptyState.classList.remove('hidden')
      chartContainer.classList.add('hidden')
      return
    }

    emptyState.classList.add('hidden')
    chartContainer.classList.remove('hidden')

    const data = getSourceData(newData.records)
    updateChart('chartSource', {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            backgroundColor: ['#0B3866', '#FF9933', '#138808', '#6B8E23', '#FFBF00', '#CB4154'],
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

  const updateChart = (canvasId, config) => {
    const ctx = document.getElementById(canvasId)
    if (!ctx) return

    if (chartInstances.current[canvasId]) {
      chartInstances.current[canvasId].destroy()
    }

    chartInstances.current[canvasId] = new Chart(ctx, config)
  }

  useEffect(() => () => {
    Object.values(chartInstances.current).forEach(chart => chart.destroy())
  }, [])

  const kpis = oldData && newData ? calculateKPIs() : { oldPending: 0, presentPending: 0, resolved: 0, newAdded: 0, flagged: 0 }

  function calculateKPIs() {
    const oldSet = new Set(oldData.records.map(r => r.COMPLAINT_NO))
    const newSet = new Set(newData.records.map(r => r.COMPLAINT_NO))
    const resolved = oldSet.size - Array.from(oldSet).filter(id => newSet.has(id)).length
    const newAdded = newSet.size - Array.from(newSet).filter(id => oldSet.has(id)).length

    return {
      oldPending: oldData.records.length,
      presentPending: newData.records.length,
      resolved,
      newAdded,
      flagged: newData.flagged?.length || 0,
    }
  }

  const performance = oldData && newData ? getSubstationPerformance(oldData.records, newData.records) : []
  const topPerformers = [...performance]
    .sort((a, b) => b.resolved - a.resolved || a.newAdded - b.newAdded)
    .slice(0, 3)
  const bottomPerformers = [...performance]
    .sort((a, b) => b.newAdded - a.newAdded || a.resolved - b.resolved || a.netChange - b.netChange)
    .slice(0, 3)

  return (
    <div>
      <div className="flex-between mb-10">
        <h2 className="serif" style={{ color: 'var(--navy)' }}>Daily Data File Comparison</h2>
        <div>
          Compare:
          <select value={dateOld} onChange={(e) => setDateOld(e.target.value)} style={{ marginLeft: '5px' }}>
            <option value="">Select old date...</option>
            {snapshots.map(s => (
              <option key={s.dateStr} value={s.dateStr}>{s.dateStr}</option>
            ))}
          </select>
          vs
          <select value={dateNew} onChange={(e) => setDateNew(e.target.value)} style={{ marginLeft: '5px' }}>
            <option value="">Select new date...</option>
            {snapshots.map(s => (
              <option key={s.dateStr} value={s.dateStr}>{s.dateStr}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card kpi-blue">
          <h3>Old Pending</h3>
          <div className="value">{kpis.oldPending}</div>
          <div className="subtext">Previous data file</div>
        </div>
        <div className="kpi-card kpi-blue">
          <h3>Present Pending</h3>
          <div className="value">{kpis.presentPending}</div>
          <div className="subtext">Current data file</div>
        </div>
        <div className="kpi-card kpi-green">
          <h3>Resolved</h3>
          <div className="value">{kpis.resolved}</div>
          <div className="subtext">{kpis.oldPending > 0 ? Math.round((kpis.resolved / kpis.oldPending) * 100) : 0}% of old</div>
        </div>
        <div className="kpi-card kpi-amber">
          <h3>New Added</h3>
          <div className="value">{kpis.newAdded}</div>
          <div className="subtext">{kpis.presentPending > 0 ? Math.round((kpis.newAdded / kpis.presentPending) * 100) : 0}% of present</div>
        </div>
        <div className="kpi-card kpi-red">
          <h3>Flagged Rows</h3>
          <div className="value">{kpis.flagged}</div>
          <div className="subtext">Current data file</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2 className="serif">Category Breakdown (Old vs Present)</h2>
          <div className="mb-10">
            View by:
            <select value={categoryBy} onChange={(e) => setCategoryBy(e.target.value)} style={{ marginLeft: '5px' }}>
              <option value="COMPLAINT_TYPE">Complaint Type</option>
              <option value="VERTICAL">Vertical</option>
            </select>
          </div>
          <div className="chart-container">
            <canvas ref={(el) => (chartRefs.current['chartCategory'] = el)} id="chartCategory"></canvas>
          </div>
        </div>
        <div className="panel">
          <h2 className="serif">Day-over-Day Flow</h2>
          <div className="chart-container">
            <canvas ref={(el) => (chartRefs.current['chartFlow'] = el)} id="chartFlow"></canvas>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="serif">Aging Bucket Breakdown</h2>
        <div className="chart-container" style={{ height: '250px' }}>
          <canvas ref={(el) => (chartRefs.current['chartAging'] = el)} id="chartAging"></canvas>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2 className="serif">Substation Breakdown (Present)</h2>
          <div id="substationScrollWrap" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table id="tableSubstation">
              <thead><tr><th>Substation</th><th>Pending Count</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <h2 className="serif">Complaint Source (Present)</h2>
          <div id="sourceEmptyState" className="empty-state hidden">SOURCE column was not present in this upload.</div>
          <div className="chart-container" id="chartSourceContainer">
            <canvas ref={(el) => (chartRefs.current['chartSource'] = el)} id="chartSource"></canvas>
          </div>
        </div>
      </div>

      <div className="performer-grid">
        <div className="panel performer-panel performer-panel-top">
          <h2 className="serif">Top 3 Performers</h2>
          <p className="text-muted performer-description">Substations with the most complaints resolved between the selected dates.</p>
          {topPerformers.length === 0 ? (
            <div className="empty-state">Select comparison dates to view performance.</div>
          ) : (
            <div className="performer-list">
              {topPerformers.map((performer, index) => (
                <div className="performer-row" key={performer.substation}>
                  <div className="performer-rank">{index + 1}</div>
                  <div className="performer-name">{performer.substation}</div>
                  <div className="performer-metric">
                    <strong>{performer.resolved}</strong>
                    <span>resolved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel performer-panel performer-panel-bottom">
          <h2 className="serif">Bottom 3 Performers</h2>
          <p className="text-muted performer-description">Substations with rising complaints or fewer resolutions.</p>
          {bottomPerformers.length === 0 ? (
            <div className="empty-state">Select comparison dates to view performance.</div>
          ) : (
            <div className="performer-list">
              {bottomPerformers.map((performer, index) => (
                <div className="performer-row" key={performer.substation}>
                  <div className="performer-rank">{index + 1}</div>
                  <div className="performer-name">{performer.substation}</div>
                  <div className="performer-metric">
                    <strong>{performer.newAdded > 0 ? `+${performer.newAdded}` : performer.resolved}</strong>
                    <span>{performer.newAdded > 0 ? 'new complaints' : 'resolved'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
