// Socket event types for type safety

export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Room events
  JOIN_PROJECT: 'join:project',
  LEAVE_PROJECT: 'leave:project',
  JOINED_PROJECT: 'joined:project',
  LEFT_PROJECT: 'left:project',
  JOIN_TASK: 'join:task',
  LEAVE_TASK: 'leave:task',
  JOINED_TASK: 'joined:task',
  LEFT_TASK: 'left:task',

  // Project events
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  PROJECT_MEMBER_ADDED: 'project:member:added',
  PROJECT_MEMBER_REMOVED: 'project:member:removed',

  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_MOVED: 'task:moved',
  TASK_ASSIGNED: 'task:assigned',
  TASK_STATUS_CHANGED: 'task:status:changed',

  // Comment events
  COMMENT_ADDED: 'comment:added',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',

  // Notification events
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',

  // Activity events
  ACTIVITY_CREATED: 'activity:created',

  // User status events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_TYPING: 'user:typing',
  USER_STOPPED_TYPING: 'user:stopped:typing',
} as const

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS]

// Event payload types
export interface ProjectUpdatedPayload {
  projectId: string
  updates: Record<string, any>
  updatedBy: {
    id: string
    name: string
    username: string
  }
}

export interface TaskCreatedPayload {
  projectId: string
  task: {
    id: string
    title: string
    status: string
    priority: string
    type: string
    assignee?: {
      id: string
      name: string
      username: string
      avatar?: string
    }
  }
  createdBy: {
    id: string
    name: string
    username: string
  }
}

export interface TaskUpdatedPayload {
  projectId: string
  taskId: string
  updates: Record<string, any>
  updatedBy: {
    id: string
    name: string
    username: string
  }
}

export interface TaskMovedPayload {
  projectId: string
  taskId: string
  fromStatus: string
  toStatus: string
  position: number
  movedBy: {
    id: string
    name: string
    username: string
  }
}

export interface CommentAddedPayload {
  projectId: string
  taskId: string
  comment: {
    id: string
    content: string
    createdAt: string
    author: {
      id: string
      name: string
      username: string
      avatar?: string
    }
  }
}

export interface NotificationPayload {
  id: string
  type: string
  title: string
  message: string
  metadata?: Record<string, any>
  createdAt: string
}