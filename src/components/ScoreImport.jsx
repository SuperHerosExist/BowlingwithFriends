import React, { useState } from 'react';
import { Upload, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { BOWLING_CENTERS, getCenterUrls } from '../centerConfig';

export default function ScoreImport({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [selectedCenter, setSelectedCenter] = useState(BOWLING_CENTERS[0].id);

  if (!isOpen) return null;

  const centerUrls = getCenterUrls(selectedCenter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="text-white" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-white">Import Game Scores</h2>
              <p className="text-blue-100 text-sm">Add completed game results to your stats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Center Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Select Bowling Center
            </label>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {BOWLING_CENTERS.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <ExternalLink size={16} />
              How to View Your Scores
            </h3>
            <ol className="text-sm text-blue-300 space-y-2 ml-4 list-decimal">
              <li>Click "Open Lanetalk Scores" below to view your completed games</li>
              <li>Find your games in the "COMPLETED" tab</li>
              <li>View your scores and results</li>
            </ol>
          </div>

          {/* Open Lanetalk Button */}
          <a
            href={centerUrls.finished}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition shadow-lg text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <ExternalLink size={20} />
              Open Lanetalk Scores
            </div>
          </a>

          {/* Future Enhancement Note */}
          <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
            <p className="text-xs text-amber-300">
              <strong>Coming Soon:</strong> We're working on automatic score detection and import!
              For now, you can view your scores on Lanetalk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
