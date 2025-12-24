import { AgentListAdmin } from '@/components/admin/agent-list-admin';

export default function AdminAgentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">All Agents</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <AgentListAdmin />
      </div>
    </div>
  );
}
