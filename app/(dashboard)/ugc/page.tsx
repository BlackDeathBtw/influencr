import { createClient } from '@/lib/supabase/server'
import { getUGCAssets } from '@/lib/ugc-data'
import Link from 'next/link'
import { Plus, Image, Video, Link2, FileText, Upload } from 'lucide-react'
import type { UGCFilter } from '@/types/ugc'

const ASSET_TYPE_FILTERS = [
  { label: 'All types', value: '' },
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
  { label: 'Link', value: 'link' },
  { label: 'Document', value: 'document' },
]

const RIGHTS_FILTERS = [
  { label: 'All rights', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Licensed', value: 'licensed' },
  { label: 'Rejected', value: 'rejected' },
]

const RIGHTS_BADGE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-green-500/15 text-green-400',
  rejected: 'bg-red-500/15 text-red-400',
  licensed: 'bg-brand/15 text-brand',
}

function AssetTypeIcon({ type }: { type: string }) {
  if (type === 'image') return <Image size={28} className="text-muted-foreground" />
  if (type === 'video') return <Video size={28} className="text-muted-foreground" />
  if (type === 'link') return <Link2 size={28} className="text-muted-foreground" />
  return <FileText size={28} className="text-muted-foreground" />
}

export default async function UGCPage({
  searchParams,
}: {
  searchParams: Promise<{ asset_type?: string; rights_status?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const filter: UGCFilter = {}
  if (sp.asset_type) filter.asset_type = sp.asset_type
  if (sp.rights_status) filter.rights_status = sp.rights_status

  const assets = await getUGCAssets(user!.id, filter)

  function filterUrl(key: string, value: string) {
    const params = new URLSearchParams()
    if (key !== 'asset_type' && sp.asset_type) params.set('asset_type', sp.asset_type)
    if (key !== 'rights_status' && sp.rights_status) params.set('rights_status', sp.rights_status)
    if (value) params.set(key, value)
    const qs = params.toString()
    return `/ugc${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asset Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/ugc/new"
          className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
        >
          <Plus size={15} /> Upload asset
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {ASSET_TYPE_FILTERS.map((f) => {
          const active = (sp.asset_type ?? '') === f.value
          return (
            <Link
              key={f.value}
              href={filterUrl('asset_type', f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {RIGHTS_FILTERS.map((f) => {
          const active = (sp.rights_status ?? '') === f.value
          return (
            <Link
              key={f.value}
              href={filterUrl('rights_status', f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Upload size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-foreground font-medium">No assets yet</p>
            <p className="text-muted-foreground text-sm mt-1">Upload images, videos, or links to build your UGC library</p>
          </div>
          <Link
            href="/ugc/new"
            className="flex items-center gap-2 bg-foreground/90 text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground transition-colors"
          >
            <Plus size={15} /> Upload your first asset
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {assets.map((asset) => {
            const publicUrl = asset.storage_path
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ugc-assets/${asset.storage_path}`
              : null
            const preview = asset.thumbnail_url ?? (asset.asset_type === 'image' ? publicUrl : null)

            return (
              <Link
                key={asset.id}
                href={`/ugc/${asset.id}`}
                className="block rounded-xl bg-card border border-border overflow-hidden hover:border-zinc-600 transition-colors break-inside-avoid mb-4"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={asset.title}
                    className="object-cover h-40 w-full"
                  />
                ) : (
                  <div className="h-40 w-full bg-muted flex items-center justify-center">
                    <AssetTypeIcon type={asset.asset_type} />
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{asset.title}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    {asset.platform && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 capitalize">
                        {asset.platform}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${RIGHTS_BADGE[asset.rights_status] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
                      {asset.rights_status}
                    </span>
                  </div>

                  {asset.tags && asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-500">
                          {tag}
                        </span>
                      ))}
                      {asset.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{asset.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {asset.influencer && (
                    <p className="text-xs text-muted-foreground">{asset.influencer.name}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
