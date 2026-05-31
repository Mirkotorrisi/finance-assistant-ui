'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { StatementUpload } from '@/components/finance/StatementUpload'
import { cn } from '@/lib/utils'
import { TrendingUp, MessageSquare, LayoutDashboard } from 'lucide-react'

const NAV_LINKS = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/90 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/chat" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:block">
            Finance AI
          </span>
        </Link>

        <div className="h-5 w-px bg-border/70 mx-1" />

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Upload — pushed to the right */}
        <div className="ml-auto">
          <StatementUpload />
        </div>
      </div>
    </header>
  )
}
