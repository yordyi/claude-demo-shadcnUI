import { addDays, subDays, format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface TaskStatusData {
  name: string;
  value: number;
  fill: string;
}

export interface TaskPriorityData {
  priority: string;
  count: number;
  fill: string;
}

export interface ProductivityData {
  date: string;
  completed: number;
  created: number;
}

export interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
  remaining: number;
}

export interface TeamWorkloadData {
  name: string;
  completed: number;
  inProgress: number;
  todo: number;
}

// Mock data generators
export function generateMockTaskAnalytics(): TaskAnalytics {
  const totalTasks = 150;
  const completedTasks = 87;
  const inProgressTasks = 35;
  const todoTasks = 28;
  const overdueTasks = 12;
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    overdueTasks,
    completionRate: Math.round((completedTasks / totalTasks) * 100),
  };
}

export function generateTaskStatusData(): TaskStatusData[] {
  return [
    { name: 'Completed', value: 87, fill: 'hsl(var(--chart-1))' },
    { name: 'In Progress', value: 35, fill: 'hsl(var(--chart-2))' },
    { name: 'To Do', value: 28, fill: 'hsl(var(--chart-3))' },
  ];
}

export function generateTaskPriorityData(): TaskPriorityData[] {
  return [
    { priority: 'Critical', count: 8, fill: 'hsl(var(--destructive))' },
    { priority: 'High', count: 25, fill: 'hsl(var(--chart-1))' },
    { priority: 'Medium', count: 45, fill: 'hsl(var(--chart-2))' },
    { priority: 'Low', count: 72, fill: 'hsl(var(--chart-3))' },
  ];
}

export function generateProductivityData(days: number = 30): ProductivityData[] {
  const data: ProductivityData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, 'MMM dd'),
      completed: Math.floor(Math.random() * 15) + 5,
      created: Math.floor(Math.random() * 20) + 3,
    });
  }
  
  return data;
}

export function generateBurndownData(sprintDays: number = 14): BurndownData[] {
  const data: BurndownData[] = [];
  const totalPoints = 100;
  const today = new Date();
  const sprintStart = subDays(today, sprintDays);
  
  let remainingPoints = totalPoints;
  
  for (let i = 0; i <= sprintDays; i++) {
    const date = addDays(sprintStart, i);
    const ideal = totalPoints - (totalPoints / sprintDays) * i;
    
    // Simulate some variance in actual progress
    if (i > 0 && i <= 10) {
      remainingPoints -= Math.floor(Math.random() * 12) + 3;
      remainingPoints = Math.max(0, remainingPoints);
    }
    
    data.push({
      date: format(date, 'MMM dd'),
      ideal: Math.round(ideal),
      actual: i <= 10 ? remainingPoints : remainingPoints,
      remaining: remainingPoints,
    });
  }
  
  return data;
}

export function generateTeamWorkloadData(): TeamWorkloadData[] {
  const teamMembers = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Emma Davis'];
  
  return teamMembers.map(name => ({
    name: name.split(' ')[0], // Use first name only for chart
    completed: Math.floor(Math.random() * 20) + 5,
    inProgress: Math.floor(Math.random() * 10) + 2,
    todo: Math.floor(Math.random() * 15) + 3,
  }));
}

// Date range utilities
export function getDateRangePresets() {
  const today = new Date();
  
  return {
    today: {
      label: 'Today',
      from: today,
      to: today,
    },
    last7Days: {
      label: 'Last 7 days',
      from: subDays(today, 6),
      to: today,
    },
    last30Days: {
      label: 'Last 30 days',
      from: subDays(today, 29),
      to: today,
    },
    thisWeek: {
      label: 'This week',
      from: startOfWeek(today),
      to: endOfWeek(today),
    },
    lastMonth: {
      label: 'Last month',
      from: subDays(today, 30),
      to: today,
    },
  };
}

// Chart color utilities
export function getChartColors() {
  return {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(38 92% 50%)',
    danger: 'hsl(var(--destructive))',
    info: 'hsl(199 89% 48%)',
    chart1: 'hsl(var(--chart-1))',
    chart2: 'hsl(var(--chart-2))',
    chart3: 'hsl(var(--chart-3))',
    chart4: 'hsl(var(--chart-4))',
    chart5: 'hsl(var(--chart-5))',
  };
}