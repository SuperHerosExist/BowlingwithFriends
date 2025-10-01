import React, { useState } from 'react';
import { Trophy, ExternalLink, X } from 'lucide-react';
import { BOWLING_CENTERS, getCenterUrls, DEFAULT_CENTER } from '../centerConfig';

export default function TopBowlers({ isOpen, onClose }) {
  const [selectedCenter, setSelectedCenter] = useState(DEFAULT_CENTER.id);

  if (!isOpen) return null;

  const centerUrls = getCenterUrls(selectedCenter);
  const currentCenter = BOWLING_CENTERS.find(c => c.id === selectedCenter);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 p-6 flex justify-between items-center border-b-2 border-amber-500">
          <div className="flex items-center gap-3">
            <Trophy size={32} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Top Bowlers</h2>
              <p className="text-amber-100 text-sm">Weekly Leaderboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-800 rounded-lg transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Center Selection */}
        <div className="p-6 border-b border-slate-700">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Select Bowling Center
          </label>
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            {BOWLING_CENTERS.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
            <Trophy size={64} className="text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              View {currentCenter?.name} Leaderboard
            </h3>
            <p className="text-slate-400 mb-6">
              Click below to view the weekly top bowlers on Lanetalk Live Scoring
            </p>

            <div className="flex flex-col gap-3">
              <a
                href={centerUrls.scores}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-lg transition shadow-lg"
              >
                <Trophy size={20} />
                View Top Bowlers
                <ExternalLink size={16} />
              </a>

              <a
                href={centerUrls.finished}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                View Finished Games
                <ExternalLink size={16} />
              </a>

              <a
                href={centerUrls.live}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
              >
                View Live Games
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> Leaderboard data is provided by Lanetalk Live Scoring.
              Rankings update automatically as games are completed at the bowling center.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
