'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CampaignEvent {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  status: string
}

interface ContentEvent {
  id: string
  due_date: string | null
  type: string
  status: string
  campaign_name: string | null
  influencer_name: string | null
}

interface Props {
  campaigns: CampaignEvent[]
  content: ContentEvent[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isSameDay(a: string, b: string) {
  return a.slice(0, 10) === b.slice(0, 10)
}

function isBetween(dateStr: string, start: string | null, end: string | null): boolean {
  if (!start && !end) return false
  const d = dateStr
  if (start && end) return d >= start.slice(0, 10) && d <= end.slice(0, 10)
  if (start) return isSameDay(d, start)
  if (end) return isSameDay(d, end)
  return false
}

export default function CalendarClient({ campaigns, content }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [popoverDay, setPopoverDay] = useState<string | null>(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toDateStr(today)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function getDayStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function getCampaignEvents(dayStr: string) {
    return campaigns.filter(c => isBetween(dayStr, c.start_date, c.end_date))
  }

  function getContentEvents(dayStr: string) {
    return content.filter(c => c.due_date && isSameDay(c.due_date, dayStr))
  }

  const popoverCampaigns = popoverDay ? getCampaignEvents(popoverDay) : []
  const popoverContent = popoverDay ? getContentEvents(popoverDay) : []
  const hasPopover = popoverDay && (popoverCampaigns.length > 0 || popoverContent.length > 0)

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground/60 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {cells.map((day, idx) => {
          if (day == null) {
            return <div key={`empty-${idx}`} className="bg-card min-h-[80px]" />
          }
          const dayStr = getDayStr(day)
          const isToday = dayStr === todayStr
          const campaignEvts = getCampaignEvents(dayStr)
          const contentEvts = getContentEvents(dayStr)
          const hasEvents = campaignEvts.length > 0 || contentEvts.length > 0
          const isPopoverOpen = popoverDay === dayStr

          return (
            <div
              key={dayStr}
              className={`bg-card min-h-[80px] p-1.5 relative cursor-pointer hover:bg-muted/50 transition-colors ${isPopoverOpen ? 'ring-1 ring-inset ring-brand/40' : ''}`}
              onClick={() => setPopoverDay(isPopoverOpen ? null : (hasEvents ? dayStr : null))}
            >
              <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1 ${
                isToday
                  ? 'bg-brand text-brand-foreground'
                  : 'text-foreground'
              }`}>
                {day}
              </div>

              <div className="space-y-0.5">
                {campaignEvts.slice(0, 2).map(c => (
                  <div
                    key={`camp-${c.id}`}
                    className="truncate text-[10px] px-1 py-0.5 rounded bg-brand/20 text-brand font-medium leading-tight"
                    title={c.name}
                  >
                    {c.name}
                  </div>
                ))}
                {contentEvts.slice(0, 2).map(c => (
                  <div
                    key={`cont-${c.id}`}
                    className="truncate text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium leading-tight"
                    title={`${c.type} due`}
                  >
                    {c.type}
                  </div>
                ))}
                {(campaignEvts.length + contentEvts.length) > 4 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{campaignEvts.length + contentEvts.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Popover / day detail */}
      {hasPopover && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm">
              {new Date(popoverDay! + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <button
              onClick={() => setPopoverDay(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          {popoverCampaigns.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Campaigns</p>
              <div className="space-y-1.5">
                {popoverCampaigns.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                    <span className="text-sm text-foreground font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {popoverContent.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Content due</p>
              <div className="space-y-1.5">
                {popoverContent.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-sm text-foreground font-medium capitalize">{c.type}</span>
                    {c.influencer_name && (
                      <span className="text-xs text-muted-foreground">by {c.influencer_name}</span>
                    )}
                    {c.campaign_name && (
                      <span className="text-xs text-muted-foreground ml-auto">#{c.campaign_name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 px-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded bg-brand/20 inline-block" />
          Campaign active
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/20 inline-block" />
          Content due
        </div>
      </div>
    </div>
  )
}
