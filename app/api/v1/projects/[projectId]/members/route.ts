import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/auth/middleware'
import { addProjectMemberSchema } from '@/lib/validation/schemas'
import { ProjectService } from '@/lib/services/project.service'
import { z } from 'zod'

// GET /api/v1/projects/[projectId]/members - List project members
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    
    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Get project members
    const members = await prisma.projectMember.findMany({
      where: { projectId: params.projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' }
      ]
    })

    return NextResponse.json(members)

  } catch (error) {
    console.error('Get project members error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project members' },
      { status: 500 }
    )
  }
}

// POST /api/v1/projects/[projectId]/members - Add member to project
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const body = await req.json()
    
    // Validate input
    const validatedData = addProjectMemberSchema.parse(body)
    
    // Add member using service
    const member = await ProjectService.addMember(
      params.projectId,
      validatedData.userId,
      validatedData.role,
      user.id
    )

    return NextResponse.json(member, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      const message = error.message
      if (message === 'Insufficient permissions to add members') {
        return NextResponse.json({ error: message }, { status: 403 })
      }
      if (message === 'User is already a member of this project') {
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    console.error('Add project member error:', error)
    return NextResponse.json(
      { error: 'Failed to add project member' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/projects/[projectId]/members/[memberId] - Remove member from project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    
    // Check if user has permission to remove members
    const userMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: params.projectId
        }
      }
    })

    if (!userMember || (userMember.role !== 'OWNER' && userMember.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove members' },
        { status: 403 }
      )
    }

    // Get member to remove
    const memberToRemove = await prisma.projectMember.findUnique({
      where: {
        id: params.memberId,
        projectId: params.projectId
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          }
        }
      }
    })

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent removing the project owner
    if (memberToRemove.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove the project owner' },
        { status: 400 }
      )
    }

    // Remove member
    await prisma.projectMember.delete({
      where: { id: params.memberId }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'MEMBER_REMOVED',
        action: 'removed',
        entityId: params.memberId,
        entityType: 'member',
        userId: user.id,
        projectId: params.projectId,
        metadata: {
          memberName: memberToRemove.user.name || memberToRemove.user.username,
          memberRole: memberToRemove.role,
        }
      }
    })

    return NextResponse.json(
      { success: true, message: 'Member removed successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Remove project member error:', error)
    return NextResponse.json(
      { error: 'Failed to remove project member' },
      { status: 500 }
    )
  }
}