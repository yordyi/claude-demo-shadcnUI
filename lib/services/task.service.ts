import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export class TaskService {
  static async getProjectTasks(projectId: string, userId: string, filters?: {
    status?: string
    priority?: string
    type?: string
    assigneeId?: string
    sprintId?: string
    search?: string
    page?: number
    limit?: number
  }) {
    // Verify user has access to project
    const hasAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    })

    if (!hasAccess) {
      throw new Error('Project not found or access denied')
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const skip = (page - 1) * limit

    const where: Prisma.TaskWhereInput = { projectId }

    if (filters?.status) where.status = filters.status as any
    if (filters?.priority) where.priority = filters.priority as any
    if (filters?.type) where.type = filters.type as any
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId
    if (filters?.sprintId) where.sprintId = filters.sprintId

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
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
        orderBy: [
          { position: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where })
    ])

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  static async getTaskById(taskId: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
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
            email: true,
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
        parent: {
          select: {
            id: true,
            title: true,
          }
        },
        subtasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              }
            }
          }
        },
        sprint: true,
        labels: {
          include: {
            label: true
          }
        },
        comments: {
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
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' }
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }

    return task
  }

  static async updateTaskStatus(taskId: string, status: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      }
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }

    const oldStatus = task.status

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: status as any },
      include: {
        assignee: {
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
        type: 'TASK_UPDATED',
        action: 'updated',
        entityId: taskId,
        entityType: 'task',
        userId,
        projectId: task.projectId,
        taskId,
        metadata: {
          field: 'status',
          oldValue: oldStatus,
          newValue: status,
        }
      }
    })

    // Notify assignee if status changed to done and assignee is different from updater
    if (status === 'DONE' && task.assigneeId && task.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'STATUS_CHANGE',
          title: 'Task completed',
          message: `Task "${task.title}" has been marked as done`,
          userId: task.assigneeId,
          metadata: {
            taskId,
            projectId: task.projectId,
          }
        }
      })
    }

    return updatedTask
  }

  static async moveTask(taskId: string, newPosition: number, newStatus: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      }
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }

    // Get tasks that need position adjustment
    const tasksToUpdate = await prisma.task.findMany({
      where: {
        projectId: task.projectId,
        status: newStatus as any,
        position: {
          gte: newPosition
        },
        id: {
          not: taskId
        }
      },
      select: { id: true, position: true }
    })

    // Update positions in a transaction
    await prisma.$transaction([
      // Move other tasks down
      ...tasksToUpdate.map(t => 
        prisma.task.update({
          where: { id: t.id },
          data: { position: t.position + 1000 }
        })
      ),
      // Update the moved task
      prisma.task.update({
        where: { id: taskId },
        data: {
          position: newPosition,
          status: newStatus as any
        }
      })
    ])

    return true
  }
}