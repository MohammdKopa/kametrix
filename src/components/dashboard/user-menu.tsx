'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import type { AuthUser } from '@/types';

interface UserMenuProps {
  user: AuthUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150
          ${isOpen
            ? 'bg-gray-100 border-gray-300'
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }
        `}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.name || user.email}
          </div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
