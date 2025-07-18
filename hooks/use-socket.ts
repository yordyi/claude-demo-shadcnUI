'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/lib/socket/events'

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      const token = localStorage.getItem('accessToken')
      
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        auth: {
          token,
        },
      })

      socket.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })
    }

    return () => {
      // Don't disconnect on component unmount, keep connection alive
    }
  }, [])

  const joinProject = (projectId: string) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.JOIN_PROJECT, projectId)
    }
  }

  const leaveProject = (projectId: string) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.LEAVE_PROJECT, projectId)
    }
  }

  const joinTask = (taskId: string) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.JOIN_TASK, taskId)
    }
  }

  const leaveTask = (taskId: string) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.LEAVE_TASK, taskId)
    }
  }

  return {
    socket,
    isConnected,
    joinProject,
    leaveProject,
    joinTask,
    leaveTask,
  }
}

// Hook for listening to socket events
export function useSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  deps: any[] = []
) {
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.on(event, handler)

    return () => {
      socket.off(event, handler)
    }
  }, [socket, event, ...deps])
}