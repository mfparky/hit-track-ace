import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Player, Outing } from '@/types/hitting';

interface HittingContextType {
  players: Player[];
  outings: Outing[];
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
  addOuting: (outing: Outing) => void;
  updateOuting: (outing: Outing) => void;
  deleteOuting: (id: string) => void;
  getPlayerOutings: (playerId: string) => Outing[];
}

const HittingContext = createContext<HittingContextType | undefined>(undefined);

// Demo data
const demoPlayers: Player[] = [
  { id: '1', name: 'Marcus Johnson', number: '24', position: 'CF', bats: 'R' },
  { id: '2', name: 'Tyler Rodriguez', number: '7', position: '3B', bats: 'L' },
  { id: '3', name: 'Jake Williams', number: '12', position: 'SS', bats: 'S' },
  { id: '4', name: 'Chris Thompson', number: '33', position: '1B', bats: 'R' },
];

const demoOutings: Outing[] = [
  {
    id: '1',
    playerId: '1',
    type: 'game',
    date: '2024-01-15',
    opponent: 'Eagles',
    atBats: [
      { id: 'ab1', pitchCount: 5, result: 'single', locations: [], sprayPoint: { id: 'sp1', x: -0.3, y: 0.4, result: 'single', hitType: 'line_drive', exitVelocity: 98, isBarrel: true } },
      { id: 'ab2', pitchCount: 3, result: 'strikeout', locations: [] },
      { id: 'ab3', pitchCount: 6, result: 'double', locations: [], sprayPoint: { id: 'sp2', x: 0.6, y: 0.7, result: 'double', hitType: 'line_drive', exitVelocity: 105, isBarrel: true } },
    ],
    isComplete: true,
  },
  {
    id: '2',
    playerId: '1',
    type: 'batting_practice',
    date: '2024-01-14',
    atBats: [
      { id: 'ab4', pitchCount: 1, result: 'hr', locations: [], sprayPoint: { id: 'sp3', x: 0.1, y: 0.95, result: 'hr', hitType: 'fly_ball', exitVelocity: 108, isBarrel: true } },
      { id: 'ab5', pitchCount: 1, result: 'single', locations: [], sprayPoint: { id: 'sp4', x: -0.5, y: 0.35, result: 'single', hitType: 'ground_ball', exitVelocity: 92 } },
    ],
    isComplete: true,
  },
];

export function HittingProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(demoPlayers);
  const [outings, setOutings] = useState<Outing[]>(demoOutings);

  const addPlayer = (player: Player) => {
    setPlayers((prev) => [...prev, player]);
  };

  const updatePlayer = (player: Player) => {
    setPlayers((prev) => prev.map((p) => (p.id === player.id ? player : p)));
  };

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setOutings((prev) => prev.filter((o) => o.playerId !== id));
  };

  const addOuting = (outing: Outing) => {
    setOutings((prev) => [...prev, outing]);
  };

  const updateOuting = (outing: Outing) => {
    setOutings((prev) => prev.map((o) => (o.id === outing.id ? outing : o)));
  };

  const deleteOuting = (id: string) => {
    setOutings((prev) => prev.filter((o) => o.id !== id));
  };

  const getPlayerOutings = (playerId: string) => {
    return outings.filter((o) => o.playerId === playerId);
  };

  return (
    <HittingContext.Provider
      value={{
        players,
        outings,
        addPlayer,
        updatePlayer,
        deletePlayer,
        addOuting,
        updateOuting,
        deleteOuting,
        getPlayerOutings,
      }}
    >
      {children}
    </HittingContext.Provider>
  );
}

export function useHitting() {
  const context = useContext(HittingContext);
  if (context === undefined) {
    throw new Error('useHitting must be used within a HittingProvider');
  }
  return context;
}
