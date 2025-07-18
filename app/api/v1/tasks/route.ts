import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/auth/middleware'
import { createTaskSchema, taskFilterSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

// GET /api/v1/tasks - List tasks with filters
export async function GET(req: NextRequest) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const { searchParams } = new URL(req.url)
    
    // Parse filter params
    const filters = taskFilterSchema.parse(Object.fromEntries(searchParams))
    const { page, limit, sortBy, sortOrder, ...whereFilters } = filters

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    // User must have access to the project
    where.project = {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } }
      ]
    }

    // Apply filters
    if (whereFilters.status) where.status = whereFilters.status
    if (whereFilters.priority) where.priority = whereFilters.priority
    if (whereFilters.type) where.type = whereFilters.type
    if (whereFilters.assigneeId) where.assigneeId = whereFilters.assigneeId
    if (whereFilters.creatorId) where.creatorId = whereFilters.creatorId
    if (whereFilters.sprintId) where.sprintId = whereFilters.sprintId
    
    if (whereFilters.search) {
      where.OR = [
        { title: { contains: whereFilters.search, mode: 'insensitive' } },
        { description: { contains: whereFilters.search, mode: 'insensitive' } }
      ]
    }

    // Get tasks with pagination
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true,
            }
          },
          assignee: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            }
          },
          labels: {
            include: {
              label: true
            }
          },
          _count: {
            select: {
              subtasks: true,
              comments: true,
              attachments: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      prisma.task.count({ where })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Get tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/v1/tasks - Create a new task
export async function POST(req: NextRequest) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const body = await req.json()
    
    // Validate input
    const validatedData = createTaskSchema.parse(body)
    
    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
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

    // Extract labels from validated data
    const { labels, ...taskData } = validatedData

    // Create task
    const task = await prisma.task.create({
      data: {
        ...taskData,
        creatorId: user.id,
        position: await getNextPosition(validatedData.projectId, validatedData.status),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      }
    })

    // Add labels if provided
    if (labels && labels.length > 0) {
      await prisma.taskLabel.createMany({
        data: labels.map(labelId => ({
          taskId: task.id,
          labelId,
        }))
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'TASK_CREATED',
        action: 'created',
        entityId: task.id,
        entityType: 'task',
        userId: user.id,
        projectId: task.projectId,
        taskId: task.id,
        metadata: {
          taskTitle: task.title,
          taskType: task.type,
        }
      }
    })

    // Create notification for assignee if different from creator
    if (task.assigneeId && task.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          title: 'New task assigned',
          message: `${user.name || user.username} assigned you a task: ${task.title}`,
          userId: task.assigneeId,
          metadata: {
            taskId: task.id,
            projectId: task.projectId,
          }
        }
      })
    }

    return NextResponse.json(task, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// Helper function to get next position for kanban ordering
async function getNextPosition(projectId: string, status: string): Promise<number> {
  const lastTask = await prisma.task.findFirst({
    where: { projectId, status },
    orderBy: { position: 'desc' },
    select: { position: true }
  })
  
  return (lastTask?.position ?? 0) + 1000
}