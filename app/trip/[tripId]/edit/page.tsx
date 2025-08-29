'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import type { Trip } from '@/lib/types';
import apiFetch from '@/lib/api';
import { compressImage } from '@/lib/image';
import dynamic from 'next/dynamic';

// Dynamically import the map component with no SSR
const DynamicMap = dynamic(() => import('@/components/TripMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-md bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  )
});

const fetcher = (url: string) => apiFetch(url);

export default function EditTripPage({ params }: { params: { tripId: string } }) {
  const { tripId } = params;
  const { currentUser, token } = useAuth();
  const router = useRouter();
  const tripUrl = `/trips/${tripId}`;

  const { data: trip, error, isLoading: isTripLoading } = useSWR<Trip>(tripUrl, fetcher);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    minParticipants: 2,
    maxParticipants: 4,
  });
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [hasImageChanged, setHasImageChanged] = useState(false); // Replace global variable
  const [isDragOver, setIsDragOver] = useState(false); // For drag feedback

  // New: Destination map state
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (trip) {
      setFormData({
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        startDate: trip.startDate.split('T')[0],
        endDate: trip.endDate.split('T')[0],
        minParticipants: trip.minParticipants,
        maxParticipants: trip.maxParticipants,
      });
      setCoverPhoto(trip.coverPhoto);
      setHasImageChanged(false); // Reset when trip loads
    }
  }, [trip]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // When destination changes, fetch coords from OSM (Nominatim)
  useEffect(() => {
    const fetchCoords = async () => {
      if (!formData.destination) return;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            formData.destination
          )}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        } else {
          setCoords(null);
        }
      } catch (err) {
        console.error('OSM fetch failed', err);
        setCoords(null);
      }
    };

    const delayDebounce = setTimeout(fetchCoords, 800); // debounce input
    return () => clearTimeout(delayDebounce);
  }, [formData.destination]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to process image files (used by both upload and drag & drop)
  const processImageFile = async (file: File) => {
    try {
      const compressedDataUrl = await compressImage({
        file,
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      });
      setCoverPhoto(compressedDataUrl);
      setHasImageChanged(true);
      setFormError(''); // Clear any previous errors
    } catch (err) {
      console.error("Image compression failed:", err);
      setFormError("Failed to process image. Please try another file.");
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      await processImageFile(event.target.files[0]);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormError('Please upload an image file (PNG, JPG, GIF).');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setFormError('File size must be less than 10MB.');
        return;
      }

      await processImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!trip || !token) return;

    // Validation
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot be before the start date.');
      return;
    }
    if (Number(formData.maxParticipants) < Number(formData.minParticipants)) {
      setFormError('Maximum participants cannot be less than minimum.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedTripData = {
        ...formData,
        coverPhoto: hasImageChanged ? coverPhoto : null, // Only send if changed
        minParticipants: Number(formData.minParticipants),
        maxParticipants: Number(formData.maxParticipants),
      };

      const updatedTrip = await apiFetch(tripUrl, {
        method: 'PUT',
        token,
        body: JSON.stringify(updatedTripData),
      });

      mutate(tripUrl, updatedTrip, false);
      alert('Trip updated successfully!');
      router.push(`/trip/${trip.id}`);
    } catch (err) {
      console.error("Error updating trip:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trip.';
      setFormError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = () => {
    setCoverPhoto(null);
    setHasImageChanged(true); // Mark as changed to send null to backend
  };

  if (isTripLoading) return <div className="text-center py-16">Loading trip editor...</div>
  if (error) return <div className="text-center py-16 text-red-500">Error: {error.message}</div>

  if (!trip || !trip.host || currentUser?.id !== trip.host.id) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
        <p className="text-gray-500 mt-2">You are not the host of this trip or the trip does not exist.</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-brand-dark mb-6">Edit Your Trip</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-md">{formError}</p>}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Trip Title</label>
          <input type="text" id="title" value={formData.title} onChange={handleInputChange} maxLength={128} required className="mt-1 block w-full" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Brief Description</label>
          <textarea id="description" value={formData.description} onChange={handleInputChange} rows={3} maxLength={255} required className="mt-1 block w-full"></textarea>
        </div>

        {/* Destination + Map */}
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
            Destination
          </label>
          <input
            type="text"
            id="destination"
            value={formData.destination}
            onChange={handleInputChange}
            placeholder="e.g. Cebu City, Philippines"
            required
            className="mt-1 block w-full"
          />
          {coords && (
            <div className="mt-4 h-64 w-full rounded-md overflow-hidden">
              {mounted && (
                <DynamicMap
                  center={[coords.lat, coords.lon]}
                  zoom={12}
                  destination={formData.destination}
                />
              )}
            </div>
          )}
        </div>
        {/* <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination</label>
          <input type="text" id="destination" value={formData.destination} onChange={handleInputChange} required className="mt-1 block w-full" />
        </div> */}

        <div>
          <label className="block text-sm font-medium text-gray-700">Cover Photo</label>
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isDragOver
              ? 'border-brand-primary bg-brand-primary bg-opacity-10'
              : 'border-gray-300 hover:border-gray-400'
              }`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center w-full">
              {coverPhoto ? (
                <div className="relative">
                  <Image
                    src={coverPhoto}
                    alt="Cover preview"
                    className="mx-auto h-32 w-auto object-contain"
                    width={200}
                    height={128}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="cover-photo"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary"
                >
                  <span>{coverPhoto ? 'Change file' : 'Upload a file'}</span>
                  <input
                    id="cover-photo"
                    name="cover-photo"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
              min={today}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              required
              min={formData.startDate || today}
              className="mt-1 block w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="minParticipants" className="block text-sm font-medium text-gray-700">Min Participants</label>
            <input type="number" id="minParticipants" value={formData.minParticipants} onChange={handleInputChange} min="1" required className="mt-1 block w-full" />
          </div>
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">Max Participants</label>
            <input type="number" id="maxParticipants" value={formData.maxParticipants} onChange={handleInputChange} min="1" required className="mt-1 block w-full" />
          </div>
        </div>

        <div>
          <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};


// 'use client';

// import React, { useState, useEffect } from 'react';
// import Image from 'next/image';
// import { useAuth } from '@/hooks/useAuth';
// import { useRouter } from 'next/navigation';
// import useSWR, { mutate } from 'swr';
// import type { Trip } from '@/lib/types';
// import apiFetch from '@/lib/api';
// import { compressImage } from '@/lib/image';

// const fetcher = (url: string) => apiFetch(url);
// var setImgUpload = false;


// export default function EditTripPage({ params }: { params: { tripId: string } }) {
//   const { tripId } = params;
//   const { currentUser, token } = useAuth();
//   const router = useRouter();
//   const tripUrl = `/trips/${tripId}`;

//   const { data: trip, error, isLoading: isTripLoading } = useSWR<Trip>(tripUrl, fetcher);

//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     destination: '',
//     startDate: '',
//     endDate: '',
//     minParticipants: 2,
//     maxParticipants: 4,
//   });
//   const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [formError, setFormError] = useState('');

//   useEffect(() => {
//     if (trip) {
//       setFormData({
//         title: trip.title,
//         description: trip.description,
//         destination: trip.destination,
//         startDate: trip.startDate.split('T')[0], // Format date for input
//         endDate: trip.endDate.split('T')[0],     // Format date for input
//         minParticipants: trip.minParticipants,
//         maxParticipants: trip.maxParticipants,
//       });
//       setCoverPhoto(trip.coverPhoto);

//     }
//   }, [trip]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { id, value } = e.target;
//     setFormData(prev => ({ ...prev, [id]: value }));
//   };

//   const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files[0]) {
//       const file = event.target.files[0];
//       try {
//         const compressedDataUrl = await compressImage({
//           file,
//           maxWidth: 1200,
//           maxHeight: 1200,
//           quality: 0.8,
//         });
//         setCoverPhoto(compressedDataUrl);
//         setImgUpload = true
//       } catch (err) {
//         console.error("Image compression failed:", err);
//         setFormError("Failed to process image. Please try another file.");
//       }
//     }
//   };


//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setFormError('');
//     if (!trip || !token) return;

//     setIsSubmitting(true);
//     try {
//       // DEBUG: log the coverPhoto value


//       const updatedTripData = {
//         ...formData,
//         coverPhoto: setImgUpload ? coverPhoto : null,
//         minParticipants: Number(formData.minParticipants),
//         maxParticipants: Number(formData.maxParticipants),
//       };

//       const updatedTrip = await apiFetch(tripUrl, {
//         method: 'PUT',
//         token,
//         body: JSON.stringify(updatedTripData),
//       });

//       mutate(tripUrl, updatedTrip, false);
//       alert('Trip updated successfully!');
//       router.push(`/trip/${trip.id}`);
//     } catch (err) {
//       console.error("Error sending trip update:", coverPhoto); // debug current image
//       const errorMessage = err instanceof Error ? err.message : 'Failed to update trip.';
//       setFormError(errorMessage);
//       alert(`Error: ${errorMessage}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


//   if (isTripLoading) return <div className="text-center py-16">Loading trip editor...</div>
//   if (error) return <div className="text-center py-16 text-red-500">Error: {error.message}</div>

//   if (!trip || !trip.host || currentUser?.id !== trip.host.id) {
//     return (
//       <div className="text-center py-16">
//         <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
//         <p className="text-gray-500 mt-2">You are not the host of this trip or the trip does not exist.</p>
//       </div>
//     );
//   }

//   const today = new Date().toISOString().split('T')[0];

//   return (
//     <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
//       <h1 className="text-3xl font-bold text-brand-dark mb-6">Edit Your Trip</h1>
//       <form onSubmit={handleSubmit} className="space-y-6">
//         {formError && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-md">{formError}</p>}
//         <div>
//           <label htmlFor="title" className="block text-sm font-medium text-gray-700">Trip Title</label>
//           <input type="text" id="title" value={formData.title} onChange={handleInputChange} maxLength={128} required className="mt-1 block w-full" />
//         </div>

//         <div>
//           <label htmlFor="description" className="block text-sm font-medium text-gray-700">Brief Description</label>
//           <textarea id="description" value={formData.description} onChange={handleInputChange} rows={3} maxLength={255} required className="mt-1 block w-full"></textarea>
//         </div>

//         <div>
//           <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination</label>
//           <input type="text" id="destination" value={formData.destination} onChange={handleInputChange} required className="mt-1 block w-full" />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700">Cover Photo</label>
//           <div
//             className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
//             onDragOver={(e) => e.preventDefault()} // Allow drop
//             onDrop={async (e) => {
//               e.preventDefault();
//               if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
//               const file = e.dataTransfer.files[0];

//               // Call your existing compress/upload function
//               try {
//                 const compressedDataUrl = await compressImage({
//                   file,
//                   maxWidth: 1200,
//                   maxHeight: 1200,
//                   quality: 0.8,
//                 });
//                 setCoverPhoto(compressedDataUrl);
//                 setImgUpload = true;
//               } catch (err) {
//                 console.error("Image compression failed:", err);
//                 setFormError("Failed to process image. Please try another file.");
//               }
//             }}
//           >
//             <div className="space-y-1 text-center w-full">
//               {coverPhoto ? (
//                 <Image
//                   src={coverPhoto}
//                   alt="Cover preview"
//                   className="mx-auto h-32 w-auto object-contain"
//                   width={200}
//                   height={128}
//                 />
//               ) : (
//                 <svg
//                   className="mx-auto h-12 w-12 text-gray-400"
//                   stroke="currentColor"
//                   fill="none"
//                   viewBox="0 0 48 48"
//                   aria-hidden="true"
//                 >
//                   <path
//                     d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//               )}

//               <div className="flex text-sm text-gray-600 justify-center">
//                 <label
//                   htmlFor="cover-photo"
//                   className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary"
//                 >
//                   <span>Change file</span>
//                   <input
//                     id="cover-photo"
//                     name="cover-photo"
//                     type="file"
//                     className="sr-only"
//                     accept="image/*"
//                     onChange={handlePhotoUpload}
//                   />
//                 </label>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//           <div>
//             <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
//             <input
//               type="date"
//               id="startDate"
//               value={formData.startDate}
//               onChange={handleInputChange}
//               required
//               min={today} // disable past dates
//               className="mt-1 block w-full"
//             />
//           </div>
//           <div>
//             <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
//             <input
//               type="date"
//               id="endDate"
//               value={formData.endDate}
//               onChange={handleInputChange}
//               required
//               min={formData.startDate || today} // end date >= start date
//               className="mt-1 block w-full"
//             />
//           </div>

//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label htmlFor="minParticipants" className="block text-sm font-medium text-gray-700">Min Participants</label>
//             <input type="number" id="minParticipants" value={formData.minParticipants} onChange={handleInputChange} min="1" required className="mt-1 block w-full" />
//           </div>
//           <div>
//             <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">Max Participants</label>
//             <input type="number" id="maxParticipants" value={formData.maxParticipants} onChange={handleInputChange} min="1" required className="mt-1 block w-full" />
//           </div>
//         </div>

//         <div>
//           <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
//             {isSubmitting ? 'Saving...' : 'Save Changes'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };
