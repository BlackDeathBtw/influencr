'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, BarChart3, CreditCard, LayoutDashboard, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/influencers', label: 'Influencers', icon: Users },
  { href: '/campaigns', label: 'Campaigns', icon: BarChart3 },
  { href: '/payments', label: 'Payments', icon: CreditCard },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-zinc-100">
        <span className="font-bold text-lg tracking-tight">influencr</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 space-y-0.5 border-t border-zinc-100 pt-4">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
        <p className="px-3 pt-2 text-xs text-zinc-400 truncate">{userEmail}</p>
      </div>
    </aside>
  )
}
