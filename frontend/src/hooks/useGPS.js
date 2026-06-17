import { useState, useEffect } from 'react'

export function useGPS() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [permissionState, setPermissionState] = useState('unknown') // 'unknown' | 'granted' | 'denied' | 'unavailable' | 'https-required'

  const isHTTPS = typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  const getLocation = () => {
    if (!navigator.geolocation) {
      setPermissionState('unavailable')
      setError('Geolocation not supported on this device')
      return
    }

    // On non-HTTPS non-localhost, Chrome blocks geolocation silently
    if (!isHTTPS) {
      setPermissionState('https-required')
      setError('GPS requires HTTPS or localhost. Using approximate zone.')
      // Provide a fallback location — center of Dehradun study area
      setLocation({ lat: 30.3165, lng: 78.0322, accuracy: 5000, isFallback: true })
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          isFallback: false
        })
        setPermissionState('granted')
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        if (err.code === 1) {
          setPermissionState('denied')
          setError('Location permission denied')
          // Still provide fallback
          setLocation({ lat: 30.3165, lng: 78.0322, accuracy: 5000, isFallback: true })
        } else if (err.code === 2) {
          setPermissionState('unavailable')
          setError('Position unavailable — using study area center')
          setLocation({ lat: 30.3165, lng: 78.0322, accuracy: 5000, isFallback: true })
        } else {
          setPermissionState('timeout')
          setError('GPS timed out — using study area center')
          setLocation({ lat: 30.3165, lng: 78.0322, accuracy: 5000, isFallback: true })
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }

  useEffect(() => { getLocation() }, [])

  return { location, error, loading, permissionState, refresh: getLocation, isHTTPS }
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
