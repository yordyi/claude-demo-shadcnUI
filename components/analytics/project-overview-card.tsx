"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, ActivityIcon, CheckCircle2Icon, ClockIcon, AlertCircleIcon } from "lucide-react";
import { TaskAnalytics } from "@/lib/analytics-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectOverviewCardProps {
  data: TaskAnalytics;
  loading?: boolean;
}

export function ProjectOverviewCard({ data, loading }: ProjectOverviewCardProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Tasks",
      value: data.totalTasks,
      icon: ActivityIcon,
      description: "Active tasks in all projects",
      trend: null,
    },
    {
      title: "Completion Rate",
      value: `${data.completionRate}%`,
      icon: CheckCircle2Icon,
      description: `${data.completedTasks} tasks completed`,
      trend: data.completionRate > 70 ? "up" : "down",
      trendValue: `${data.completionRate > 70 ? "+" : ""}${(data.completionRate - 70).toFixed(1)}%`,
    },
    {
      title: "In Progress",
      value: data.inProgressTasks,
      icon: ClockIcon,
      description: "Tasks being worked on",
      trend: null,
    },
    {
      title: "Overdue Tasks",
      value: data.overdueTasks,
      icon: AlertCircleIcon,
      description: "Requires immediate attention",
      trend: data.overdueTasks > 0 ? "down" : null,
      isAlert: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className={metric.isAlert && metric.value > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.isAlert && metric.value > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
              {metric.trend && (
                <div className="flex items-center text-xs mt-1">
                  {metric.trend === "up" ? (
                    <ArrowUpIcon className="h-3 w-3 text-green-600 dark:text-green-400 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 text-red-600 dark:text-red-400 mr-1" />
                  )}
                  <span className={metric.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                    {metric.trendValue} from target
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}