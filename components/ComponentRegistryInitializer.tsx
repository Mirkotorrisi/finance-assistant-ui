'use client'

import { useRef, useEffect } from 'react'
import { registerComponents } from '@/lib/registry/register-components'

export function ComponentRegistryInitializer() {
  const isRegisteredRef = useRef(false)

  useEffect(() => {
    if (!isRegisteredRef.current) {
      registerComponents()
      isRegisteredRef.current = true
    }
  }, [])

  return null
}
