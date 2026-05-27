'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores'),
  displayName: z.string().max(80, 'Display name too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
})

type FormData = z.infer<typeof schema>

export default function OnboardingPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormData) {
    const res = await fetch('/api/creator-profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: values.username,
        display_name: values.displayName || null,
        bio: values.bio || null,
        location: values.location || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError('username', { message: data.error ?? 'Something went wrong' })
      return
    }

    router.push('/creator/media-kit')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Set up your profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your creator identity so brands can find you.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                @
              </span>
              <input
                {...register('username')}
                placeholder="yourhandle"
                className="flex-1 px-3 py-2 rounded-r-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Display name
            </label>
            <input
              {...register('displayName')}
              placeholder="Your Name"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Tell brands what you do..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
            <input
              {...register('location')}
              placeholder="City, Country"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            {errors.location && (
              <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-foreground/90 text-background py-2.5 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Saving...' : 'Continue to Media Kit'}
          </button>
        </form>
      </div>
    </div>
  )
}
