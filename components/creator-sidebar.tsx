'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, Receipt, LogOut, Building2,
  Briefcase, CheckSquare, CreditCard, ScrollText, Shield,
  Wallet, Image, Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAIN_NAV = [
  { href: '/creator/dashboard',   label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/creator/clients',     label: 'Clients',       icon: Building2 },
  { href: '/creator/deals',       label: 'Deals',         icon: Briefcase },
  { href: '/creator/deliverables',label: 'Deliverables',  icon: CheckSquare },
]

const FINANCE_NAV = [
  { href: '/creator/invoices',    label: 'Invoices',      icon: FileText },
  { href: '/creator/expenses',    label: 'Expenses',      icon: Receipt },
  { href: '/creator/payments',    label: 'Payments',      icon: Wallet },
]

const LEGAL_NAV = [
  { href: '/creator/contracts',   label: 'Contracts',     icon: ScrollText },
  { href: '/creator/usage-rights',label: 'Usage Rights',  icon: Shield },
  { href: '/creator/receipts',    label: 'Receipts',      icon: Image },
]

function NavItem({ href, label, icon: Icon, active }: {
  href: string; label: string; icon: React.ElementType; active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon size={15} />
      {label}
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
      {label}
    </p>
  )
}

export default function CreatorSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
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

      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {MAIN_NAV.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
        ))}
        <SectionLabel label="Finance" />
        {FINANCE_NAV.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
        ))}
        <SectionLabel label="Legal" />
        {LEGAL_NAV.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
        ))}
        <SectionLabel label="Profile" />
        <NavItem href="/creator/media-kit" label="Media Kit" icon={Settings} active={isActive('/creator/media-kit')} />
      </nav>

      <div className="px-3 pb-4 border-t border-border pt-4">
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
