'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  brandEmail: z.string().email('Please enter a valid email'),
  description: z.string().min(1, 'Description is required'),
  amountDollars: z
    .string()
    .min(1, 'Amount is required')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Amount must be a positive number'),
  dueDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewInvoicePage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormData) {
    const res = await fetch('/api/creator-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_name: values.brandName,
        brand_email: values.brandEmail,
        description: values.description,
        amount_dollars: parseFloat(values.amountDollars),
        due_date: values.dueDate || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError('root', { message: data.error ?? 'Something went wrong' })
      return
    }

    router.push('/creator/invoices')
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link
          href="/creator/invoices"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to invoices
        </Link>
        <h1 className="font-display text-2xl font-bold text-foreground">New invoice</h1>
        <p className="text-sm text-muted-foreground mt-1">Send a payment request to a brand</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errors.root && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Brand name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('brandName')}
              placeholder="Acme Co."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            {errors.brandName && (
              <p className="mt-1 text-xs text-red-500">{errors.brandName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Brand email <span className="text-red-500">*</span>
            </label>
            <input
              {...register('brandEmail')}
              type="email"
              placeholder="billing@brand.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            {errors.brandEmail && (
              <p className="mt-1 text-xs text-red-500">{errors.brandEmail.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Instagram post + story for Spring campaign"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Amount (USD) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                $
              </span>
              <input
                {...register('amountDollars')}
                type="number"
                step="0.01"
                min="0"
                placeholder="500.00"
                className="flex-1 px-3 py-2 rounded-r-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            {errors.amountDollars && (
              <p className="mt-1 text-xs text-red-500">{errors.amountDollars.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Due date</label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            {errors.dueDate && (
              <p className="mt-1 text-xs text-red-500">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/creator/invoices"
              className="flex-1 text-center px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-foreground/90 text-background py-2 rounded-lg text-sm font-semibold hover:bg-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
