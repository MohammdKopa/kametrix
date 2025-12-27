import { AgentListAdmin } from '@/components/admin/agent-list-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAgentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">All Agents</h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground">Agent Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentListAdmin />
        </CardContent>
      </Card>
    </div>
  );
}
