'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Loader2,
  Filter,
  X,
  Download,
  FileJson,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  Users,
  Bot,
  Phone,
  Settings,
  FileCheck,
  Clock,
} from 'lucide-react';

type AdminAction =
  | 'USER_UPDATE'
  | 'USER_ROLE_CHANGE'
  | 'USER_STATUS_CHANGE'
  | 'USER_PASSWORD_RESET'
  | 'USER_CREDIT_ADJUST'
  | 'USER_DELETE'
  | 'BULK_STATUS_CHANGE'
  | 'BULK_ROLE_CHANGE'
  | 'BULK_DELETE'
  | 'AGENT_CREATE'
  | 'AGENT_UPDATE'
  | 'AGENT_DELETE'
  | 'AGENT_TOGGLE_STATUS'
  | 'PHONE_ASSIGN'
  | 'PHONE_RELEASE'
  | 'PHONE_SYNC'
  | 'SETTINGS_UPDATE'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'ACCESS_DENIED'
  | 'AUDIT_EXPORT'
  | 'COMPLIANCE_REPORT';

type ActionCategory =
  | 'user_management'
  | 'agent_operations'
  | 'phone_management'
  | 'system_config'
  | 'access_security'
  | 'compliance';

interface AuditLog {
  id: string;
  action: AdminAction;
  category: ActionCategory;
  description: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    name: string | null;
  };
  targetUser: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

const ACTION_LABELS: Record<AdminAction, string> = {
  USER_UPDATE: 'User Updated',
  USER_ROLE_CHANGE: 'Role Changed',
  USER_STATUS_CHANGE: 'Status Changed',
  USER_PASSWORD_RESET: 'Password Reset',
  USER_CREDIT_ADJUST: 'Credits Adjusted',
  USER_DELETE: 'User Deleted',
  BULK_STATUS_CHANGE: 'Bulk Status Change',
  BULK_ROLE_CHANGE: 'Bulk Role Change',
  BULK_DELETE: 'Bulk Delete',
  AGENT_CREATE: 'Agent Created',
  AGENT_UPDATE: 'Agent Updated',
  AGENT_DELETE: 'Agent Deleted',
  AGENT_TOGGLE_STATUS: 'Agent Status Toggled',
  PHONE_ASSIGN: 'Phone Assigned',
  PHONE_RELEASE: 'Phone Released',
  PHONE_SYNC: 'Phone Numbers Synced',
  SETTINGS_UPDATE: 'Settings Updated',
  ADMIN_LOGIN: 'Admin Login',
  ADMIN_LOGOUT: 'Admin Logout',
  ACCESS_DENIED: 'Access Denied',
  AUDIT_EXPORT: 'Audit Logs Exported',
  COMPLIANCE_REPORT: 'Compliance Report Generated',
};

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  user_management: 'User Management',
  agent_operations: 'Agent Operations',
  phone_management: 'Phone Management',
  system_config: 'System Configuration',
  access_security: 'Access & Security',
  compliance: 'Compliance',
};

const CATEGORY_ICONS: Record<ActionCategory, React.ElementType> = {
  user_management: Users,
  agent_operations: Bot,
  phone_management: Phone,
  system_config: Settings,
  access_security: Shield,
  compliance: FileCheck,
};

const CATEGORY_COLORS: Record<ActionCategory, string> = {
  user_management: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  agent_operations: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  phone_management: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  system_config: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  access_security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  compliance: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ActionCategory | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.set('search', search);
      }
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }
      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format });

      if (search) {
        params.set('search', search);
      }
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }
      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export');
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `audit-logs.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh logs to show export audit entry
      fetchLogs();
    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const handleComplianceReport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format: 'json' });

      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }

      const response = await fetch(`/api/admin/audit-logs/compliance-report?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'compliance-report.json';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh logs to show report generation audit entry
      fetchLogs();
    } catch (error) {
      console.error('Compliance report error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate compliance report');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const hasActiveFilters = search || categoryFilter !== 'all' || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive audit trail of all administrative actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={exporting || loading}
          >
            <FileJson className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleComplianceReport}
            disabled={exporting || loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Compliance Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {(Object.keys(CATEGORY_LABELS) as ActionCategory[]).map((category) => {
          const Icon = CATEGORY_ICONS[category];
          const count = logs.filter((log) => log.category === category).length;
          return (
            <Card key={category} className="py-4">
              <CardContent className="p-0 px-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${CATEGORY_COLORS[category]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[category]}
                    </p>
                    <p className="text-lg font-semibold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search in description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => {
                    setCategoryFilter(v as ActionCategory | 'all');
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(Object.keys(CATEGORY_LABELS) as ActionCategory[]).map(
                      (category) => (
                        <SelectItem key={category} value={category}>
                          {CATEGORY_LABELS[category]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                {/* Start Date */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                    placeholder="Start Date"
                  />
                </div>

                {/* End Date */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                    placeholder="End Date"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" size="sm">
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setSearch('')}
              />
            </Badge>
          )}
          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {CATEGORY_LABELS[categoryFilter]}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setCategoryFilter('all')}
              />
            </Badge>
          )}
          {startDate && (
            <Badge variant="secondary" className="gap-1">
              From: {startDate}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setStartDate('')}
              />
            </Badge>
          )}
          {endDate && (
            <Badge variant="secondary" className="gap-1">
              To: {endDate}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setEndDate('')}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {logs.length} of {total} audit log entries
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Timestamp
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Action
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Admin
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Target
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                IP Address
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading audit logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const CategoryIcon = CATEGORY_ICONS[log.category];
                return (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDate(log.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                            CATEGORY_COLORS[log.category]
                          }`}
                        >
                          <CategoryIcon className="w-3 h-3" />
                          {ACTION_LABELS[log.action]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-sm text-foreground truncate max-w-[300px]">
                        {log.description}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-sm font-medium">{log.admin.email}</p>
                      {log.admin.name && (
                        <p className="text-xs text-muted-foreground">
                          {log.admin.name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {log.targetUser ? (
                        <>
                          <p className="text-sm font-medium">
                            {log.targetUser.email}
                          </p>
                          {log.targetUser.name && (
                            <p className="text-xs text-muted-foreground">
                              {log.targetUser.name}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm text-muted-foreground font-mono">
                        {log.ipAddress || '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && (
                <>
                  {(() => {
                    const Icon = CATEGORY_ICONS[selectedLog.category];
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                          CATEGORY_COLORS[selectedLog.category]
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {ACTION_LABELS[selectedLog.action]}
                      </span>
                    );
                  })()}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-sm">{selectedLog.description}</p>
              </div>

              {/* Admin Info */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Performed By
                </h4>
                <p className="text-sm">
                  {selectedLog.admin.name || 'Unknown'} ({selectedLog.admin.email}
                  )
                </p>
              </div>

              {/* Target User */}
              {selectedLog.targetUser && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Target User
                  </h4>
                  <p className="text-sm">
                    {selectedLog.targetUser.name || 'Unknown'} (
                    {selectedLog.targetUser.email})
                  </p>
                </div>
              )}

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    IP Address
                  </h4>
                  <p className="text-sm font-mono">
                    {selectedLog.ipAddress || 'Unknown'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    User Agent
                  </h4>
                  <p className="text-sm font-mono text-xs truncate">
                    {selectedLog.userAgent || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Previous Value */}
              {selectedLog.previousValue && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Previous Value
                  </h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.previousValue, null, 2)}
                  </pre>
                </div>
              )}

              {/* New Value */}
              {selectedLog.newValue && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    New Value
                  </h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Additional Metadata
                  </h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
