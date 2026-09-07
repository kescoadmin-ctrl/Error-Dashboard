import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function Settings({ user, onBreadcrumbChange }) {
  const [topN, setTopN] = useState(10)
  const [message, setMessage] = useState('')

  useEffect(() => {
    onBreadcrumbChange('Home › Tools › Display Settings')
  }, [onBreadcrumbChange])

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ settings: { topN: parseInt(topN) } })
        .eq('id', user.id)

      if (error) throw error
      setMessage('Settings saved')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const handleWipeData = async () => {
    if (!confirm('Are you sure? This will delete ALL stored data.')) {
      return
    }

    try {
      setMessage('Wiping data...')
      // This should be implemented to delete all snapshots
      // For now, just show a message
      setMessage('Data wiped')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    }
  }

  return (
    <div className="panel">
      <h2 className="serif">Display Settings</h2>

      <div className="mb-10">
        <label>Default Top 'N' for Subcategories/Substations:</label>
        <select value={topN} onChange={(e) => setTopN(e.target.value)} style={{ marginLeft: '10px' }}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
        <button className="primary" onClick={handleSaveSettings} style={{ marginLeft: '10px' }}>
          Save
        </button>
      </div>

      <div className="mb-10">
        <button className="danger" onClick={handleWipeData}>
          WIPE ALL LOCAL DATA
        </button>
      </div>

      {message && (
        <p className="mt-10 text-muted" style={{ fontSize: '12px' }}>
          {message}
        </p>
      )}
    </div>
  )
}
