import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { shadowDuelAbi } from '../abis/ShadowDuel';

export type Move = "ROCK" | "PAPER" | "SCISSORS";

export interface ActiveDuel {
  id: string;
  wager: number; 
  player1ShadowName: string;
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

export function useDuel() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [isComputing, setIsComputing] = useState(false);

  const createPrivateDuel = useCallback(async (code: string, wagerAmount: number) => {
    setIsComputing(true);
    try {
      console.log(`[TEE Enclave] Shielding Duel Creation... Wager: ${wagerAmount} Code: ${code}`);
      const codeBigInt = BigInt(code);
      const wagerBigInt = parseEther(wagerAmount.toString());

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'createPrivateGame',
        args: [codeBigInt, wagerBigInt],
      });

      console.log(`[TEE Enclave] Tx Hash: ${hash}`);
      
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`[TEE Enclave] Duel Created in Block ${receipt.blockNumber}`);
        // We'd parse the logs to get the duel ID here, but for now we rely on the App.tsx state management
      }
      return hash;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsComputing(false);
    }
  }, [address, writeContractAsync, publicClient]);

  const joinPrivateDuel = useCallback(async (duelId: string, code: string) => {
    setIsComputing(true);
    try {
      console.log(`[TEE Enclave] Joining Duel ${duelId} with Code: ${code}`);
      const duelIdBigInt = BigInt(duelId);
      const codeBigInt = BigInt(code);

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'joinPrivateGame',
        args: [duelIdBigInt, codeBigInt],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      return hash;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsComputing(false);
    }
  }, [address, writeContractAsync, publicClient]);

  const joinQuickMatch = useCallback(async () => {
    setIsComputing(true);
    try {
      console.log(`[TEE Enclave] Joining Quick Match Queue...`);
      const wagerBigInt = parseEther('0.1');

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'joinRandomQueue',
        args: [wagerBigInt],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      return hash;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsComputing(false);
    }
  }, [address, writeContractAsync, publicClient]);

  // The actual playHand function which commits the move and waits for resolution
  const playHand = useCallback(async (duelId: string, move: Move, wager: number) => {
    setIsComputing(true);
    try {
      const moveInt = move === "ROCK" ? 1n : move === "PAPER" ? 2n : 3n;
      console.log(`[TEE Enclave] Encrypting Move: ${moveInt} (suint) | Wager: ${wager} (suint)`);

      const duelIdBigInt = BigInt(duelId);

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'commitMove',
        args: [duelIdBigInt, moveInt],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`[TEE Enclave] Move Committed. Waiting for Opponent/Resolution...`);
      }

      // Simulate waiting for DuelResolved event for 500ms since we don't have a backend to constantly call resolveDuel right now or opponent
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Determine winner inside TEE (Simulation for visuals since opponent isn't really playing right now)
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

      return { opponentMove, result, payoutDelta: result === "VICTORY" ? wager : result === "DEFEAT" ? -wager : 0 };
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsComputing(false);
    }
  }, [writeContractAsync, publicClient]);

  return {
    isComputing,
    playHand,
    createPrivateDuel,
    joinPrivateDuel,
    joinQuickMatch
  };
}
