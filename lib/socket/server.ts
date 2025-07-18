import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'

export class SocketServer {
  private io: SocketIOServer | null = null
  private redisClient: any = null
  private redisSubClient: any = null

  async initialize(httpServer: HTTPServer) {
    // Create Redis clients for adapter
    if (process.env.REDIS_URL) {
      this.redisClient = createClient({ url: process.env.REDIS_URL })
      this.redisSubClient = this.redisClient.duplicate()
      
      await Promise.all([
        this.redisClient.connect(),
        this.redisSubClient.connect()
      ])
    }

    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
    })

    // Use Redis adapter for scaling
    if (this.redisClient && this.redisSubClient) {
      this.io.adapter(createAdapter(this.redisClient, this.redisSubClient))
    }

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication required'))
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
          }
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        // Attach user to socket
        socket.data.user = user
        next()
      } catch (error) {
        next(new Error('Invalid token'))
      }
    })

    // Connection handler
    this.io.on('connection', (socket) => {
      const user = socket.data.user
      console.log(`User ${user.username} connected`)

      // Join user's personal room
      socket.join(`user:${user.id}`)

      // Join project rooms
      this.joinUserProjects(socket, user.id)

      // Handle joining project room
      socket.on('join:project', async (projectId: string) => {
        const hasAccess = await this.userHasProjectAccess(user.id, projectId)
        if (hasAccess) {
          socket.join(`project:${projectId}`)
          socket.emit('joined:project', projectId)
        }
      })

      // Handle leaving project room
      socket.on('leave:project', (projectId: string) => {
        socket.leave(`project:${projectId}`)
        socket.emit('left:project', projectId)
      })

      // Handle joining task room
      socket.on('join:task', async (taskId: string) => {
        const hasAccess = await this.userHasTaskAccess(user.id, taskId)
        if (hasAccess) {
          socket.join(`task:${taskId}`)
          socket.emit('joined:task', taskId)
        }
      })

      // Handle leaving task room
      socket.on('leave:task', (taskId: string) => {
        socket.leave(`task:${taskId}`)
        socket.emit('left:task', taskId)
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${user.username} disconnected`)
      })
    })
  }

  private async joinUserProjects(socket: any, userId: string) {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: { id: true }
    })

    projects.forEach(project => {
      socket.join(`project:${project.id}`)
    })
  }

  private async userHasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    })
    return !!project
  }

  private async userHasTaskAccess(userId: string, taskId: string): Promise<boolean> {
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
    return !!task
  }

  // Emit events to rooms
  emitToProject(projectId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`project:${projectId}`).emit(event, data)
    }
  }

  emitToTask(taskId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`task:${taskId}`).emit(event, data)
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data)
    }
  }

  // Get instance
  getIO(): SocketIOServer | null {
    return this.io
  }
}

// Singleton instance
export const socketServer = new SocketServer()