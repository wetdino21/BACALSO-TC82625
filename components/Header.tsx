'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { PlaneIcon } from './icons/PlaneIcon';
import { FiUser } from "react-icons/fi";

export const Header: React.FC = () => {
  const { currentUser, logout, isAuthLoading } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinkClasses = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === href
      ? 'bg-brand-secondary text-white'
      : 'text-gray-700 hover:bg-brand-light hover:text-brand-dark'
    }`;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 text-brand-dark font-bold text-xl">
              <PlaneIcon className="h-8 w-8 text-brand-primary" />
              Tripvaler
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className={navLinkClasses('/')}>
                  Discover Trips
                </Link>
                {currentUser && (
                  <>
                    <Link href="/my-trips" className={navLinkClasses('/my-trips')}>
                      My Trips
                    </Link>
                    <Link href="/create" className={navLinkClasses('/create')}>
                      Create Trip
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            {isAuthLoading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded-md"></div>
            ) : currentUser ? (
              <div className="ml-4 flex items-center md:ml-6 relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center p-1 bg-white rounded-full text-gray-400 hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                  <span className="sr-only">View profile</span>
                  {currentUser?.bioPhoto ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={currentUser.bioPhoto}
                      alt="User avatar"
                    />
                  ) : (
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                      {currentUser?.username?.charAt(0).toUpperCase() ?? <FiUser className="w-5 h-5" />}
                    </div>
                  )}
                </button>
                {isDropdownOpen && (
                  <div className="origin-top-right absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onError={() => setIsDropdownOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand-dark">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-dark transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
