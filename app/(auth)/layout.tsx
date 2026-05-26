import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <nav className="px-6 py-4 border-b border-zinc-200 bg-white">
        <Link href="/" className="font-bold text-xl tracking-tight">
          influencr
        </Link>
      </nav>
      <div className="flex flex-1 items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
