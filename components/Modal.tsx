'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="modal-title" className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none p-1" aria-label="Close modal">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
