import React from 'react';
import { Upload, ArrowLeft, Clock } from 'lucide-react';

export default function ScoreImport({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative rounded-2xl max-w-lg w-full" style={{ background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59))', border: '2px solid rgb(51, 65, 85)', boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.3)' }}>
        {/* Header */}
        <div className="p-4 md:p-6 flex items-center justify-between" style={{ background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(139, 92, 246))' }}>
          <div className="flex items-center gap-3">
            <Upload size={24} className="md:hidden" style={{ color: 'rgb(255, 255, 255)' }} />
            <Upload size={28} className="hidden md:block" style={{ color: 'rgb(255, 255, 255)' }} />
            <div>
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'rgb(255, 255, 255)' }}>Import Game Scores</h2>
              <p className="text-xs md:text-sm" style={{ color: 'rgb(219, 234, 254)' }}>Add completed game results to your stats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm md:text-base font-semibold"
            style={{ backgroundColor: 'rgb(30, 41, 59)', color: 'rgb(255, 255, 255)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(51, 65, 85)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(30, 41, 59)'}
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Games</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 text-center">
          <div className="mb-6">
            <Clock size={80} className="mx-auto" style={{ color: 'rgb(251, 191, 36)' }} />
          </div>

          <h3 className="text-2xl font-bold mb-4" style={{ color: 'rgb(255, 255, 255)' }}>
            Coming Soon!
          </h3>

          <p className="text-lg mb-6" style={{ color: 'rgb(148, 163, 184)' }}>
            We're working on an exciting feature that will allow you to automatically import your bowling scores and track your progress over time.
          </p>

          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgb(59, 130, 246)' }}>
            <p className="text-sm" style={{ color: 'rgb(147, 197, 253)' }}>
              <strong>What's Coming:</strong>
            </p>
            <ul className="text-sm mt-2 space-y-1" style={{ color: 'rgb(148, 163, 184)' }}>
              <li>✓ Automatic score detection from Lanetalk</li>
              <li>✓ Historical game tracking</li>
              <li>✓ Performance analytics and trends</li>
              <li>✓ Personalized statistics dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
