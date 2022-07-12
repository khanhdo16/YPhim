import { useState, useEffect } from 'react'

export const useOnWindowResize = () => {
  const [resized, setResized] = useState({width: window.innerWidth, height: window.innerHeight})

  const didResized = () => {
    setResized({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }

  useEffect(() => {
    window.addEventListener('resize', didResized);

    return () => {
      window.removeEventListener('resize', didResized);
    }
  }, [])

  return resized
} 