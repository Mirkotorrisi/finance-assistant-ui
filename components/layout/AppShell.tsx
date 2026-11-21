'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Briefcase,
  Building2,
  ClipboardCheck,
  Compass,
  Landmark,
  LayoutDashboard,
  ListTree,
  MessageSquare,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import { StatementUpload } from '@/components/finance/StatementUpload'
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BrandMark } from '@/components/layout/BrandMark'
import { cn } from '@/lib/utils'
import { useTranslation, type Locale } from '@/lib/i18n'
import { reviewService } from '@/lib/services/review.service'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}
interface NavGroup {
  label: string
  items: NavItem[]
}

function usePendingReviews() {
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
  return pending
}

function CountBadge({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      className={cn(
        'num ml-auto rounded-full px-1.5 text-[10px] font-semibold leading-4',
        active ? 'bg-primary text-primary-foreground' : 'bg-foreground/10 text-foreground',
      )}
    >
      {n > 99 ? '99+' : n}
    </span>
  )
}

function Sidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname()
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <Link href="/chat" className="flex h-16 items-center gap-2.5 px-5">
        <BrandMark />
        <span className="text-[15px] font-semibold tracking-tight text-foreground">Finance AI</span>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6 pt-2" aria-label="Main">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="eyebrow px-2 pb-2">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors',
                        'before:absolute before:-left-3 before:top-2 before:h-5 before:w-0.5 before:rounded-r before:bg-primary before:transition-transform before:duration-200 before:[transition-timing-function:var(--ease-spring)]',
                        active
                          ? 'bg-sidebar-accent font-medium text-foreground before:scale-y-100'
                          : 'text-sidebar-foreground/85 before:scale-y-0 hover:bg-sidebar-accent/70 hover:text-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                        )}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{label}</span>
                      {badge ? <CountBadge n={badge} active={active} /> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

function MobileNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname()
  const items = groups.flatMap((g) => g.items)
  return (
    <nav
      aria-label="Main"
      className="flex gap-1 overflow-x-auto border-b border-border/70 bg-background px-3 py-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
    >
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/70 bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {label}
            {badge ? (
              <span className={cn('num rounded-full px-1.5 text-[10px] font-semibold leading-4', active ? 'bg-primary-foreground/20' : 'bg-foreground/10')}>
                {badge > 99 ? '99+' : badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useTranslation()
  const pending = usePendingReviews()
  const otherLocale: Locale = locale === 'it' ? 'en' : 'it'

  const groups: NavGroup[] = [
    {
      label: t('nav.groups.overview'),
      items: [
        { href: '/chat', label: t('nav.chat'), icon: MessageSquare },
        { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/net-worth', label: t('nav.netWorth'), icon: Landmark },
        { href: '/investments', label: t('nav.investments'), icon: Briefcase },
      ],
    },
    {
      label: t('nav.groups.manage'),
      items: [
        { href: '/review', label: t('nav.review'), icon: ClipboardCheck, badge: pending },
        { href: '/banking', label: t('nav.banking'), icon: Building2 },
        { href: '/blueprint', label: t('nav.blueprint'), icon: ListTree },
        { href: '/amazon', label: t('nav.amazon'), icon: ShoppingBag },
      ],
    },
    {
      label: t('nav.groups.advice'),
      items: [{ href: '/advisor', label: t('nav.advisor'), icon: Compass }],
    },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar groups={groups} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
            <Link href="/chat" className="flex items-center gap-2.5 lg:hidden">
              <BrandMark />
              <span className="hidden text-[15px] font-semibold tracking-tight sm:block">Finance AI</span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <WorkspaceSwitcher />
              <button
                type="button"
                onClick={() => setLocale(otherLocale)}
                className="press h-8 rounded-md border border-border/70 bg-card px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                aria-label={`Switch to ${otherLocale.toUpperCase()}`}
              >
                {otherLocale.toUpperCase()}
              </button>
              <ThemeToggle />
              <StatementUpload />
            </div>
          </div>
          <MobileNav groups={groups} />
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
