import { Suspense } from 'react';
import { MonitoringDashboard } from '@/components/admin/monitoring-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function MonitoringPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">System Monitoring</h1>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        }
      >
        <MonitoringDashboard />
      </Suspense>
    </div>
  );
}
