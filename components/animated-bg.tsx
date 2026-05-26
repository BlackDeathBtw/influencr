export function BlobBg() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Saffron glow — top right */}
      <div className="animate-blob-1 absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full bg-brand/12 blur-[110px]" />
      {/* Cool violet glow — bottom left */}
      <div className="animate-blob-2 absolute -bottom-24 -left-16 w-[440px] h-[440px] rounded-full bg-[oklch(0.45_0.12_270)]/8 blur-[100px]" />
      {/* Warm center accent */}
      <div className="animate-blob-3 absolute top-[35%] left-[30%] w-[360px] h-[360px] rounded-full bg-brand/7 blur-[90px]" />
    </div>
  )
}
