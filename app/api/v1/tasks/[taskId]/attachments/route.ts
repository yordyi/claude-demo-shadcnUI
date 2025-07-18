import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/auth/middleware'
import { upload, getFileUrl } from '@/lib/upload/config'
import { uploadToS3 } from '@/lib/upload/s3'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

// GET /api/v1/tasks/[taskId]/attachments - List task attachments
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

    // Get attachments
    const attachments = await prisma.attachment.findMany({
      where: { taskId: params.taskId },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json(attachments)

  } catch (error) {
    console.error('Get attachments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

// POST /api/v1/tasks/[taskId]/attachments - Upload attachment
export async function POST(
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

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    let fileUrl: string

    if (process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET) {
      // Upload to S3 in production
      const buffer = Buffer.from(await file.arrayBuffer())
      const multerFile = {
        buffer,
        originalname: file.name,
        mimetype: file.type,
      } as Express.Multer.File
      
      fileUrl = await uploadToS3(multerFile, `attachments/${params.taskId}/${filename}`)
    } else {
      // Save to local filesystem in development
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'attachments', params.taskId)
      await mkdir(uploadDir, { recursive: true })
      
      // Save file
      const filePath = path.join(uploadDir, filename)
      await writeFile(filePath, buffer)
      
      fileUrl = `/uploads/attachments/${params.taskId}/${filename}`
    }

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        url: fileUrl,
        size: file.size,
        mimeType: file.type,
        taskId: params.taskId,
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'TASK_UPDATED',
        action: 'attached',
        entityId: attachment.id,
        entityType: 'attachment',
        userId: user.id,
        projectId: task.projectId,
        taskId: task.id,
        metadata: {
          filename: file.name,
          size: file.size,
        }
      }
    })

    return NextResponse.json(attachment, { status: 201 })

  } catch (error) {
    console.error('Upload attachment error:', error)
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/tasks/[taskId]/attachments/[attachmentId] - Delete attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string; attachmentId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    
    // Verify user has access to the task
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: params.attachmentId,
        taskId: params.taskId,
        task: {
          project: {
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id } } }
            ]
          }
        }
      },
      include: {
        task: {
          select: { projectId: true }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from storage
    if (process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET) {
      // Delete from S3
      const key = attachment.url.split('.amazonaws.com/')[1]
      if (key) {
        const { deleteFromS3 } = await import('@/lib/upload/s3')
        await deleteFromS3(key)
      }
    }
    // For local storage, we'll keep the file (could implement cleanup later)

    // Delete attachment record
    await prisma.attachment.delete({
      where: { id: params.attachmentId }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'TASK_UPDATED',
        action: 'removed',
        entityId: params.attachmentId,
        entityType: 'attachment',
        userId: user.id,
        projectId: attachment.task.projectId,
        taskId: params.taskId,
        metadata: {
          filename: attachment.filename,
        }
      }
    })

    return NextResponse.json(
      { success: true, message: 'Attachment deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete attachment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}