'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { PlaneIcon } from './icons/PlaneIcon';
import { FiUser } from "react-icons/fi";
import { FiMenu, FiX } from "react-icons/fi";

export const Header: React.FC = () => {
  const { currentUser, logout, isAuthLoading } = useAuth();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinkClasses = (href: string) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href
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

          {/* LEFT SIDE: Mobile Menu + Logo */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="md:hidden mr-2">
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 text-brand-dark font-bold text-xl">
              <PlaneIcon className="h-8 w-8 text-brand-primary" />
              Tripvaler
            </Link>

            {/* Desktop Nav Links */}
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

          {/* RIGHT SIDE: Profile / Auth */}
          <div className="flex items-center">
            {isAuthLoading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded-md"></div>
            ) : currentUser ? (
              <div className="ml-4 relative" ref={dropdownRef}>
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

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 space-y-1 px-2 pb-3 pt-2 border-t border-gray-200">
            <Link href="/" className={navLinkClasses('/')} onClick={() => setIsMobileMenuOpen(false)}>
              Discover Trips
            </Link>
            {currentUser && (
              <>
                <Link href="/my-trips" className={navLinkClasses('/my-trips')} onClick={() => setIsMobileMenuOpen(false)}>
                  My Trips
                </Link>
                <Link href="/create" className={navLinkClasses('/create')} onClick={() => setIsMobileMenuOpen(false)}>
                  Create Trip
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};
