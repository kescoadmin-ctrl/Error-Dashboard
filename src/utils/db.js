import * as XLSX from 'xlsx'
import { supabase } from '../supabase'

const SNAPSHOTS_TABLE = 'snapshots'
const AGING_BUCKETS = ['0-24hrs', '24 hrs to 3 Days', '3 to 7 Days', '7 to 15 Days', '15 to 30 Days', '30 to 90 Days', '90+ Days']

// Get all snapshots for current user
export async function getAllSnapshots(userId) {
  try {
    const { data, error } = await supabase
      .from(SNAPSHOTS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date_str', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching snapshots:', error)
    return []
  }
}

// Subscribe to realtime snapshot updates
export function onSnapshotsUpdate(userId, callback) {
  getAllSnapshots(userId).then(callback)

  const subscription = supabase
    .channel(`snapshots:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: SNAPSHOTS_TABLE, filter: `user_id=eq.${userId}` },
      () => getAllSnapshots(userId).then(callback),
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(subscription)
  }
}

// Get a single snapshot
export async function getSnapshot(userId, dateStr) {
  try {
    const { data, error } = await supabase
      .from(SNAPSHOTS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('date_str', dateStr)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  } catch (error) {
    console.error('Error fetching snapshot:', error)
    return null
  }
}

// Save/update snapshot metadata in database and records in storage
export async function saveSnapshot(userId, dateStr, metadata, records) {
  try {
    // Prepare records data for storage
    const recordsJson = JSON.stringify({ records, flagged: metadata.flagged || [] })
    const blob = new Blob([recordsJson], { type: 'application/json' })
    const fileName = `${userId}/snapshots/${dateStr}/records.json`

    // Upload records to storage
    const { error: storageError } = await supabase.storage
      .from('snapshots')
      .upload(fileName, blob, { upsert: true })

    if (storageError) throw storageError

    // Save metadata to database
    const { error: dbError } = await supabase
      .from(SNAPSHOTS_TABLE)
      .upsert({
        user_id: userId,
        date_str: dateStr,
        filename: metadata.filename,
        timestamp: metadata.timestamp,
        selected_columns: metadata.selectedColumns,
        has_source: metadata.hasSource,
        flagged: metadata.flagged || [],
        record_count: records.length,
        flag_count: metadata.flagged?.length || 0,
        updated_at: new Date().toISOString(),
      })

    if (dbError) throw dbError
  } catch (error) {
    console.error('Error saving snapshot:', error)
    throw error
  }
}

// Get full records from storage
export async function getSnapshotRecords(userId, dateStr) {
  try {
    const fileName = `${userId}/snapshots/${dateStr}/records.json`
    const { data, error } = await supabase.storage
      .from('snapshots')
      .download(fileName)

    if (error) throw error
    const text = await data.text()
    return JSON.parse(text)
  } catch (error) {
    console.error('Error fetching records:', error)
    return { records: [], flagged: [] }
  }
}

// Delete snapshot
export async function deleteSnapshot(userId, dateStr) {
  try {
    // Delete from database
    const { error: dbError } = await supabase
      .from(SNAPSHOTS_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('date_str', dateStr)

    if (dbError) throw dbError

    // Delete storage file
    const fileName = `${userId}/snapshots/${dateStr}/records.json`
    const { error: storageError } = await supabase.storage
      .from('snapshots')
      .remove([fileName])

    if (storageError) throw storageError
  } catch (error) {
    console.error('Error deleting snapshot:', error)
    throw error
  }
}

// Parse and validate uploaded file
export function parseUploadedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })

        const sheetName =
          workbook.SheetNames.find(n => n.toUpperCase() === 'RAW') ||
          workbook.SheetNames.reduce((a, b) =>
            workbook.Sheets[a]['!ref'] > workbook.Sheets[b]['!ref'] ? a : b
          )

        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
          defval: '',
        })

        if (!rawData.length) throw new Error('No data found in sheet.')

        const headers = Object.keys(rawData[0]).map(h => h.trim().toUpperCase())
        let flagged = []
        let records = []
        let seenIDs = new Set()
        let hasSource = headers.includes('SOURCE')

        if (!hasSource) {
          flagged.push({
            type: 'COL',
            id: '-',
            details: 'SOURCE column missing in file',
            row: '-',
          })
        }

        rawData.forEach((row, idx) => {
          let cleanRow = {}
          for (let k in row) cleanRow[k.trim().toUpperCase()] = row[k]

          const id = String(cleanRow.COMPLAINT_NO || '').trim()
          const vert = String(cleanRow.VERTICAL || '').trim()
          const aging = String(cleanRow.AGING || '').trim()

          if (!id || !vert || !aging) {
            flagged.push({
              type: 'MISS',
              id,
              details: 'Missing required field (ID, VERTICAL, or AGING)',
              row: JSON.stringify(cleanRow).substring(0, 50),
            })
            return
          }

          if (seenIDs.has(id)) {
            flagged.push({
              type: 'DUP',
              id,
              details: 'Duplicate Complaint No.',
              row: `Row ${idx + 2}`,
            })
            return
          }

          if (cleanRow.REGISTRATION_DATE) {
            let d = new Date(cleanRow.REGISTRATION_DATE)
            if (isNaN(d.getTime())) {
              flagged.push({
                type: 'FMT',
                id,
                details: 'Invalid Date Format',
                row: cleanRow.REGISTRATION_DATE,
              })
            }
          }

          seenIDs.add(id)
          records.push(cleanRow)
        })

        resolve({
          filename: file.name,
          records,
          flagged,
          headers,
          hasSource,
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.readAsArrayBuffer(file)
  })
}

// Calculate KPI values from records
export function calculateKPIs(oldRecords, newRecords, oldFlagged, newFlagged) {
  const oldSet = new Set(oldRecords.map(r => r.COMPLAINT_NO))
  const newSet = new Set(newRecords.map(r => r.COMPLAINT_NO))

  const resolved = oldSet.size - Array.from(oldSet).filter(id => newSet.has(id)).length
  const newAdded = newSet.size - Array.from(newSet).filter(id => oldSet.has(id)).length
  const carried = Array.from(oldSet).filter(id => newSet.has(id)).length

  return {
    oldPending: oldRecords.length,
    presentPending: newRecords.length,
    resolved,
    newAdded,
    carried,
    flagged: newFlagged.length,
  }
}

// Get diff between two datasets
export function getCompareDiff(oldRecords, newRecords) {
  const oldMap = new Map(oldRecords.map(r => [r.COMPLAINT_NO, r]))
  const newMap = new Map(newRecords.map(r => [r.COMPLAINT_NO, r]))

  const resolved = Array.from(oldMap.values()).filter(r => !newMap.has(r.COMPLAINT_NO))
  const newAdded = Array.from(newMap.values()).filter(r => !oldMap.has(r.COMPLAINT_NO))
  const carried = Array.from(newMap.values()).filter(r => oldMap.has(r.COMPLAINT_NO))

  return { resolved, newAdded, carried }
}

// Bucket complaints by aging
export function bucketByAging(records) {
  const buckets = {}
  AGING_BUCKETS.forEach(b => (buckets[b] = 0))

  records.forEach(r => {
    const aging = r.AGING || ''
    if (buckets.hasOwnProperty(aging)) {
      buckets[aging]++
    }
  })

  return buckets
}

// Group records by category
export function groupByCategory(records, category) {
  const groups = {}
  records.forEach(r => {
    const key = r[category] || 'Unknown'
    groups[key] = (groups[key] || 0) + 1
  })
  return groups
}

// Get top N groups
export function getTopN(groups, n) {
  return Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

// Export data to JSON
export async function exportDataToJSON(userId) {
  try {
    const snapshots = await getAllSnapshots(userId)
    const data = {
      exportDate: new Date().toISOString(),
      snapshots: [],
    }

    for (const snapshot of snapshots) {
      const records = await getSnapshotRecords(userId, snapshot.dateStr)
      data.snapshots.push({
        ...snapshot,
        ...records,
      })
    }

    return data
  } catch (error) {
    console.error('Error exporting data:', error)
    throw error
  }
}

// Import data from JSON
export async function importDataFromJSON(userId, jsonData) {
  try {
    const data = JSON.parse(jsonData)
    let imported = 0
    let skipped = 0

    for (const item of data.snapshots) {
      const existing = await getSnapshot(userId, item.dateStr)

      if (existing && !confirm(`Overwrite ${item.dateStr}?`)) {
        skipped++
        continue
      }

      const metadata = {
        filename: item.filename,
        timestamp: item.timestamp,
        selectedColumns: item.selectedColumns,
        hasSource: item.hasSource,
        flagged: item.flagged || [],
      }

      await saveSnapshot(userId, item.dateStr, metadata, item.records || [])
      imported++
    }

    return { imported, skipped }
  } catch (error) {
    console.error('Error importing data:', error)
    throw error
  }
}
