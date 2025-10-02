import React, { useState } from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';
import { BOWLING_CENTERS, getCenterUrls, DEFAULT_CENTER } from '../centerConfig';

export default function TopBowlers({ isOpen, onClose }) {
  const [selectedCenter, setSelectedCenter] = useState(DEFAULT_CENTER.id);

  if (!isOpen) return null;

  const centerUrls = getCenterUrls(selectedCenter);
  const currentCenter = BOWLING_CENTERS.find(c => c.id === selectedCenter);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col"
        style={{
          background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59))',
          border: '2px solid rgb(251, 191, 36)',
          boxShadow: '0 25px 50px -12px rgba(251, 191, 36, 0.3)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 md:p-6 flex justify-between items-center flex-shrink-0"
          style={{
            background: 'linear-gradient(to right, rgb(217, 119, 6), rgb(180, 83, 9))',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
          }}
        >
          <div className="flex items-center gap-3">
            <Trophy size={28} style={{ color: 'rgb(255, 255, 255)' }} />
            <div>
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'rgb(255, 255, 255)' }}>
                Top Bowlers
              </h2>
              <p className="text-xs md:text-sm" style={{ color: 'rgb(254, 243, 199)' }}>
                Weekly Leaderboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm md:text-base font-semibold"
            style={{ backgroundColor: 'rgb(30, 41, 59)', color: 'rgb(255, 255, 255)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(51, 65, 85)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgb(30, 41, 59)')}
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Games</span>
          </button>
        </div>

        {/* Center Selection */}
        <div
          className="p-4 md:p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid rgb(51, 65, 85)' }}
        >
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: 'rgb(148, 163, 184)' }}
          >
            Select Bowling Center
          </label>
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="w-full px-4 py-3 rounded-lg focus:outline-none"
            style={{
              backgroundColor: 'rgb(30, 41, 59)',
              border: '1px solid rgb(71, 85, 105)',
              color: 'rgb(255, 255, 255)',
            }}
          >
            {BOWLING_CENTERS.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>

        {/* Leaderboard Link */}
        <div className="p-6 flex-1">
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgb(51, 65, 85)' }}>
            <Trophy size={80} className="mx-auto mb-6" style={{ color: 'rgb(251, 191, 36)' }} />
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'rgb(255, 255, 255)' }}>
              View {currentCenter?.name} Leaderboard
            </h3>
            <p className="mb-8 text-lg" style={{ color: 'rgb(148, 163, 184)' }}>
              Click below to view the weekly top bowlers on Lanetalk Live Scoring
            </p>
            <a
              href={centerUrls.scores}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 font-bold rounded-lg transition text-lg"
              style={{ background: 'linear-gradient(to right, rgb(217, 119, 6), rgb(180, 83, 9))', color: 'rgb(255, 255, 255)', boxShadow: '0 10px 15px -3px rgba(217, 119, 6, 0.5)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(180, 83, 9), rgb(146, 64, 14))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(217, 119, 6), rgb(180, 83, 9))'}
            >
              <Trophy size={24} />
              View Top Bowlers
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
