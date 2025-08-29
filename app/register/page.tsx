'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mantra, setMantra] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    
    setIsLoading(true);

    try {
        await register({ username, password, mantra });
        router.push('/');
    } catch(err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-brand-dark mb-6 text-center">Join Tripvaler</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="mt-1 block w-full"
            />
          </div>
           <div>
            <label htmlFor="mantra" className="block text-sm font-medium text-gray-700">Your Mantra or Bio</label>
            <input 
              type="text" 
              id="mantra" 
              value={mantra}
              onChange={(e) => setMantra(e.target.value)}
              maxLength={128}
              required 
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
              {isLoading ? 'Creating account...' : 'Register'}
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-primary hover:text-brand-dark">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};
