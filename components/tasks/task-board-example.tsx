'use client'

import { TaskBoard } from './task-board'

// Example usage of TaskBoard with filtering
export function TaskBoardExample() {
  // Mock data for demonstration
  const mockUsers = [
    { id: '1', username: 'john_doe', name: 'John Doe', email: 'john@example.com', avatar: null },
    { id: '2', username: 'jane_smith', name: 'Jane Smith', email: 'jane@example.com', avatar: null },
    { id: '3', username: 'bob_wilson', name: 'Bob Wilson', email: 'bob@example.com', avatar: null },
  ]

  const mockLabels = [
    { id: '1', name: 'Bug', color: '#ef4444', projectId: 'proj-1', createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'Feature', color: '#10b981', projectId: 'proj-1', createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'Enhancement', color: '#3b82f6', projectId: 'proj-1', createdAt: new Date(), updatedAt: new Date() },
    { id: '4', name: 'Documentation', color: '#8b5cf6', projectId: 'proj-1', createdAt: new Date(), updatedAt: new Date() },
  ]

  const currentUserId = '1' // Mock current user ID

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Project Tasks</h1>
      
      <TaskBoard
        projectId="proj-1"
        users={mockUsers}
        labels={mockLabels}
        currentUserId={currentUserId}
      />
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Filter Features:</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Use the search bar to find tasks by title, description, or ID</li>
          <li>• Click the filter button to show advanced filters</li>
          <li>• Apply filters by status, priority, assignee, labels, or due date</li>
          <li>• Use quick filter presets like "My Tasks" or "Due Today"</li>
          <li>• All filters are persisted in the URL for sharing</li>
          <li>• Clear individual filters or all at once</li>
          <li>• See the count of active filters on the filter button</li>
        </ul>
      </div>
    </div>
  )
}