import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

export type Move = "ROCK" | "PAPER" | "SCISSORS";

export interface ActiveDuel {
  id: string;
  wager: number; 
  player1ShadowName: string;
}

export function useDuel() {
  const { address } = useAccount();

  const [activeDuels, setActiveDuels] = useState<ActiveDuel[]>([
    { id: "duel-001", wager: 2.5, player1ShadowName: "Shadow_0x...Ab3F" },
    { id: "duel-002", wager: 10.0, player1ShadowName: "Shadow_0x...C99b" }
  ]);

  const [isComputing, setIsComputing] = useState(false);

  // Mocks creating a new duel via useShieldedWrite
  const createDuel = useCallback(async (wagerAmount: number) => {
    setIsComputing(true);
    console.log(`[TEE Enclave] Shielding Duel Creation... Wager: ${wagerAmount} (suint)`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const shortAddr = address ? `${address.substring(0,6)}...${address.slice(-4)}` : "Unknown";
    const shadowName = `Shadow_${shortAddr}`;
    
    setActiveDuels(prev => [...prev, { 
      id: `duel-${Math.floor(Math.random()*1000)}`, 
      wager: wagerAmount, 
      player1ShadowName: shadowName 
    }]);
    
    setIsComputing(false);
  }, [address]);

  // Mocks joining an existing duel and resolving it via useShieldedWrite
  const playHand = useCallback(async (duelId: string, move: Move, wager: number) => {
    setIsComputing(true);
    
    // Simulate Encrypting move and wager as `suint`
    const moveInt = move === "ROCK" ? 1 : move === "PAPER" ? 2 : 3;
    console.log(`[TEE Enclave] Encrypting Move: ${moveInt} (suint) | Wager: ${wager} (suint)`);

    // Simulate 500ms Block Finality waiting for DuelResolved Event
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Determine winner inside TEE (Simulation)
    const outcomes: Move[] = ["ROCK", "PAPER", "SCISSORS"];
    const opponentMove = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    let result: "VICTORY" | "DEFEAT" | "DRAW" = "DRAW";
    
    if (move === opponentMove) {
      result = "DRAW";
    } else if (
      (move === "ROCK" && opponentMove === "SCISSORS") || 
      (move === "PAPER" && opponentMove === "ROCK") || 
      (move === "SCISSORS" && opponentMove === "PAPER")
    ) {
      result = "VICTORY";
    } else {
      result = "DEFEAT";
    }

    // Remove the duel from the active lobby
    setActiveDuels(prev => prev.filter(d => d.id !== duelId));
    setIsComputing(false);

    return { opponentMove, result, payoutDelta: result === "VICTORY" ? wager : result === "DEFEAT" ? -wager : 0 };
  }, []);

  return {
    activeDuels,
    isComputing,
    playHand,
    createDuel
  };
}
