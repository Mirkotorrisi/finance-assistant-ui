'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { StatementUpload } from '@/components/finance/StatementUpload'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/chat', label: 'Chat' },
  { href: '/dashboard', label: 'Dashboard' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        {/* Logo */}
        <Link href="/chat" className="flex items-center gap-2 font-semibold">
          Finance Assistant
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                pathname === href
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
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
