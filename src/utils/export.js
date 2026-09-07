import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const AGING_BUCKETS = ['0-24hrs', '24 hrs to 3 Days', '3 to 7 Days', '7 to 15 Days', '15 to 30 Days', '30 to 90 Days', '90+ Days']

// Export as CSV
export function exportToCSV(records, filename) {
  if (!records.length) {
    alert('No data to export')
    return
  }

  const headers = Object.keys(records[0])
  const csvContent = [
    headers.join(','),
    ...records.map(row =>
      headers.map(h => {
        const val = row[h] || ''
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  downloadBlob(blob, filename)
}

// Export as PNG
export async function exportToPNG(elementId, filename) {
  const element = document.getElementById(elementId)
  if (!element) {
    alert('Element not found for export')
    return
  }

  document.body.classList.add('capturing')
  try {
    const canvas = await html2canvas(element, { scale: 2 })
    const blob = new Blob([canvas.toDataURL()], { type: 'image/png' })
    downloadBlob(blob, filename)
  } finally {
    document.body.classList.remove('capturing')
  }
}

// Export as PDF
export async function exportToPDF(elementId, filename) {
  const element = document.getElementById(elementId)
  if (!element) {
    alert('Element not found for export')
    return
  }

  document.body.classList.add('capturing')
  try {
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 10
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let yPosition = 5
    let remainingHeight = imgHeight

    pdf.addImage(imgData, 'PNG', 5, yPosition, imgWidth, imgHeight)

    while (remainingHeight > pageHeight - 10) {
      yPosition = remainingHeight - (pageHeight - 10)
      remainingHeight -= pageHeight - 10
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 5, -yPosition, imgWidth, imgHeight)
    }

    pdf.save(filename)
  } finally {
    document.body.classList.remove('capturing')
  }
}

// Generic download helper
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// Chart data preparation helpers
export function getCategoryBreakdownData(oldRecords, newRecords, categoryField, topN) {
  const oldCounts = {}
  const newCounts = {}

  oldRecords.forEach(r => {
    const key = r[categoryField] || 'Unknown'
    oldCounts[key] = (oldCounts[key] || 0) + 1
  })

  newRecords.forEach(r => {
    const key = r[categoryField] || 'Unknown'
    newCounts[key] = (newCounts[key] || 0) + 1
  })

  const allKeys = [...new Set([...Object.keys(oldCounts), ...Object.keys(newCounts)])]
    .sort((a, b) => (newCounts[b] || 0) - (newCounts[a] || 0))
    .slice(0, topN)

  return {
    labels: allKeys,
    oldData: allKeys.map(k => oldCounts[k] || 0),
    newData: allKeys.map(k => newCounts[k] || 0),
  }
}

export function getFlowData(oldRecords, newRecords) {
  const oldSet = new Set(oldRecords.map(r => r.COMPLAINT_NO))
  const newSet = new Set(newRecords.map(r => r.COMPLAINT_NO))

  const resolved = oldSet.size - Array.from(oldSet).filter(id => newSet.has(id)).length
  const carried = Array.from(oldSet).filter(id => newSet.has(id)).length
  const newAdded = newSet.size - Array.from(newSet).filter(id => oldSet.has(id)).length

  return {
    labels: ['Resolved', 'Carried Over', 'New Added'],
    data: [resolved, carried, newAdded],
  }
}

export function getAgingBucketData(records) {
  const buckets = {}
  AGING_BUCKETS.forEach(b => (buckets[b] = 0))

  records.forEach(r => {
    const aging = r.AGING || ''
    if (buckets.hasOwnProperty(aging)) {
      buckets[aging]++
    }
  })

  return {
    labels: AGING_BUCKETS,
    data: AGING_BUCKETS.map(b => buckets[b]),
  }
}

export function getSubstationData(records, topN) {
  const stations = {}
  records.forEach(r => {
    const station = r.SUBSTATION || 'Unknown'
    stations[station] = (stations[station] || 0) + 1
  })

  const sorted = Object.entries(stations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)

  return {
    labels: sorted.map(([k]) => k),
    data: sorted.map(([, v]) => v),
  }
}

export function getSubstationPerformance(oldRecords, newRecords) {
  const oldIds = new Set(oldRecords.map(record => String(record.COMPLAINT_NO || '')))
  const newIds = new Set(newRecords.map(record => String(record.COMPLAINT_NO || '')))
  const substations = new Set([
    ...oldRecords.map(record => record.SUBSTATION || 'Unknown'),
    ...newRecords.map(record => record.SUBSTATION || 'Unknown'),
  ])

  return Array.from(substations).map(substation => {
    const oldAtSubstation = oldRecords.filter(record => (record.SUBSTATION || 'Unknown') === substation)
    const newAtSubstation = newRecords.filter(record => (record.SUBSTATION || 'Unknown') === substation)
    const resolved = oldAtSubstation.filter(record => !newIds.has(String(record.COMPLAINT_NO || ''))).length
    const newAdded = newAtSubstation.filter(record => !oldIds.has(String(record.COMPLAINT_NO || ''))).length

    const previousComplaints = oldAtSubstation.length
    const pending = newAtSubstation.length
    const resolutionRate = previousComplaints === 0 ? 0 : resolved / previousComplaints
    const newComplaintRate = previousComplaints === 0 ? (newAdded > 0 ? 1 : 0) : newAdded / previousComplaints
    const pendingRate = previousComplaints === 0 ? (pending > 0 ? 1 : 0) : pending / previousComplaints
    const rankingScore = (resolutionRate * 0.5) + ((1 - Math.min(newComplaintRate, 1)) * 0.3) + ((1 - Math.min(pendingRate, 1)) * 0.2)

    return {
      substation,
      previousComplaints,
      pending,
      resolved,
      newAdded,
      rankingScore,
      netChange: newAtSubstation.length - oldAtSubstation.length,
    }
  })
}

export function getSourceData(records) {
  const sources = {}
  records.forEach(r => {
    const source = r.SOURCE || 'Unknown'
    sources[source] = (sources[source] || 0) + 1
  })

  return {
    labels: Object.keys(sources),
    data: Object.values(sources),
  }
}

export function getTrendData(snapshots, topN) {
  // Sort snapshots by date
  const sorted = [...snapshots].sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr))

  return {
    labels: sorted.map(s => s.dateStr),
    data: sorted.map(s => s.recordCount || 0),
  }
}
