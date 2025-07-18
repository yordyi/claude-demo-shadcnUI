import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '@/lib/services/task.service'
import { authenticate } from '@/lib/auth/middleware'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED'])
})

// PATCH /api/v1/tasks/[taskId]/status - Update task status
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
    const { status } = updateStatusSchema.parse(body)
    
    // Update task status
    const updatedTask = await TaskService.updateTaskStatus(
      params.taskId,
      status,
      user.id
    )

    return NextResponse.json(updatedTask)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Task not found or access denied') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    console.error('Update task status error:', error)
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    )
  }
}