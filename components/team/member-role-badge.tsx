'use client'

import { Badge } from '@/components/ui/badge'
import { Crown, Shield, User, Eye } from 'lucide-react'
import { MemberRole } from '@prisma/client'
import { cn } from '@/lib/utils'

interface MemberRoleBadgeProps {
  role: MemberRole
  className?: string
  showIcon?: boolean
}

const roleConfig = {
  OWNER: {
    icon: Crown,
    label: 'Owner',
    className: 'bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20',
  },
  ADMIN: {
    icon: Shield,
    label: 'Admin',
    className: 'bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20',
  },
  MEMBER: {
    icon: User,
    label: 'Member',
    className: 'bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20',
  },
  VIEWER: {
    icon: Eye,
    label: 'Viewer',
    className: 'bg-gray-500/10 text-gray-600 border-gray-200 hover:bg-gray-500/20',
  },
}

export function MemberRoleBadge({ role, className, showIcon = true }: MemberRoleBadgeProps) {
  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <Badge className={cn(config.className, 'transition-colors', className)}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  )
}