import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/auth/middleware'
import { updateProjectSchema } from '@/lib/validation/schemas'
import { ProjectService } from '@/lib/services/project.service'
import { z } from 'zod'

// GET /api/v1/projects/[projectId] - Get project details
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const project = await ProjectService.getProjectById(params.projectId, user.id)
    
    return NextResponse.json(project)

  } catch (error: any) {
    if (error.message === 'Project not found or access denied') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    console.error('Get project error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/projects/[projectId] - Update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const body = await req.json()
    
    // Validate input
    const validatedData = updateProjectSchema.parse(body)
    
    // Check if user has permission to update (must be owner or admin)
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: params.projectId
        }
      }
    })

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: params.projectId },
      data: validatedData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PROJECT_UPDATED',
        action: 'updated',
        entityId: project.id,
        entityType: 'project',
        userId: user.id,
        projectId: project.id,
        metadata: {
          updates: Object.keys(validatedData)
        }
      }
    })

    return NextResponse.json(project)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update project error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/projects/[projectId] - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    
    // Check if user is the owner
    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        ownerId: user.id
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or insufficient permissions' },
        { status: 404 }
      )
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: params.projectId }
    })

    return NextResponse.json(
      { success: true, message: 'Project deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}