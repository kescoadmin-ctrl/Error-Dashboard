import React, { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { getTrendData } from '../../utils/export'

Chart.register(...registerables, ChartDataLabels)

export default function Trend({ user, snapshots, onBreadcrumbChange }) {
  const [topN, setTopN] = useState(10)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    onBreadcrumbChange('Home › Overview › Trend & History')
  }, [onBreadcrumbChange])

  useEffect(() => {
    renderTrendChart()
  }, [snapshots, topN])

  const renderTrendChart = () => {
    if (snapshots.length === 0) return

    const data = getTrendData(snapshots, topN)

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = document.getElementById('chartTrend')
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Total Complaints',
              data: data.data,
              borderColor: '#0B3866',
              backgroundColor: 'rgba(11, 56, 102, 0.1)',
              fill: true,
              tension: 0.4,
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
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    }
  }

  return (
    <div className="panel">
      <h2 className="serif">Trend & History</h2>
      <div className="chart-container" style={{ height: '400px' }}>
        <canvas ref={chartRef} id="chartTrend"></canvas>
      </div>
    </div>
  )
}
