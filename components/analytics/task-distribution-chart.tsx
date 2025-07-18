"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TeamWorkloadData } from "@/lib/analytics-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskDistributionChartProps {
  data: TeamWorkloadData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name}: <span className="font-medium" style={{ color: entry.color }}>{entry.value}</span>
          </p>
        ))}
        <div className="border-t mt-2 pt-2">
          <p className="text-sm font-medium">Total: {total} tasks</p>
        </div>
      </div>
    );
  }
  return null;
};

export function TaskDistributionChart({ data, loading }: TaskDistributionChartProps) {
  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Team Workload Distribution</CardTitle>
        <CardDescription>
          Task assignments across team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'Number of Tasks', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: "14px" }}
              />
              <Bar 
                dataKey="completed" 
                stackId="a" 
                fill="hsl(var(--chart-1))" 
                name="Completed"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="inProgress" 
                stackId="a" 
                fill="hsl(var(--chart-2))" 
                name="In Progress"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="todo" 
                stackId="a" 
                fill="hsl(var(--chart-3))" 
                name="To Do"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}