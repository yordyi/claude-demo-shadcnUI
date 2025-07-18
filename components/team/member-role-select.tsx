'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MemberRole } from '@prisma/client'
import { MemberRoleBadge } from './member-role-badge'
import { Shield, User, Eye } from 'lucide-react'

interface MemberRoleSelectProps {
  value: MemberRole
  onChange: (role: MemberRole) => void
  disabled?: boolean
  excludeOwner?: boolean
}

const roles = [
  {
    value: 'ADMIN' as const,
    label: 'Admin',
    description: 'Can manage project settings and members',
    icon: Shield,
  },
  {
    value: 'MEMBER' as const,
    label: 'Member',
    description: 'Can create and edit tasks',
    icon: User,
  },
  {
    value: 'VIEWER' as const,
    label: 'Viewer',
    description: 'Can only view project content',
    icon: Eye,
  },
]

export function MemberRoleSelect({
  value,
  onChange,
  disabled = false,
  excludeOwner = true,
}: MemberRoleSelectProps) {
  const availableRoles = excludeOwner ? roles : roles

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          <MemberRoleBadge role={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => {
          const Icon = role.icon
          return (
            <SelectItem key={role.value} value={role.value}>
              <div className="flex items-start gap-3">
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{role.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {role.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}