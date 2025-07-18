"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ProjectOverviewCard,
  TaskStatusChart,
  TaskPriorityChart,
  TeamProductivityChart,
  BurndownChart,
  TaskDistributionChart,
} from "@/components/analytics";
import {
  generateMockTaskAnalytics,
  generateTaskStatusData,
  generateTaskPriorityData,
  generateProductivityData,
  generateBurndownData,
  generateTeamWorkloadData,
} from "@/lib/analytics-utils";

export default function AnalyticsDemo() {
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Analytics Components Demo</h1>
        <p className="text-muted-foreground">
          Individual chart components with loading states and interactions
        </p>
        <Button onClick={simulateLoading} variant="outline">
          Simulate Loading State
        </Button>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Project Overview Cards</h2>
          <ProjectOverviewCard
            data={generateMockTaskAnalytics()}
            loading={loading}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Task Status Chart</h2>
          <div className="max-w-2xl">
            <TaskStatusChart
              data={generateTaskStatusData()}
              loading={loading}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Task Priority Chart</h2>
          <div className="max-w-2xl">
            <TaskPriorityChart
              data={generateTaskPriorityData()}
              loading={loading}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Team Productivity Chart</h2>
          <TeamProductivityChart
            data={generateProductivityData(30)}
            loading={loading}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Sprint Burndown Chart</h2>
          <BurndownChart
            data={generateBurndownData(14)}
            loading={loading}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Team Workload Distribution</h2>
          <TaskDistributionChart
            data={generateTeamWorkloadData()}
            loading={loading}
          />
        </section>
      </div>
    </div>
  );
}