import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/auth/middleware'
import { createProjectSchema, paginationSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

// GET /api/v1/projects - List all projects user has access to
export async function GET(req: NextRequest) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const { searchParams } = new URL(req.url)
    
    // Parse pagination params
    const { page, limit, sortBy, sortOrder } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    const skip = (page - 1) * limit

    // Get projects where user is owner or member
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } }
          ]
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            }
          },
          _count: {
            select: {
              members: true,
              tasks: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      prisma.project.count({
        where: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } }
          ]
        }
      })
    ])

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/v1/projects - Create a new project
export async function POST(req: NextRequest) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const body = await req.json()
    
    // Validate input
    const validatedData = createProjectSchema.parse(body)
    
    // Check if project key already exists
    const existingProject = await prisma.project.findUnique({
      where: { key: validatedData.key }
    })

    if (existingProject) {
      return NextResponse.json(
        { error: 'Project with this key already exists' },
        { status: 400 }
      )
    }

    // Create project with owner as first member
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              }
            }
          }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PROJECT_CREATED',
        action: 'created',
        entityId: project.id,
        entityType: 'project',
        userId: user.id,
        projectId: project.id,
        metadata: {
          projectName: project.name,
          projectKey: project.key,
        }
      }
    })

    return NextResponse.json(project, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}