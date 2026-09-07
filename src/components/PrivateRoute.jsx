import React from 'react'
import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ user, userRole, requiredRole, children }) {
  if (!user) {
    return <Navigate to="/" replace />
  }

  if (userRole !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}
