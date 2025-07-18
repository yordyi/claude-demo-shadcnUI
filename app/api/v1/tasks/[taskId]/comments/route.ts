import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/auth/middleware'
import { createCommentSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

// GET /api/v1/tasks/[taskId]/comments - List task comments
export async function GET(
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
            { members: { some: { userId: user.id } } }
          ]
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Get comments
    const comments = await prisma.comment.findMany({
      where: { taskId: params.taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)

  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/v1/tasks/[taskId]/comments - Add comment to task
export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const body = await req.json()
    
    // Validate input
    const validatedData = createCommentSchema.parse({
      ...body,
      taskId: params.taskId
    })
    
    // Verify user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        project: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } }
          ]
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        taskId: params.taskId,
        authorId: user.id,
      },
      include: {
        author: {
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
        type: 'COMMENT_ADDED',
        action: 'created',
        entityId: comment.id,
        entityType: 'comment',
        userId: user.id,
        projectId: task.projectId,
        taskId: task.id,
        metadata: {
          taskTitle: task.title,
          commentPreview: comment.content.substring(0, 100)
        }
      }
    })

    // Check for mentions and create notifications
    const mentionRegex = /@(\w+)/g
    const mentions = comment.content.match(mentionRegex)
    
    if (mentions) {
      const usernames = mentions.map(m => m.substring(1))
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: usernames },
          NOT: { id: user.id }
        },
        select: { id: true, username: true }
      })

      if (mentionedUsers.length > 0) {
        await prisma.notification.createMany({
          data: mentionedUsers.map(mentionedUser => ({
            type: 'COMMENT_MENTION',
            title: 'You were mentioned in a comment',
            message: `${user.name || user.username} mentioned you in a comment on "${task.title}"`,
            userId: mentionedUser.id,
            metadata: {
              taskId: task.id,
              projectId: task.projectId,
              commentId: comment.id,
            }
          }))
        })
      }
    }

    // Notify task assignee if they're not the commenter
    if (task.assigneeId && task.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT_MENTION',
          title: 'New comment on your task',
          message: `${user.name || user.username} commented on "${task.title}"`,
          userId: task.assigneeId,
          metadata: {
            taskId: task.id,
            projectId: task.projectId,
            commentId: comment.id,
          }
        }
      })
    }

    return NextResponse.json(comment, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}