'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Copy, Check, Pencil, Trash2 } from 'lucide-react';
import type { Agent, PhoneNumber } from '@/generated/prisma/client';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AgentCardProps {
  agent: Agent & { phoneNumber: PhoneNumber | null };
}

/**
 * Format E.164 phone number to (XXX) XXX-XXXX
 */
function formatPhoneNumber(number: string): string {
  // Remove + prefix for US numbers
  const cleaned = number.replace(/^\+1/, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Return as-is if not a US number
  return number;
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !agent.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle agent');
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling agent:', error);
      alert('Failed to toggle agent status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyPhone = async () => {
    if (!agent.phoneNumber?.number) return;

    try {
      await navigator.clipboard.writeText(agent.phoneNumber.number);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy phone number:', error);
    }
  };

  return (
    <>
      <Card className="glass-card border-0 py-0 transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.55_0.25_300/0.15)]">
        <CardContent className="p-6 pb-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {agent.name}
              </h3>
              {agent.phoneNumber ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-base font-medium text-primary">
                    {formatPhoneNumber(agent.phoneNumber.number)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCopyPhone}
                    className="h-7 w-7"
                    title="Copy phone number"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  No phone assigned
                </p>
              )}
            </div>

            {/* Status Badge */}
            <Badge
              variant={agent.isActive ? 'default' : 'secondary'}
              className={
                agent.isActive
                  ? 'bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/30'
                  : ''
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  agent.isActive
                    ? 'bg-green-500 shadow-[0_0_6px_oklch(0.72_0.19_142)]'
                    : 'bg-muted-foreground'
                }`}
              />
              {agent.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Business Info */}
          <div>
            <p className="text-sm font-medium text-foreground">
              {agent.businessName}
            </p>
            {agent.businessDescription && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {agent.businessDescription}
              </p>
            )}
          </div>
        </CardContent>

        {/* Actions */}
        <CardFooter className="px-6 py-4 border-t border-border">
          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
              agent.isActive
                ? 'bg-primary'
                : 'bg-secondary-foreground/30 dark:bg-muted'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform shadow-sm ${
                agent.isActive ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white dark:bg-muted-foreground'
              }`}
            />
          </button>

          <span className="text-sm text-muted-foreground ml-3">
            {isToggling ? 'Updating...' : agent.isActive ? 'Active' : 'Inactive'}
          </span>

          <div className="flex-1" />

          {/* Edit Button */}
          <Button variant="ghost" size="icon-sm" asChild>
            <Link
              href={`/dashboard/agents/${agent.id}/edit`}
              title="Edit agent"
            >
              <Pencil className="w-4 h-4" />
            </Link>
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="hover:text-destructive"
            title="Delete agent"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="glass sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{agent.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
