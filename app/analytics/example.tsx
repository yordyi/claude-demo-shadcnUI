// Example of how to integrate the Analytics Dashboard into your application

import { AnalyticsDashboard } from "@/components/analytics";

// You can use the analytics dashboard in different ways:

// 1. Full Dashboard Page
export function FullAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Project Management</h1>
        </div>
      </nav>
      <main className="container mx-auto py-6 px-4">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}

// 2. Dashboard as Part of a Layout
export function DashboardWithSidebar() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-muted/10 p-4">
        <nav className="space-y-2">
          <a href="/dashboard" className="block px-3 py-2 rounded hover:bg-accent">Dashboard</a>
          <a href="/analytics" className="block px-3 py-2 rounded bg-accent">Analytics</a>
          <a href="/projects" className="block px-3 py-2 rounded hover:bg-accent">Projects</a>
          <a href="/team" className="block px-3 py-2 rounded hover:bg-accent">Team</a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}

// 3. Individual Charts in Different Pages
import { TaskStatusChart, TaskPriorityChart } from "@/components/analytics";
import { generateTaskStatusData, generateTaskPriorityData } from "@/lib/analytics-utils";

export function ProjectDetailPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Project Alpha</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <TaskStatusChart data={generateTaskStatusData()} />
        <TaskPriorityChart data={generateTaskPriorityData()} />
      </div>
      
      {/* Other project details */}
    </div>
  );
}

// 4. Custom Analytics with Real Data
export function CustomAnalytics({ projectId }: { projectId: string }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch real data from your API
    fetch(`/api/projects/${projectId}/analytics`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [projectId]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="grid gap-4">
      <ProjectOverviewCard data={data.overview} />
      <TaskStatusChart data={data.taskStatus} />
      {/* Add more charts as needed */}
    </div>
  );
}