'use client';

import { LogOut, Shield } from 'lucide-react';
import Link from 'next/link';
import type { AuthUser } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  user: AuthUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="flex items-center gap-2">
      {/* Admin Badge - visible indicator for admin users */}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 hover:border-primary/30 transition-all duration-150"
          title="Go to Admin Panel"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-3 px-3 py-2 h-auto rounded-lg border border-border hover:bg-muted/50 hover:border-border/80 transition-all duration-150"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold text-primary-foreground shadow-sm">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-foreground">
                {user.name || user.email}
              </div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass">
          <DropdownMenuLabel>
            <p className="text-sm font-medium text-foreground">{user.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role === 'ADMIN' && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/admin" className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Admin Panel</span>
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded">
                    Admin
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
            <LogOut className="w-4 h-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
