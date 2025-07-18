import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth/middleware'
import { ProjectService } from '@/lib/services/project.service'

// GET /api/v1/projects/[projectId]/stats - Get project statistics
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const authError = await authenticate(req)
  if (authError) return authError

  try {
    const user = (req as any).user
    
    // Verify access and get stats
    await ProjectService.getProjectById(params.projectId, user.id)
    const stats = await ProjectService.getProjectStats(params.projectId)
    
    return NextResponse.json(stats)

  } catch (error: any) {
    if (error.message === 'Project not found or access denied') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    console.error('Get project stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project statistics' },
      { status: 500 }
    )
  }
}