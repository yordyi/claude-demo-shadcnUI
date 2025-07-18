import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export class ProjectService {
  static async getUserProjects(userId: string, options?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }) {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where: Prisma.ProjectWhereInput = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    }

    if (options?.search) {
      where.AND = {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } }
        ]
      }
    }

    if (options?.status) {
      where.status = options.status as any
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where })
    ])

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  static async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            sprints: true,
            labels: true,
          }
        }
      }
    })

    if (!project) {
      throw new Error('Project not found or access denied')
    }

    return project
  }

  static async getProjectStats(projectId: string) {
    const [taskStats, memberCount, activityCount] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true }
      }),
      prisma.projectMember.count({
        where: { projectId }
      }),
      prisma.activity.count({
        where: { projectId }
      })
    ])

    const stats = {
      tasks: {
        total: 0,
        todo: 0,
        inProgress: 0,
        inReview: 0,
        done: 0,
        canceled: 0,
      },
      members: memberCount,
      activities: activityCount,
    }

    taskStats.forEach(stat => {
      stats.tasks.total += stat._count.id
      switch (stat.status) {
        case 'TODO':
          stats.tasks.todo = stat._count.id
          break
        case 'IN_PROGRESS':
          stats.tasks.inProgress = stat._count.id
          break
        case 'IN_REVIEW':
          stats.tasks.inReview = stat._count.id
          break
        case 'DONE':
          stats.tasks.done = stat._count.id
          break
        case 'CANCELED':
          stats.tasks.canceled = stat._count.id
          break
      }
    })

    return stats
  }

  static async addMember(projectId: string, userId: string, role: string, addedById: string) {
    // Check if user adding member has permission
    const adderMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: addedById,
          projectId
        }
      }
    })

    if (!adderMember || (adderMember.role !== 'OWNER' && adderMember.role !== 'ADMIN')) {
      throw new Error('Insufficient permissions to add members')
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    })

    if (existingMember) {
      throw new Error('User is already a member of this project')
    }

    // Add member
    const member = await prisma.projectMember.create({
      data: {
        userId,
        projectId,
        role: role as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            email: true,
          }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'MEMBER_ADDED',
        action: 'added',
        entityId: member.id,
        entityType: 'member',
        userId: addedById,
        projectId,
        metadata: {
          memberName: member.user.name || member.user.username,
          memberRole: role,
        }
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        type: 'PROJECT_INVITE',
        title: 'Project invitation',
        message: `You have been added to a project`,
        userId,
        metadata: { projectId }
      }
    })

    return member
  }
}