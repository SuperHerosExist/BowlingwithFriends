import React, { useState } from 'react';
import { Upload, X, Trophy, Target, Crown, Link as LinkIcon, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { ref, get, set } from 'firebase/database';
import { database } from '../firebase';
import { BOWLING_CENTERS, getCenterUrls } from '../centerConfig';

export default function ScoreImport({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState('lanetalk'); // 'lanetalk' or 'manual'
  const [selectedCenter, setSelectedCenter] = useState(BOWLING_CENTERS[0].id);
  const [gameType, setGameType] = useState('matchPlay');
  const [score, setScore] = useState('');
  const [opponent, setOpponent] = useState('');
  const [result, setResult] = useState('win');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Lanetalk import states
  const [lanetalkGames, setLanetalkGames] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [fetchingGames, setFetchingGames] = useState(false);

  if (!isOpen) return null;

  const handleManualImport = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setMessage(null);

    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.exists() ? snapshot.val() : { stats: {} };

      // Initialize stats if needed
      if (!userData.stats) userData.stats = {};
      if (!userData.stats[gameType]) {
        userData.stats[gameType] = {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          totalPoints: 0,
        };
      }

      // Update stats based on game type
      const stats = userData.stats[gameType];
      stats.gamesPlayed += 1;

      if (result === 'win') {
        stats.wins += 1;
      } else {
        stats.losses += 1;
      }

      if (score) {
        stats.totalPoints += parseInt(score);
      }

      // Save updated stats
      await set(userRef, userData);

      setMessage({ type: 'success', text: 'Game score imported successfully!' });

      // Reset form
      setScore('');
      setOpponent('');
      setResult('win');

      // Close after 2 seconds
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 2000);

    } catch (error) {
      console.error('Error importing score:', error);
      setMessage({ type: 'error', text: 'Failed to import score. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLanetalkImport = async () => {
    if (selectedGames.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one game to import' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.exists() ? snapshot.val() : { stats: {} };

      if (!userData.stats) userData.stats = {};

      // Process each selected game
      for (const game of selectedGames) {
        if (!userData.stats[game.type]) {
          userData.stats[game.type] = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            totalPoints: 0,
          };
        }

        const stats = userData.stats[game.type];
        stats.gamesPlayed += 1;
        stats.totalPoints += game.score;

        if (game.won) {
          stats.wins += 1;
        } else {
          stats.losses += 1;
        }
      }

      await set(userRef, userData);

      setMessage({ type: 'success', text: `${selectedGames.length} game(s) imported successfully!` });
      setSelectedGames([]);
      setLanetalkGames([]);

      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 2000);

    } catch (error) {
      console.error('Error importing games:', error);
      setMessage({ type: 'error', text: 'Failed to import games. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleGameSelection = (gameId) => {
    setSelectedGames(prev => {
      if (prev.find(g => g.id === gameId)) {
        return prev.filter(g => g.id !== gameId);
      } else {
        const game = lanetalkGames.find(g => g.id === gameId);
        return [...prev, game];
      }
    });
  };

  const gameTypeOptions = [
    { value: 'matchPlay', label: 'Match Play', icon: Trophy },
    { value: 'kingOfTheHill', label: 'King of the Hill', icon: Crown },
    { value: 'bracketPlay', label: 'Bracket Play', icon: Target },
  ];

  const centerUrls = getCenterUrls(selectedCenter);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-blue-500 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex justify-between items-center border-b-2 border-blue-500 rounded-t-xl">
          <div className="flex items-center gap-3">
            <Upload size={28} className="text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Import Game Scores</h2>
              <p className="text-blue-100 text-sm">Add completed game results to your stats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-lg transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800/50">
          <button
            onClick={() => setMode('lanetalk')}
            className={`flex-1 px-6 py-4 font-semibold transition flex items-center justify-center gap-2 ${
              mode === 'lanetalk'
                ? 'bg-slate-900 text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <LinkIcon size={18} />
            From Lanetalk
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 px-6 py-4 font-semibold transition flex items-center justify-center gap-2 ${
              mode === 'manual'
                ? 'bg-slate-900 text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <FileText size={18} />
            Manual Entry
          </button>
        </div>

        {/* Lanetalk Mode */}
        {mode === 'lanetalk' && (
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
                How to Import from Lanetalk
              </h3>
              <ol className="text-sm text-blue-300 space-y-2 ml-4 list-decimal">
                <li>Click "Open Lanetalk Scores" below to view your completed games</li>
                <li>Find your games in the "COMPLETED" tab</li>
                <li>Note your scores and results</li>
                <li>Return here and use "Manual Entry" to add each game</li>
              </ol>
            </div>

            {/* Open Lanetalk Button */}
            <a
              href={centerUrls.finished}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <ExternalLink size={20} />
              Open Lanetalk Scores
            </a>

            {/* Future Enhancement Note */}
            <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
              <p className="text-xs text-amber-300">
                <strong>Coming Soon:</strong> We're working on automatic score detection!
                For now, please use the Manual Entry tab to add your games after viewing them on Lanetalk.
              </p>
            </div>
          </div>
        )}

        {/* Manual Entry Mode */}
        {mode === 'manual' && (
          <form onSubmit={handleManualImport} className="p-6 space-y-4">
            {/* Game Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Game Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {gameTypeOptions.map((option) => {
                  const OptionIcon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGameType(option.value)}
                      className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                        gameType === option.value
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <OptionIcon size={20} />
                      <span className="text-xs font-semibold text-center">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opponent Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Opponent Name (Optional)
              </label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Enter opponent's name"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Score */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Your Score/Points
              </label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Enter your total score (e.g., 775)"
                required
                min="0"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Result */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Result
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResult('win')}
                  className={`py-3 rounded-lg border-2 font-semibold transition ${
                    result === 'win'
                      ? 'bg-green-600 border-green-400 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  Win
                </button>
                <button
                  type="button"
                  onClick={() => setResult('loss')}
                  className={`py-3 rounded-lg border-2 font-semibold transition ${
                    result === 'loss'
                      ? 'bg-red-600 border-red-400 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  Loss
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-lg border ${
                  message.type === 'success'
                    ? 'bg-green-900/30 border-green-600 text-green-300'
                    : 'bg-red-900/30 border-red-600 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !score}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              {loading ? 'Importing...' : 'Import Score'}
            </button>

            {/* Help Text */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                <strong>Tip:</strong> Enter your total series score from Lanetalk.
                For example, if you bowled 140, 232, 139, 134, 124 (totaling 769), enter 769.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
