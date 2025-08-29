
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import apiFetch from '@/lib/api';
import { compressImage } from '@/lib/image';

export default function EditProfilePage() {
  const { currentUser, token, updateCurrentUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [mantra, setMantra] = useState('');
  const [bioPhoto, setBioPhoto] = useState<string | null>(null); // Base64
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setMantra(currentUser.mantra);
      setBioPhoto(currentUser.bioPhoto);
    }
  }, [currentUser]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      try {
        const compressedDataUrl = await compressImage({
          file,
          maxWidth: 300,
          maxHeight: 300,
          quality: 0.7,
        });
        setBioPhoto(compressedDataUrl);
      } catch (err) {
        console.error("Image compression failed:", err);
        setError("Failed to process image. Please try another file.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser || !token) return;

    setIsLoading(true);

    try {
      const updatedUserData = {
        username,
        mantra,
        bioPhoto: bioPhoto || currentUser.bioPhoto,
      };
      const updatedUser = await apiFetch(`/users/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedUserData),
        token
      });
      updateCurrentUser(updatedUser); // Update auth context as well
      alert('Profile updated successfully!');
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700">Please log in to edit your profile.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-brand-dark mb-6">Edit Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-md">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
          <div className="mt-2 flex items-center space-x-4">
            {bioPhoto &&
              <Image
                src={bioPhoto}
                alt="Bio photo preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                width={96}
                height={96}
              />
            }
            <label htmlFor="photo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
              <span>Change</span>
              <input id="photo-upload" name="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 block w-full" />
        </div>

        <div>
          <label htmlFor="mantra" className="block text-sm font-medium text-gray-700">Mantra</label>
          <textarea id="mantra" value={mantra} onChange={e => setMantra(e.target.value)} rows={2} maxLength={128} required className="mt-1 block w-full"></textarea>
        </div>

        <div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
