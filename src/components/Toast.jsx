import React, { useEffect } from 'react'

export function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      {message}
    </div>
  )
}
