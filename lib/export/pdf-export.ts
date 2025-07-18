import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'
import html2canvas from 'html2canvas'

// Extend jsPDF types for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

export interface PDFExportOptions {
  filename?: string
  title?: string
  subtitle?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
  logo?: string
  author?: string
  subject?: string
}

export function exportToPDF(
  data: any[],
  columns: { header: string; dataKey: string }[],
  options: PDFExportOptions = {}
) {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.pdf`,
    title = 'Export Report',
    subtitle,
    orientation = 'portrait',
    format = 'a4',
    logo,
    author = 'Project Management System',
    subject = 'Data Export'
  } = options

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format
  })

  // Set document properties
  doc.setProperties({
    title,
    subject,
    author,
    creator: 'Project Management System'
  })

  let yPosition = 40

  // Add logo if provided
  if (logo) {
    doc.addImage(logo, 'PNG', 40, yPosition, 50, 50)
    yPosition = 100
  }

  // Add title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' })
  yPosition += 30

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' })
    yPosition += 20
  }

  // Add generation date
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`,
    doc.internal.pageSize.getWidth() / 2,
    yPosition,
    { align: 'center' }
  )
  yPosition += 30

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Add table
  doc.autoTable({
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => {
      const value = getNestedValue(row, col.dataKey)
      if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd')
      }
      return value || ''
    })),
    startY: yPosition,
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: yPosition, left: 40, right: 40 }
  })

  // Add page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 80,
      doc.internal.pageSize.getHeight() - 30
    )
  }

  // Save the PDF
  doc.save(filename)
}

// Helper function to get nested values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

// Task-specific PDF export
export function exportTasksToPDF(tasks: any[], options?: PDFExportOptions) {
  const columns = [
    { header: 'Title', dataKey: 'title' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Priority', dataKey: 'priority' },
    { header: 'Assignee', dataKey: 'assignee.name' },
    { header: 'Project', dataKey: 'project.name' },
    { header: 'Due Date', dataKey: 'dueDate' },
    { header: 'Created', dataKey: 'createdAt' }
  ]

  return exportToPDF(tasks, columns, {
    filename: `tasks-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
    title: 'Tasks Report',
    subtitle: `Total Tasks: ${tasks.length}`,
    ...options
  })
}

// Project report PDF
export function exportProjectReportToPDF(project: any, tasks: any[], options?: PDFExportOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  })

  const filename = options?.filename || `project-${project.key}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`

  // Title page
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(project.name, doc.internal.pageSize.getWidth() / 2, 100, { align: 'center' })

  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text(`Project Key: ${project.key}`, doc.internal.pageSize.getWidth() / 2, 130, { align: 'center' })

  // Project details
  doc.setFontSize(12)
  let yPos = 200
  const leftMargin = 60
  const lineHeight = 20

  doc.text(`Status: ${project.status}`, leftMargin, yPos)
  yPos += lineHeight
  doc.text(`Owner: ${project.owner?.name || 'Unknown'}`, leftMargin, yPos)
  yPos += lineHeight
  doc.text(`Start Date: ${project.startDate ? format(new Date(project.startDate), 'MMMM dd, yyyy') : 'Not set'}`, leftMargin, yPos)
  yPos += lineHeight
  doc.text(`End Date: ${project.endDate ? format(new Date(project.endDate), 'MMMM dd, yyyy') : 'Not set'}`, leftMargin, yPos)
  yPos += lineHeight
  doc.text(`Team Members: ${project._count?.members || 0}`, leftMargin, yPos)
  yPos += lineHeight
  doc.text(`Total Tasks: ${tasks.length}`, leftMargin, yPos)

  // Task summary
  yPos += 40
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Task Summary', leftMargin, yPos)

  yPos += 30
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(tasksByStatus).forEach(([status, count]) => {
    doc.text(`${status}: ${count}`, leftMargin + 20, yPos)
    yPos += lineHeight
  })

  // Add new page for task list
  doc.addPage()

  // Task list
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Task List', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' })

  const taskColumns = [
    { header: 'Title', dataKey: 'title' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Priority', dataKey: 'priority' },
    { header: 'Assignee', dataKey: 'assignee.name' },
    { header: 'Due Date', dataKey: 'dueDate' }
  ]

  doc.autoTable({
    head: [taskColumns.map(col => col.header)],
    body: tasks.map(task => [
      task.title,
      task.status,
      task.priority,
      task.assignee?.name || 'Unassigned',
      task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '-'
    ]),
    startY: 80,
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  })

  // Add page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 80,
      doc.internal.pageSize.getHeight() - 30
    )
  }

  doc.save(filename)
}

// Export chart/element to PDF
export async function exportElementToPDF(
  elementId: string,
  options: PDFExportOptions = {}
) {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`)
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true
  })

  const imgData = canvas.toDataURL('image/png')
  const doc = new jsPDF({
    orientation: options.orientation || 'landscape',
    unit: 'pt',
    format: options.format || 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const imgWidth = pageWidth - 80 // 40pt margins on each side
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let yPosition = 40

  // Add title if provided
  if (options.title) {
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(options.title, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 40
  }

  // Add image
  doc.addImage(imgData, 'PNG', 40, yPosition, imgWidth, imgHeight)

  // Save
  doc.save(
    options.filename || `chart-export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.pdf`
  )
}