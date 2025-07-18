'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, Send, Copy, Check } from 'lucide-react'
import { MemberRole } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const),
  message: z.string().optional(),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteMemberDialogProps {
  projectId: string
  projectName: string
  onInvite?: (data: InviteFormData) => Promise<void>
}

export function InviteMemberDialog({
  projectId,
  projectName,
  onInvite,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const { toast } = useToast()

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER',
      message: '',
    },
  })

  const generateInviteLink = () => {
    // In a real app, this would make an API call to generate a secure invite link
    const baseUrl = window.location.origin
    const token = btoa(JSON.stringify({ projectId, role: form.getValues('role'), timestamp: Date.now() }))
    const link = `${baseUrl}/invite/${token}`
    setInviteLink(link)
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      toast({
        title: 'Link copied!',
        description: 'The invite link has been copied to your clipboard.',
      })
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try copying the link manually.',
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (data: InviteFormData) => {
    try {
      setLoading(true)
      await onInvite?.(data)
      
      toast({
        title: 'Invitation sent!',
        description: `An invitation has been sent to ${data.email}`,
      })
      
      form.reset()
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Failed to send invitation',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite member to {projectName}</DialogTitle>
          <DialogDescription>
            Send an invitation email or share an invite link to add new members to your project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="colleague@company.com" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    We'll send an invitation to this email address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        <div className="flex flex-col">
                          <span className="font-medium">Admin</span>
                          <span className="text-xs text-muted-foreground">
                            Can manage project settings and members
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEMBER">
                        <div className="flex flex-col">
                          <span className="font-medium">Member</span>
                          <span className="text-xs text-muted-foreground">
                            Can create and edit tasks
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="VIEWER">
                        <div className="flex flex-col">
                          <span className="font-medium">Viewer</span>
                          <span className="text-xs text-muted-foreground">
                            Can only view project content
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal message (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hey! I'd like to invite you to collaborate on our project..."
                      className="resize-none"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a personal message to the invitation email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Or share an invite link</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateInviteLink}
                  disabled={loading}
                >
                  Generate link
                </Button>
              </div>
              {inviteLink && (
                <div className="flex items-center gap-2">
                  <Input 
                    value={inviteLink} 
                    readOnly 
                    className="text-sm"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={copyInviteLink}
                    disabled={loading}
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}