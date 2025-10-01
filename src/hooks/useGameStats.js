import { useAuth } from '../AuthContext';
import { database } from '../firebase';
import { ref, get, set } from 'firebase/database';

export function useGameStats() {
  const { currentUser } = useAuth();

  const updateStats = async (gameType, updates) => {
    if (!currentUser) return;

    try {
      const statsRef = ref(database, `users/${currentUser.uid}/stats/${gameType}`);
      const snapshot = await get(statsRef);
      const currentStats = snapshot.exists() ? snapshot.val() : {};

      const newStats = { ...currentStats };

      // Merge the updates
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'number') {
          newStats[key] = (newStats[key] || 0) + updates[key];
        } else {
          newStats[key] = updates[key];
        }
      });

      await set(statsRef, newStats);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  // Makes or Misses specific tracking
  const recordMakesOrMissesGame = async (playerData) => {
    const { isWinner, points } = playerData;

    await updateStats('makesOrMisses', {
      gamesPlayed: 1,
      totalPoints: points,
      wins: isWinner ? 1 : 0,
      losses: isWinner ? 0 : 1
    });
  };

  // Match Play specific tracking
  const recordMatchPlayGame = async (result) => {
    const { outcome } = result; // 'win', 'loss', or 'tie'

    await updateStats('matchPlay', {
      gamesPlayed: 1,
      wins: outcome === 'win' ? 1 : 0,
      losses: outcome === 'loss' ? 1 : 0,
      ties: outcome === 'tie' ? 1 : 0
    });
  };

  // King of the Hill specific tracking
  const recordKingOfTheHillGame = async (achievements) => {
    const { wonHighGame, wonHighTotal } = achievements;

    await updateStats('kingOfTheHill', {
      gamesPlayed: 1,
      highGameWins: wonHighGame ? 1 : 0,
      highTotalWins: wonHighTotal ? 1 : 0
    });
  };

  // Bracket Play specific tracking
  const recordBracketPlayTournament = async (placement) => {
    const { isChampion, isRunnerUp } = placement;

    await updateStats('bracketPlay', {
      tournamentsPlayed: 1,
      championships: isChampion ? 1 : 0,
      runnerUps: isRunnerUp ? 1 : 0
    });
  };

  return {
    recordMakesOrMissesGame,
    recordMatchPlayGame,
    recordKingOfTheHillGame,
    recordBracketPlayTournament
  };
}
