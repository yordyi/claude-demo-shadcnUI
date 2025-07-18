import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/auth/middleware'
import { paginationSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

// GET /api/v1/notifications - List user notifications
export async function GET(req: NextRequest) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const { searchParams } = new URL(req.url)
    
    // Parse pagination params
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const skip = (page - 1) * limit

    // Get notifications
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({
        where: { userId: user.id }
      })
    ])

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount,
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

    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/notifications/read - Mark notifications as read
export async function PATCH(req: NextRequest) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    const body = await req.json()
    
    const { notificationIds } = z.object({
      notificationIds: z.array(z.string()).optional()
    }).parse(body)

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: { read: true }
      })
    } else {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false
        },
        data: { read: true }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Mark notifications read error:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}