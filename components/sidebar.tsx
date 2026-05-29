'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users, BarChart3, CreditCard, LayoutDashboard,
  Settings, LogOut, Mail, FileText, Kanban, Store,
  ClipboardList, ClipboardCheck, Search, CalendarDays, Calculator,
  Menu, X, Link2, Image, SplitSquareHorizontal,
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
  { href: '/brief-builder', label: 'Brief Builder', icon: ClipboardList },
  { href: '/research', label: 'Research', icon: Search },
  { href: '/content-reviews', label: 'Reviews', icon: ClipboardCheck },
  { href: '/ugc', label: 'Asset Library', icon: Image },
  { href: '/utm-links', label: 'UTM Links', icon: Link2 },
]

function NavItem({ href, label, icon: Icon, active, onClick }: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  function close() {
    setMobileOpen(false)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <span className="font-display font-bold text-lg tracking-tight text-foreground">influencr</span>
        <button
          onClick={close}
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {primaryNav.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} onClick={close} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
            Growth
          </p>
        </div>

        {growthNav.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} onClick={close} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
            Tools
          </p>
        </div>

        <NavItem href="/campaigns/calendar" label="Calendar" icon={CalendarDays} active={isActive('/campaigns/calendar')} onClick={close} />
        <NavItem href="/roi-estimator" label="ROI Estimator" icon={Calculator} active={isActive('/roi-estimator')} onClick={close} />
        <NavItem href="/compare" label="Compare Creators" icon={SplitSquareHorizontal} active={isActive('/compare')} onClick={close} />
      </nav>

      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-4">
        <Link
          href="/settings"
          onClick={close}
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
    </>
  )

  return (
    <>
      {/* Mobile hamburger — only shown when sidebar is closed */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <aside className={[
        'bg-card border-r border-border flex flex-col h-full',
        'fixed inset-y-0 left-0 z-50 w-56 transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:relative md:translate-x-0 md:z-auto md:shrink-0',
      ].join(' ')}>
        {sidebarContent}
      </aside>
    </>
  )
}
