'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users, BarChart3, CreditCard, LayoutDashboard,
  Settings, LogOut, Mail, FileText, Kanban, Store,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const primaryNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/influencers', label: 'Contacts', icon: Users },
  { href: '/campaigns', label: 'Campaigns', icon: BarChart3 },
  { href: '/payments', label: 'Payments', icon: CreditCard },
]

const growthNav = [
  { href: '/crm', label: 'Pipeline', icon: Kanban },
  { href: '/marketplace', label: 'Opportunities', icon: Store },
  { href: '/outreach', label: 'Outreach', icon: Mail },
  { href: '/contracts', label: 'Contracts', icon: FileText },
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

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
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
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {primaryNav.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
            Growth
          </p>
        </div>

        {growthNav.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-4">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-brand text-brand-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Settings size={15} />
          Settings
        </Link>
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
