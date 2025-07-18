'use client'

import { useState } from 'react'
import { BarChart3, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportElementToPDF, exportToExcel, exportToCSV } from '@/lib/export'
import { useToast } from '@/hooks/use-toast'

interface AnalyticsExportProps {
  data: {
    charts?: {
      id: string
      title: string
      data: any[]
    }[]
    metrics?: Record<string, any>
    rawData?: any[]
  }
  projectName?: string
}

type ExportType = 'charts' | 'data' | 'combined'
type ExportFormat = 'pdf' | 'excel' | 'csv'

export function AnalyticsExport({ data, projectName = 'Analytics' }: AnalyticsExportProps) {
  const [open, setOpen] = useState(false)
  const [exportType, setExportType] = useState<ExportType>('combined')
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [selectedCharts, setSelectedCharts] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Initialize selected charts
  useState(() => {
    if (data.charts) {
      setSelectedCharts(data.charts.map(c => c.id))
    }
  })

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      switch (exportType) {
        case 'charts':
          if (format === 'pdf') {
            // Export selected charts as PDF
            for (const chartId of selectedCharts) {
              const chart = data.charts?.find(c => c.id === chartId)
              if (chart) {
                await exportElementToPDF(chartId, {
                  title: chart.title,
                  filename: `${projectName}-${chart.title.toLowerCase().replace(/\s+/g, '-')}-chart.pdf`
                })
              }
            }
          } else {
            toast({
              title: 'Format not supported',
              description: 'Charts can only be exported as PDF',
              variant: 'destructive'
            })
            return
          }
          break
          
        case 'data':
          if (format === 'excel') {
            // Export raw data to Excel
            const wb = (window as any).XLSX.utils.book_new()
            
            // Add metrics sheet if available
            if (data.metrics) {
              const metricsSheet = (window as any).XLSX.utils.json_to_sheet([data.metrics])
              (window as any).XLSX.utils.book_append_sheet(wb, metricsSheet, 'Metrics')
            }
            
            // Add raw data sheets
            if (data.rawData) {
              const dataSheet = (window as any).XLSX.utils.json_to_sheet(data.rawData)
              (window as any).XLSX.utils.book_append_sheet(wb, dataSheet, 'Data')
            }
            
            // Add chart data sheets
            data.charts?.forEach(chart => {
              if (selectedCharts.includes(chart.id)) {
                const chartSheet = (window as any).XLSX.utils.json_to_sheet(chart.data)
                (window as any).XLSX.utils.book_append_sheet(wb, chartSheet, chart.title)
              }
            })
            
            const wbout = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([wbout], { type: 'application/octet-stream' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${projectName}-analytics-data.xlsx`
            a.click()
            URL.revokeObjectURL(url)
            
          } else if (format === 'csv') {
            // Export as CSV (only raw data)
            if (data.rawData) {
              exportToCSV(data.rawData, {
                filename: `${projectName}-analytics-data.csv`
              })
            }
          }
          break
          
        case 'combined':
          if (format === 'pdf') {
            // Create a comprehensive PDF report
            // This would need a more complex implementation to combine multiple elements
            toast({
              title: 'Coming soon',
              description: 'Combined PDF export will be available soon',
            })
          } else if (format === 'excel') {
            // Export everything to Excel
            const wb = (window as any).XLSX.utils.book_new()
            
            // Summary sheet
            const summary = {
              'Report': `${projectName} Analytics Report`,
              'Generated': new Date().toISOString(),
              'Total Charts': data.charts?.length || 0,
              'Data Points': data.rawData?.length || 0
            }
            const summarySheet = (window as any).XLSX.utils.json_to_sheet([summary])
            (window as any).XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
            
            // Metrics sheet
            if (data.metrics) {
              const metricsSheet = (window as any).XLSX.utils.json_to_sheet([data.metrics])
              (window as any).XLSX.utils.book_append_sheet(wb, metricsSheet, 'Metrics')
            }
            
            // Raw data
            if (data.rawData) {
              const dataSheet = (window as any).XLSX.utils.json_to_sheet(data.rawData)
              (window as any).XLSX.utils.book_append_sheet(wb, dataSheet, 'Raw Data')
            }
            
            // Chart data
            data.charts?.forEach(chart => {
              const chartSheet = (window as any).XLSX.utils.json_to_sheet(chart.data)
              (window as any).XLSX.utils.book_append_sheet(wb, chartSheet, chart.title)
            })
            
            const wbout = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([wbout], { type: 'application/octet-stream' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${projectName}-analytics-complete.xlsx`
            a.click()
            URL.revokeObjectURL(url)
          }
          break
      }
      
      toast({
        title: 'Export successful',
        description: 'Analytics data has been exported'
      })
      
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getAvailableFormats = () => {
    switch (exportType) {
      case 'charts':
        return ['pdf']
      case 'data':
        return ['excel', 'csv']
      case 'combined':
        return ['pdf', 'excel']
      default:
        return ['pdf', 'excel', 'csv']
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export Analytics
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Analytics</DialogTitle>
            <DialogDescription>
              Export your analytics data and visualizations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Export Type */}
            <div className="space-y-2">
              <Label>What to Export</Label>
              <Select value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="charts">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Charts Only</div>
                        <div className="text-xs text-gray-500">Export visualizations as images</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="data">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Data Only</div>
                        <div className="text-xs text-gray-500">Export raw data and metrics</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="combined">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Combined Report</div>
                        <div className="text-xs text-gray-500">Export charts and data together</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select 
                value={format} 
                onValueChange={(value) => setFormat(value as ExportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableFormats().includes('pdf') && (
                    <SelectItem value="pdf">PDF Document</SelectItem>
                  )}
                  {getAvailableFormats().includes('excel') && (
                    <SelectItem value="excel">Excel Workbook</SelectItem>
                  )}
                  {getAvailableFormats().includes('csv') && (
                    <SelectItem value="csv">CSV File</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Chart Selection */}
            {(exportType === 'charts' || exportType === 'combined') && data.charts && (
              <div className="space-y-2">
                <Label>Select Charts to Export</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {data.charts.map(chart => (
                    <div key={chart.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={chart.id}
                        checked={selectedCharts.includes(chart.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCharts(prev => [...prev, chart.id])
                          } else {
                            setSelectedCharts(prev => prev.filter(id => id !== chart.id))
                          }
                        }}
                      />
                      <Label 
                        htmlFor={chart.id}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {chart.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Info */}
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              {exportType === 'charts' && (
                <p>Charts will be exported as high-quality images in PDF format.</p>
              )}
              {exportType === 'data' && (
                <p>Raw data and metrics will be exported in a tabular format.</p>
              )}
              {exportType === 'combined' && (
                <p>A comprehensive report including both visualizations and data will be generated.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || (exportType !== 'data' && selectedCharts.length === 0)}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}