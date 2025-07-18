'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  MoreVertical,
  Shield,
  User,
  Eye,
  Crown,
  Clock,
  Mail,
  UserX,
} from 'lucide-react'
import { format } from 'date-fns'
import { MemberRole } from '@prisma/client'

interface TeamMember {
  id: string
  user: {
    id: string
    name: string | null
    username: string
    email: string
    avatar: string | null
  }
  role: MemberRole
  joinedAt: Date
  lastSeen?: Date
}

interface TeamMembersListProps {
  projectId: string
  members?: TeamMember[]
  currentUserId: string
  currentUserRole: MemberRole
  loading?: boolean
  onRoleChange?: (userId: string, role: MemberRole) => void
  onRemoveMember?: (userId: string) => void
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
}

const roleColors = {
  OWNER: 'bg-purple-500/10 text-purple-600 border-purple-200',
  ADMIN: 'bg-blue-500/10 text-blue-600 border-blue-200',
  MEMBER: 'bg-green-500/10 text-green-600 border-green-200',
  VIEWER: 'bg-gray-500/10 text-gray-600 border-gray-200',
}

export function TeamMembersList({
  projectId,
  members = [],
  currentUserId,
  currentUserRole,
  loading = false,
  onRoleChange,
  onRemoveMember,
}: TeamMembersListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'ALL'>('ALL')

  // Filter members based on search and role
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter

    return matchesSearch && matchesRole
  })

  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as MemberRole | 'ALL')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery || roleFilter !== 'ALL'
            ? 'No members found matching your criteria.'
            : 'No members in this project yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => {
            const RoleIcon = roleIcons[member.role]
            const isCurrentUser = member.user.id === currentUserId
            const canEditMember = canManageMembers && !isCurrentUser && member.role !== 'OWNER'

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.user.avatar || ''} alt={member.user.name || member.user.username} />
                    <AvatarFallback>
                      {member.user.name?.[0] || member.user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {member.user.name || member.user.username}
                      </h4>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                      </span>
                      {member.lastSeen && (
                        <span>
                          Last seen {format(new Date(member.lastSeen), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={`${roleColors[member.role]} flex items-center gap-1`}>
                    <RoleIcon className="h-3 w-3" />
                    {member.role.toLowerCase()}
                  </Badge>

                  {canEditMember && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onRoleChange?.(member.user.id, 'ADMIN')}
                          disabled={member.role === 'ADMIN'}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRoleChange?.(member.user.id, 'MEMBER')}
                          disabled={member.role === 'MEMBER'}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRoleChange?.(member.user.id, 'VIEWER')}
                          disabled={member.role === 'VIEWER'}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onRemoveMember?.(member.user.id)}
                          className="text-red-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Remove from project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}