'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Receipt, LogOut, Kanban, Calculator, Store, TrendingUp, CalendarDays, Link2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/creator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/creator/media-kit', label: 'Media Kit', icon: FileText },
  { href: '/creator/links', label: 'My Links', icon: Link2 },
  { href: '/creator/invoices', label: 'Invoices', icon: Receipt },
  { href: '/creator/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/creator/earnings', label: 'Earnings', icon: TrendingUp },
  { href: '/creator/expenses', label: 'Expenses', icon: Receipt },
  { href: '/creator/captions', label: 'AI Captions', icon: Sparkles },
  { href: '/creator/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/creator/rate-calculator', label: 'Rate Calc', icon: Calculator },
]

function NavItem({ href, label, icon: Icon, active }: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-brand text-brand-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon size={15} />
      {label}
    </Link>
  )
}

export default function CreatorSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 bg-card border-r border-border flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <span className="font-display font-bold text-lg tracking-tight text-foreground">influencr</span>
        <p className="text-[10px] text-muted-foreground mt-0.5">Creator Portal</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-4">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
        <p className="px-3 pt-2 text-xs text-muted-foreground/50 truncate">{userEmail}</p>
      </div>
    </aside>
  )
}
