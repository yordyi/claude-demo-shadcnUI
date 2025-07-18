'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Download, FileJson, FileSpreadsheet, FileText, Loader2, Settings2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { EXPORT_TEMPLATES, ExportFormat } from '@/lib/export'
import { useToast } from '@/hooks/use-toast'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataType: 'tasks' | 'projects' | 'analytics' | 'team'
  onExport: (config: ExportConfig) => Promise<void>
  availableFields?: ExportField[]
  totalCount?: number
}

interface ExportField {
  key: string
  label: string
  defaultSelected?: boolean
}

interface ExportConfig {
  format: ExportFormat
  filename?: string
  dateRange?: {
    start: Date | undefined
    end: Date | undefined
  }
  fields: string[]
  template?: string
}

const FORMAT_ICONS = {
  csv: FileText,
  excel: FileSpreadsheet,
  pdf: FileText,
  json: FileJson,
}

const FORMAT_DESCRIPTIONS = {
  csv: 'Comma-separated values, compatible with Excel and Google Sheets',
  excel: 'Microsoft Excel workbook with multiple sheets and formatting',
  pdf: 'Portable document format for reports and printing',
  json: 'JavaScript Object Notation for data backup and API integration',
}

export function ExportDialog({
  open,
  onOpenChange,
  dataType,
  onExport,
  availableFields = [],
  totalCount = 0
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined
    end: Date | undefined
  }>({
    start: undefined,
    end: undefined
  })
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { toast } = useToast()

  // Get default fields based on data type
  const getDefaultFields = () => {
    switch (dataType) {
      case 'tasks':
        return ['title', 'status', 'priority', 'assignee', 'project', 'dueDate']
      case 'projects':
        return ['name', 'key', 'status', 'owner', 'startDate', 'endDate']
      case 'team':
        return ['name', 'email', 'role', 'joinedAt']
      default:
        return availableFields.filter(f => f.defaultSelected).map(f => f.key)
    }
  }

  // Initialize selected fields
  useState(() => {
    setSelectedFields(getDefaultFields())
  })

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template)
    const templateConfig = EXPORT_TEMPLATES[template as keyof typeof EXPORT_TEMPLATES]
    if (templateConfig) {
      setSelectedFields(templateConfig.fields)
    }
  }

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: 'No fields selected',
        description: 'Please select at least one field to export',
        variant: 'destructive'
      })
      return
    }

    setIsExporting(true)
    try {
      await onExport({
        format,
        dateRange,
        fields: selectedFields,
        template: selectedTemplate,
        filename: `${dataType}-export-${format(new Date(), 'yyyy-MM-dd')}.${format}`
      })
      
      toast({
        title: 'Export successful',
        description: `Your ${dataType} data has been exported to ${format.toUpperCase()} format`
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred during export',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const FormatIcon = FORMAT_ICONS[format]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export {dataType}</DialogTitle>
          <DialogDescription>
            Export your {dataType} data in various formats. {totalCount > 0 && `${totalCount} records will be exported.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(FORMAT_ICONS) as ExportFormat[]).map((fmt) => {
                const Icon = FORMAT_ICONS[fmt]
                return (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-3 transition-colors",
                      format === fmt
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div className="text-left">
                      <div className="font-medium uppercase">{fmt}</div>
                      <div className="text-xs text-gray-500">
                        {FORMAT_DESCRIPTIONS[fmt].split(',')[0]}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Template Selection (optional) */}
          {dataType === 'tasks' && (
            <div className="space-y-3">
              <Label>Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Date Range (Optional)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateRange({ start: undefined, end: undefined })}
              >
                Clear
              </Button>
            </div>
            <div className="flex space-x-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.start ? format(dateRange.start, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !dateRange.end && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.end ? format(dateRange.end, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2"
            >
              <Settings2 className="h-4 w-4" />
              <span>Advanced Options</span>
            </Button>

            {showAdvanced && (
              <div className="space-y-3 rounded-lg border p-4">
                <Label>Select Fields to Export</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(availableFields.length > 0 ? availableFields : getDefaultFields().map(f => ({ key: f, label: f }))).map((field) => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => handleFieldToggle(field.key)}
                      />
                      <Label
                        htmlFor={field.key}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
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
  )
}