'use client';

import Link from 'next/link';

interface UserRowProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
    creditBalance: number;
    createdAt: string;
    _count: {
      agents: number;
      calls: number;
    };
  };
}

export function UserRow({ user }: UserRowProps) {
  const formattedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Convert cents to dollars for display
  const creditDollars = (user.creditBalance / 100).toFixed(2);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{user.email}</span>
          {user.name && (
            <span className="text-sm text-gray-500">{user.name}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.role === 'ADMIN'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${creditDollars}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user._count.agents}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user._count.calls}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          href={`/admin/users/${user.id}`}
          className="text-gray-600 hover:text-gray-900"
        >
          View
        </Link>
      </td>
    </tr>
  );
}
