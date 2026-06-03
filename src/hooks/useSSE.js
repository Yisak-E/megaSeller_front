import { useState, useEffect, useRef } from 'react'

export function useSSE(endpoint, eventName = 'message') {
  const [data, setData] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const esRef = useRef(null)

  useEffect(() => {
    if (!endpoint) return

    const stored = localStorage.getItem('megaseller_auth')
    if (!stored) return
    const { token } = JSON.parse(stored)

    // SSE doesn't support headers natively; pass token as query param
    const url = `${endpoint}?token=${token}`
    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener(eventName, (e) => {
      try {
        setData(JSON.parse(e.data))
        setConnected(true)
        setError(null)
      } catch (err) {
        setError('Parse error')
      }
    })

    // Fallback for unnamed events
    es.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data))
        setConnected(true)
      } catch {}
    }

    es.onerror = () => {
      setError('Connection lost, retrying...')
      setConnected(false)
    }

    es.onopen = () => {
      setConnected(true)
      setError(null)
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [endpoint, eventName])

  const disconnect = () => {
    if (esRef.current) {
      esRef.current.close()
      setConnected(false)
    }
  }

  return { data, connected, error, disconnect }
}
