'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSocketEvent } from '@/hooks/use-socket'
import { SOCKET_EVENTS } from '@/lib/socket/events'
import type { NotificationPayload } from '@/lib/socket/events'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  metadata?: Record<string, any>
  createdAt: string
}

export function NotificationPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // Listen for new notifications
  useSocketEvent<NotificationPayload>(
    SOCKET_EVENTS.NOTIFICATION_RECEIVED,
    (notification) => {
      setNotifications(prev => [notification as Notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }
  )

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/v1/notifications')
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      await fetch('/api/v1/notifications/read', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (notificationIds) {
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return '📋'
      case 'TASK_DUE':
        return '⏰'
      case 'COMMENT_MENTION':
        return '💬'
      case 'PROJECT_INVITE':
        return '👥'
      case 'STATUS_CHANGE':
        return '🔄'
      default:
        return '📬'
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead()}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-muted/50 cursor-pointer transition-colors',
                    !notification.read && 'bg-muted/20'
                  )}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead([notification.id])
                    }
                    // Handle notification click (navigate to relevant page)
                    handleNotificationClick(notification)
                  }}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function handleNotificationClick(notification: Notification) {
  const metadata = notification.metadata || {}
  
  // Navigate based on notification type
  switch (notification.type) {
    case 'TASK_ASSIGNED':
    case 'TASK_DUE':
    case 'STATUS_CHANGE':
      if (metadata.projectId && metadata.taskId) {
        window.location.href = `/projects/${metadata.projectId}?task=${metadata.taskId}`
      }
      break
    case 'COMMENT_MENTION':
      if (metadata.projectId && metadata.taskId) {
        window.location.href = `/projects/${metadata.projectId}?task=${metadata.taskId}&comment=${metadata.commentId}`
      }
      break
    case 'PROJECT_INVITE':
      if (metadata.projectId) {
        window.location.href = `/projects/${metadata.projectId}`
      }
      break
  }
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}