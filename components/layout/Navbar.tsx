'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { StatementUpload } from '@/components/finance/StatementUpload'
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher'
import { cn } from '@/lib/utils'
import { TrendingUp, MessageSquare, LayoutDashboard, ShoppingBag, ListTree, ClipboardCheck, Briefcase } from 'lucide-react'
import { useTranslation, type Locale } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import { reviewService } from '@/lib/services/review.service'

export function Navbar() {
  const pathname = usePathname()
  const { t, locale, setLocale } = useTranslation()
  const [pending, setPending] = useState(0)

  // how many transactions still wait for confirmation, kept fresh after imports, reviews and project switches
  useEffect(() => {
    let cancelled = false
    const refresh = () =>
      reviewService
        .queue(1) // the queue counts every unconfirmed transaction, income included, like the Review page
        .then((q) => !cancelled && setPending(q.unreviewed_transactions))
        .catch(() => undefined)
    void refresh()
    const events = ['review-updated', 'transactions-updated', 'workspace-changed', 'blueprint-saved']
    events.forEach((e) => window.addEventListener(e, refresh))
    return () => {
      cancelled = true
      events.forEach((e) => window.removeEventListener(e, refresh))
    }
  }, [])

  const NAV_LINKS = [
    { href: '/chat', label: t('nav.chat'), icon: MessageSquare },
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/review', label: t('nav.review'), icon: ClipboardCheck, badge: pending },
    { href: '/investments', label: t('nav.investments'), icon: Briefcase },
    { href: '/blueprint', label: t('nav.blueprint'), icon: ListTree },
    { href: '/amazon', label: t('nav.amazon'), icon: ShoppingBag },
  ]

  const otherLocale: Locale = locale === 'it' ? 'en' : 'it'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-4">
        {/* Logo */}
        <Link href="/chat" className="hidden sm:flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:block">
            Finance AI
          </span>
        </Link>

        <div className="hidden sm:block h-5 w-px bg-border/70 mx-1" />

        {/* Nav links */}
        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] sm:flex-none sm:gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150 2xl:px-3 2xl:py-1.5',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 2xl:h-3.5 2xl:w-3.5" />
              <span className={pathname === href ? 'hidden sm:inline' : 'hidden 2xl:inline'}>{label}</span>
              {badge ? (
                <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        {/* Right side: lang switcher + upload */}
        <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto sm:gap-2">
          <WorkspaceSwitcher />
          <button
            onClick={() => setLocale(otherLocale)}
            className="rounded-lg border border-border/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={`Switch to ${otherLocale.toUpperCase()}`}
          >
            {otherLocale.toUpperCase()}
          </button>
          <StatementUpload />
        </div>
      </div>
    </header>
  )
}
