'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import type { Agent, PhoneNumber } from '@/generated/prisma/client';

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
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {agent.name}
            </h3>
            {agent.phoneNumber ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-base font-medium text-blue-600">
                  {formatPhoneNumber(agent.phoneNumber.number)}
                </span>
                <button
                  onClick={handleCopyPhone}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy phone number"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1">No phone assigned</p>
            )}
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              agent.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {agent.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Business Info */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">{agent.businessName}</p>
          {agent.businessDescription && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {agent.businessDescription}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              agent.isActive ? 'bg-blue-600' : 'bg-gray-200'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                agent.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          <span className="text-sm text-gray-600">
            {isToggling ? 'Updating...' : agent.isActive ? 'Active' : 'Inactive'}
          </span>

          <div className="flex-1" />

          {/* Edit Button */}
          <Link
            href={`/dashboard/agents/${agent.id}/edit`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Edit
          </Link>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Agent
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{agent.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
