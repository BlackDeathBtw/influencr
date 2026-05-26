import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      <nav className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="font-display font-bold text-xl tracking-tight text-white">
          influencr
        </Link>
      </nav>
      <div className="flex flex-1 items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
