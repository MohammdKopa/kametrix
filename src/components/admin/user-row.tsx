'use client';

import Link from 'next/link';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

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
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{user.email}</span>
          {user.name && (
            <span className="text-sm text-muted-foreground">{user.name}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-6 py-4">
        <Badge
          variant="outline"
          className={
            user.role === 'ADMIN'
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-muted text-muted-foreground border-border'
          }
        >
          {user.role}
        </Badge>
      </TableCell>
      <TableCell className="px-6 py-4 text-sm text-foreground">
        ${creditDollars}
      </TableCell>
      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
        {user._count.agents}
      </TableCell>
      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
        {user._count.calls}
      </TableCell>
      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
        {formattedDate}
      </TableCell>
      <TableCell className="px-6 py-4 text-right">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/users/${user.id}`}>
            <Eye className="w-4 h-4" />
            <span className="sr-only">View user</span>
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
