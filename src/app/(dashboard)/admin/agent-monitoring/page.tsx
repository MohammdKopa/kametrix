import { Suspense } from 'react';
import { AgentMonitoringDashboard } from '@/components/admin/agent-monitoring-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function AgentMonitoringPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring dashboard for all agents with health metrics, activity logs, and control capabilities
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Overview Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="glass-card animate-pulse">
                  <CardHeader>
                    <CardTitle className="text-lg h-5 bg-muted rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Agent List Skeleton */}
            <Card className="glass-card animate-pulse">
              <CardHeader>
                <CardTitle className="text-lg h-5 bg-muted rounded w-1/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-muted" />
                        <div className="flex-1">
                          <div className="h-5 bg-muted rounded w-1/4 mb-2" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <AgentMonitoringDashboard />
      </Suspense>
    </div>
  );
}
