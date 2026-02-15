'use client'

import { useEffect } from 'react'
import { registerComponents } from '@/lib/registry/register-components'

let isRegistered = false

export function ComponentRegistryInitializer() {
  useEffect(() => {
    if (!isRegistered) {
      registerComponents()
      isRegistered = true
    }
  }, [])

  return null
}
