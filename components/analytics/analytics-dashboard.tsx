"use client";

import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectOverviewCard } from "./project-overview-card";
import { TaskStatusChart } from "./task-status-chart";
import { TaskPriorityChart } from "./task-priority-chart";
import { TeamProductivityChart } from "./team-productivity-chart";
import { BurndownChart } from "./burndown-chart";
import { TaskDistributionChart } from "./task-distribution-chart";
import { DateRangeSelector } from "./date-range-selector";
import {
  generateMockTaskAnalytics,
  generateTaskStatusData,
  generateTaskPriorityData,
  generateProductivityData,
  generateBurndownData,
  generateTeamWorkloadData,
} from "@/lib/analytics-utils";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  // Analytics data state
  const [taskAnalytics, setTaskAnalytics] = useState(generateMockTaskAnalytics());
  const [taskStatusData, setTaskStatusData] = useState(generateTaskStatusData());
  const [taskPriorityData, setTaskPriorityData] = useState(generateTaskPriorityData());
  const [productivityData, setProductivityData] = useState(generateProductivityData(30));
  const [burndownData, setBurndownData] = useState(generateBurndownData(14));
  const [teamWorkloadData, setTeamWorkloadData] = useState(generateTeamWorkloadData());

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle date range change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      // Calculate days between dates
      const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      setProductivityData(generateProductivityData(days));
    }
  }, [dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Regenerate all data
    setTaskAnalytics(generateMockTaskAnalytics());
    setTaskStatusData(generateTaskStatusData());
    setTaskPriorityData(generateTaskPriorityData());
    setProductivityData(generateProductivityData(30));
    setBurndownData(generateBurndownData(14));
    setTeamWorkloadData(generateTeamWorkloadData());
    
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track project performance and team productivity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh data"
          >
            <RefreshCwIcon className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <ProjectOverviewCard data={taskAnalytics} loading={loading || refreshing} />

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <TaskStatusChart data={taskStatusData} loading={loading || refreshing} />
            <TaskPriorityChart data={taskPriorityData} loading={loading || refreshing} />
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid gap-4 grid-cols-1">
            <TeamProductivityChart data={productivityData} loading={loading || refreshing} />
            <BurndownChart data={burndownData} loading={loading || refreshing} />
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TaskDistributionChart data={teamWorkloadData} loading={loading || refreshing} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}