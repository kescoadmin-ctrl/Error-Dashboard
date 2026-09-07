import React from 'react'

export default class AppErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application render error:', error, errorInfo)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="error-boundary">
        <h1 className="serif">Something went wrong</h1>
        <p>The dashboard could not render this screen.</p>
        <button className="primary" onClick={() => window.location.reload()}>
          Reload Dashboard
        </button>
      </div>
    )
  }
}
