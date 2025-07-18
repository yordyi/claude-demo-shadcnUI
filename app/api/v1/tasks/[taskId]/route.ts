import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/auth/middleware'
import { updateTaskSchema } from '@/lib/validation/schemas'
import { TaskService } from '@/lib/services/task.service'
import { z } from 'zod'

// GET /api/v1/tasks/[taskId] - Get task details
export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const task = await TaskService.getTaskById(params.taskId, user.id)
    
    return NextResponse.json(task)

  } catch (error: any) {
    if (error.message === 'Task not found or access denied') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    console.error('Get task error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/tasks/[taskId] - Update task
export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const body = await req.json()
    
    // Validate input
    const validatedData = updateTaskSchema.parse(body)
    
    // Verify user has access to the task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        project: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } }
          ]
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Extract labels from validated data
    const { labels, ...taskData } = validatedData

    // Update task
    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: taskData,
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

    // Update labels if provided
    if (labels !== undefined) {
      // Remove existing labels
      await prisma.taskLabel.deleteMany({
        where: { taskId: params.taskId }
      })

      // Add new labels
      if (labels.length > 0) {
        await prisma.taskLabel.createMany({
          data: labels.map(labelId => ({
            taskId: params.taskId,
            labelId,
          }))
        })
      }
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'TASK_UPDATED',
        action: 'updated',
        entityId: task.id,
        entityType: 'task',
        userId: user.id,
        projectId: task.projectId,
        taskId: task.id,
        metadata: {
          updatedFields: Object.keys(validatedData)
        }
      }
    })

    // Create notification for assignee if changed
    if (validatedData.assigneeId && validatedData.assigneeId !== existingTask.assigneeId) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          title: 'Task assigned to you',
          message: `${user.name || user.username} assigned you a task: ${task.title}`,
          userId: validatedData.assigneeId,
          metadata: {
            taskId: task.id,
            projectId: task.projectId,
          }
        }
      })
    }

    return NextResponse.json(task)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update task error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/tasks/[taskId] - Delete task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    
    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        project: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id, role: { in: ['OWNER', 'ADMIN'] } } } }
          ]
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or insufficient permissions' },
        { status: 404 }
      )
    }

    // Delete task (cascade will handle related records)
    await prisma.task.delete({
      where: { id: params.taskId }
    })

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}