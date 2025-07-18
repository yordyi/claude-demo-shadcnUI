import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './jwt'
import { prisma } from '../db/prisma'

export async function authenticate(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const payload = verifyAccessToken(token)
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        name: true,
        avatar: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Attach user to request for use in route handlers
    ;(req as any).user = user
    
    return null // No error, continue to route handler
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function authorize(req: NextRequest, requiredRole?: string) {
  const authError = await authenticate(req)
  if (authError) return authError

  const user = (req as any).user

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  return null
}