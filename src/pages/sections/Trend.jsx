import React, { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { getSnapshotRecords } from '../../utils/db'

Chart.register(...registerables, ChartDataLabels)

export default function Trend({ user, snapshots, onBreadcrumbChange }) {
  const [trendData, setTrendData] = useState(null)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    onBreadcrumbChange('Home › Overview › Trend & History')
  }, [onBreadcrumbChange])

  useEffect(() => {
    let active = true

    const loadTrendData = async () => {
      const sorted = [...snapshots].sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr))
      const loaded = []

      for (const snapshot of sorted) {
        const records = await getSnapshotRecords(user.id, snapshot.dateStr)
        loaded.push({
          date: snapshot.dateStr,
          records: Array.isArray(records.records) ? records.records : [],
        })
      }

      const points = loaded.map((item, index) => {
        const previousRecords = loaded[index - 1]?.records || []
        const previousIds = new Set(previousRecords.map(record => String(record.COMPLAINT_NO || '')))
        const currentIds = new Set(item.records.map(record => String(record.COMPLAINT_NO || '')))

        return {
          date: item.date,
          pending: item.records.length,
          newlyAdded: index === 0 ? 0 : item.records.filter(record => !previousIds.has(String(record.COMPLAINT_NO || ''))).length,
          resolved: index === 0 ? 0 : previousRecords.filter(record => !currentIds.has(String(record.COMPLAINT_NO || ''))).length,
        }
      })

      if (active) setTrendData(points)
    }

    loadTrendData().catch(error => {
      console.error('Error loading trend data:', error)
      if (active) setTrendData([])
    })

    return () => {
      active = false
    }
  }, [snapshots, user.id])

  useEffect(() => {
    renderTrendChart()
  }, [trendData])

  const renderTrendChart = () => {
    if (!trendData?.length) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = document.getElementById('chartTrend')
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: trendData.map(point => point.date),
          datasets: [
            {
              label: 'Pending complaints',
              data: trendData.map(point => point.pending),
              borderColor: '#0B3866',
              backgroundColor: 'rgba(11, 56, 102, 0.1)',
              fill: true,
              tension: 0.25,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Resolved',
              data: trendData.map(point => point.resolved),
              borderColor: '#138808',
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.25,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Newly added',
              data: trendData.map(point => point.newlyAdded),
              borderColor: '#CB4154',
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.25,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            datalabels: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        },
      })
    }
  }

  return (
    <div className="panel">
      <h2 className="serif">Trend & History</h2>
      {snapshots.length < 2 ? (
        <div className="empty-state">Upload at least two dated files to show a trend.</div>
      ) : (
        <div className="chart-container" style={{ height: '400px' }}>
          <canvas ref={chartRef} id="chartTrend"></canvas>
        </div>
      )}
    </div>
  )
}
