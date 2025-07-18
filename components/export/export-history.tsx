'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Clock, Download, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface ExportRecord {
  id: string
  filename: string
  format: 'csv' | 'excel' | 'pdf' | 'json'
  dataType: 'tasks' | 'projects' | 'analytics' | 'team'
  exportedAt: Date
  exportedBy: string
  recordCount: number
  fileSize?: string
  status: 'completed' | 'failed' | 'pending'
}

// Mock data - in a real app, this would come from an API
const mockExportHistory: ExportRecord[] = [
  {
    id: '1',
    filename: 'tasks-2024-03-15.csv',
    format: 'csv',
    dataType: 'tasks',
    exportedAt: new Date('2024-03-15T10:30:00'),
    exportedBy: 'John Doe',
    recordCount: 245,
    fileSize: '124 KB',
    status: 'completed'
  },
  {
    id: '2',
    filename: 'project-ABC-report.pdf',
    format: 'pdf',
    dataType: 'projects',
    exportedAt: new Date('2024-03-14T15:45:00'),
    exportedBy: 'Jane Smith',
    recordCount: 1,
    fileSize: '2.3 MB',
    status: 'completed'
  },
  {
    id: '3',
    filename: 'analytics-2024-Q1.xlsx',
    format: 'excel',
    dataType: 'analytics',
    exportedAt: new Date('2024-03-13T09:15:00'),
    exportedBy: 'Admin User',
    recordCount: 1500,
    fileSize: '856 KB',
    status: 'completed'
  }
]

export function ExportHistory() {
  const [exports, setExports] = useState<ExportRecord[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load export history from localStorage or API
    const savedHistory = localStorage.getItem('exportHistory')
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory)
      setExports(parsed.map((record: any) => ({
        ...record,
        exportedAt: new Date(record.exportedAt)
      })))
    } else {
      // Use mock data for demo
      setExports(mockExportHistory)
    }
  }, [])

  const handleDelete = (id: string) => {
    const updatedExports = exports.filter(exp => exp.id !== id)
    setExports(updatedExports)
    localStorage.setItem('exportHistory', JSON.stringify(updatedExports))
    
    toast({
      title: 'Export record deleted',
      description: 'The export record has been removed from history'
    })
    
    setDeleteId(null)
  }

  const handleDownload = (record: ExportRecord) => {
    // In a real app, this would download the file from storage
    toast({
      title: 'Download started',
      description: `Downloading ${record.filename}...`
    })
  }

  const getFormatBadgeVariant = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'destructive'
      case 'excel':
        return 'success'
      case 'csv':
        return 'secondary'
      case 'json':
        return 'outline'
      default:
        return 'default'
    }
  }

  const getDataTypeBadgeVariant = (dataType: string) => {
    switch (dataType) {
      case 'tasks':
        return 'default'
      case 'projects':
        return 'secondary'
      case 'analytics':
        return 'outline'
      case 'team':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Export History</span>
          </CardTitle>
          <CardDescription>
            View and manage your previously exported files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No export history available</p>
              <p className="text-sm mt-1">Your exported files will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Exported</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.filename}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDataTypeBadgeVariant(record.dataType)}>
                        {record.dataType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getFormatBadgeVariant(record.format)}>
                        {record.format.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.recordCount.toLocaleString()}</TableCell>
                    <TableCell>{record.fileSize || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(record.exportedAt, 'MMM dd, yyyy')}</div>
                        <div className="text-gray-500">
                          {format(record.exportedAt, 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{record.exportedBy}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(record)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(record.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Export Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this export record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}