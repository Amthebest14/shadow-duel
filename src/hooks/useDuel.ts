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

  const [isComputing, setIsComputing] = useState(false);

  // Mocks creating a new duel via useShieldedWrite
  const createDuel = useCallback(async (wagerAmount: number) => {
    setIsComputing(true);
    console.log(`[TEE Enclave] Shielding Duel Creation... Wager: ${wagerAmount} (suint)`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsComputing(false);
  }, [address]);

  // Mocks joining an existing duel and resolving it via useShieldedWrite
  const playHand = useCallback(async (_duelId: string, move: Move, wager: number) => {
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

    // Duel is no longer in active queue
    setIsComputing(false);
    setIsComputing(false);

    return { opponentMove, result, payoutDelta: result === "VICTORY" ? wager : result === "DEFEAT" ? -wager : 0 };
  }, []);

  return {
    isComputing,
    playHand,
    createDuel
  };
}
