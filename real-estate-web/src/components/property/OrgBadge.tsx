'use client'

import { useEffect, useState } from 'react'
import { organizationService, OrgInfo } from '@/services/organizationService'
import { cn } from '@/lib/utils'

/** Small org branding chip for property cards (logo + name). */
export function OrgBadge({
  organizationId,
  className,
}: {
  organizationId: string
  className?: string
}) {
  const [org, setOrg] = useState<OrgInfo | null>(null)

  useEffect(() => {
    let active = true
    organizationService.getById(organizationId).then((o) => {
      if (active) setOrg(o)
    })
    return () => {
      active = false
    }
  }, [organizationId])

  if (!org) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-black/45 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-white',
        className
      )}
    >
      {org.logo_url ? (
        <img src={org.logo_url} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
      ) : (
        <span className="h-3 w-3 rounded-full bg-white/40" />
      )}
      <span className="max-w-[90px] truncate">{org.name}</span>
    </span>
  )
}
