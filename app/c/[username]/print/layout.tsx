// Minimal layout wrapper for the print page — strips the dark body styles from root layout.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
