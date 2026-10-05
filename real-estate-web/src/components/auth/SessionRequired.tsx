'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, KeyRound, Pause, Play } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { safeRedirectPath } from '@/lib/redirect'
import styles from './session-required.module.css'

export function SessionRequired({ title, description }: { title: string; description: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthContext()
  const [seconds, setSeconds] = useState(5)
  const [paused, setPaused] = useState(false)
  const [loginUrl, setLoginUrl] = useState(`/login?next=${encodeURIComponent(pathname)}`)

  useEffect(() => {
    const destination = safeRedirectPath(pathname + window.location.search + window.location.hash)
    setLoginUrl(`/login?next=${encodeURIComponent(destination)}`)
  }, [pathname])

  useEffect(() => {
    if (isLoading || isAuthenticated || paused) return
    setSeconds(5)
    const deadline = Date.now() + 5000
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSeconds(remaining)
      if (remaining === 0) {
        clearInterval(timer)
        router.replace(loginUrl)
      }
    }, 250)
    return () => clearInterval(timer)
  }, [isLoading, isAuthenticated, paused, loginUrl, router])

  return (
    <section className={styles.screen} aria-labelledby="session-required-title">
      <div className={styles.background} aria-hidden="true">
        <div className={styles.orbit} />
        <div className={styles.orbitSmall} />
        <div className={styles.tile} />
        <div className={styles.dot} />
      </div>
      <div className={styles.content}>
        <div className={styles.symbol}>
          <KeyRound size={25} strokeWidth={1.5} />
        </div>
        <p className={styles.eyebrow}>Tu búsqueda continúa</p>
        <h1 id="session-required-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.countdown}>
          <span className={styles.number} aria-hidden="true">
            {seconds}
            <small>s</small>
          </span>
          <p role="status" aria-live="polite" aria-atomic="true">
            {paused ? 'Redirección pausada.' : `Te llevaremos al acceso en ${seconds} segundos.`}
            <span>Después de ingresar volverás aquí.</span>
          </p>
        </div>
        <Link href={loginUrl} className={styles.login}>
          Iniciar sesión <ArrowRight size={18} />
        </Link>
        <button type="button" className={styles.pause} onClick={() => setPaused((value) => !value)}>
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? 'Reanudar redirección' : 'Pausar redirección'}
        </button>
      </div>
    </section>
  )
}
