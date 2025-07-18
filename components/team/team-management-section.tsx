'use client'

import { useState } from 'react'
import { TeamMembersList } from './team-members-list'
import { InviteMemberDialog } from './invite-member-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Settings } from 'lucide-react'
import { MemberRole } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'

interface TeamManagementSectionProps {
  projectId: string
  projectName: string
  currentUserId: string
  currentUserRole: MemberRole
}

// Mock data for demonstration
const mockMembers = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      avatar: null,
    },
    role: 'OWNER' as MemberRole,
    joinedAt: new Date('2024-01-01'),
    lastSeen: new Date('2024-01-15'),
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Jane Smith',
      username: 'janesmith',
      email: 'jane@example.com',
      avatar: null,
    },
    role: 'ADMIN' as MemberRole,
    joinedAt: new Date('2024-01-05'),
    lastSeen: new Date('2024-01-14'),
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Bob Wilson',
      username: 'bobwilson',
      email: 'bob@example.com',
      avatar: null,
    },
    role: 'MEMBER' as MemberRole,
    joinedAt: new Date('2024-01-10'),
    lastSeen: new Date('2024-01-13'),
  },
]

export function TeamManagementSection({
  projectId,
  projectName,
  currentUserId,
  currentUserRole,
}: TeamManagementSectionProps) {
  const [members, setMembers] = useState(mockMembers)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const canManageMembers = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  const handleInviteMember = async (data: any) => {
    // TODO: Implement API call to send invitation
    console.log('Inviting member:', data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add mock member for demonstration
    const newMember = {
      id: String(Date.now()),
      user: {
        id: String(Date.now()),
        name: data.email.split('@')[0],
        username: data.email.split('@')[0],
        email: data.email,
        avatar: null,
      },
      role: data.role,
      joinedAt: new Date(),
    }
    
    setMembers([...members, newMember])
  }

  const handleRoleChange = async (userId: string, newRole: MemberRole) => {
    try {
      setLoading(true)
      
      // TODO: Implement API call to update member role
      console.log('Changing role for user:', userId, 'to:', newRole)
      
      // Update local state for demonstration
      setMembers(members.map(member => 
        member.user.id === userId 
          ? { ...member, role: newRole }
          : member
      ))
      
      toast({
        title: 'Role updated',
        description: 'Member role has been successfully updated.',
      })
    } catch (error) {
      toast({
        title: 'Failed to update role',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      setLoading(true)
      
      // TODO: Implement API call to remove member
      console.log('Removing member:', userId)
      
      // Update local state for demonstration
      setMembers(members.filter(member => member.user.id !== userId))
      
      toast({
        title: 'Member removed',
        description: 'Member has been removed from the project.',
      })
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage who has access to this project and their permissions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canManageMembers && (
              <>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <InviteMemberDialog
                  projectId={projectId}
                  projectName={projectName}
                  onInvite={handleInviteMember}
                />
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TeamMembersList
          projectId={projectId}
          members={members}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          loading={loading}
          onRoleChange={handleRoleChange}
          onRemoveMember={handleRemoveMember}
        />
      </CardContent>
    </Card>
  )
}