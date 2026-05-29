import { createClient } from '@/lib/supabase/server'
import { getUGCAsset } from '@/lib/ugc-data'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import UGCEditForm from '@/components/ugc-edit-form'

const RIGHTS_BADGE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-green-500/15 text-green-400',
  rejected: 'bg-red-500/15 text-red-400',
  licensed: 'bg-brand/15 text-brand',
}

export default async function UGCAssetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const asset = await getUGCAsset(user!.id, id)
  if (!asset) notFound()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const filePublicUrl = asset.storage_path
    ? `${supabaseUrl}/storage/v1/object/public/ugc-assets/${asset.storage_path}`
    : null

  const isImage = asset.asset_type === 'image'
  const isVideo = asset.asset_type === 'video'
  const previewUrl = isImage ? (filePublicUrl ?? asset.thumbnail_url) : null
  const videoUrl = isVideo ? filePublicUrl : null

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/ugc"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={14} /> Asset Library
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={asset.title}
                className="w-full object-contain max-h-80"
              />
            ) : videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full max-h-80"
              />
            ) : asset.thumbnail_url ? (
              <img
                src={asset.thumbnail_url}
                alt={asset.title}
                className="w-full object-contain max-h-80"
              />
            ) : (
              <div className="h-64 bg-muted flex items-center justify-center">
                <p className="text-muted-foreground text-sm capitalize">{asset.asset_type}</p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-foreground">{asset.title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${RIGHTS_BADGE[asset.rights_status] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
                {asset.rights_status}
              </span>
            </div>

            {asset.platform && (
              <p className="text-sm text-muted-foreground capitalize">{asset.platform}</p>
            )}

            {asset.influencer && (
              <p className="text-sm text-muted-foreground">Creator: {asset.influencer.name}</p>
            )}

            {asset.campaign && (
              <p className="text-sm text-muted-foreground">Campaign: {asset.campaign.name}</p>
            )}

            {asset.tags && asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {asset.external_url && (
              <a
                href={asset.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
              >
                <ExternalLink size={13} /> Open link
              </a>
            )}

            {filePublicUrl && (
              <a
                href={filePublicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
              >
                <ExternalLink size={13} /> Open file
              </a>
            )}

            {asset.notes && (
              <p className="text-sm text-muted-foreground">{asset.notes}</p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Edit asset</h3>
          <UGCEditForm asset={asset} />
        </div>
      </div>
    </div>
  )
}
