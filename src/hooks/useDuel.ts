import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, usePublicClient, useWatchContractEvent, useReadContract, useAccount } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { shadowDuelAbi } from '../abis/ShadowDuel';

export type Move = "ROCK" | "PAPER" | "SCISSORS";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

export interface LeaderboardEntry {
  address: string;
  wins: number;
}

export function useDuel() {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [isComputing, setIsComputing] = useState(false);
  const [lastResolution, setLastResolution] = useState<{
    playerMove: number;
    aiMove: number;
    winner: string;
    payout: string;
  } | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Read Leaderboard
  const { data: leaderboardData, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: shadowDuelAbi,
    functionName: 'getLeaderboard',
  });

  useEffect(() => {
    if (leaderboardData) {
      const [addresses, wins] = leaderboardData as [string[], bigint[]];
      const entries: LeaderboardEntry[] = addresses.map((addr, i) => ({
        address: addr,
        wins: Number(wins[i]),
      }));
      // Sort by wins descending
      entries.sort((a, b) => b.wins - a.wins);
      setLeaderboard(entries);
    }
  }, [leaderboardData]);

  const processLogs = useCallback((logs: any[]) => {
    logs.forEach((log) => {
      try {
        const decoded = decodeEventLog({
          abi: shadowDuelAbi,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === 'DuelResolved') {
            const { playerMove, aiMove, winner, payout } = decoded.args as any;
            setLastResolution({ 
                playerMove: Number(playerMove), 
                aiMove: Number(aiMove), 
                winner, 
                payout: payout.toString() 
            });
            refetchLeaderboard();
        }
      } catch (e) {}
    });
  }, [refetchLeaderboard]);

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: shadowDuelAbi,
    eventName: 'DuelResolved',
    onLogs: processLogs,
  });

  const duelAI = useCallback(async (move: Move) => {
    setIsComputing(true);
    try {
      const moveInt = move === "ROCK" ? 1n : move === "PAPER" ? 2n : 3n;
      const wagerBigInt = parseEther('0.01');

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'duelAI',
        args: [moveInt],
        value: wagerBigInt,
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        processLogs(receipt.logs);
      }
      return hash;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsComputing(false);
    }
  }, [writeContractAsync, publicClient, processLogs]);

  const depositHouseFunds = useCallback(async (amount: string) => {
    setIsComputing(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'depositHouseFunds',
        value: parseEther(amount),
      });
      return hash;
    } finally {
      setIsComputing(false);
    }
  }, [writeContractAsync]);

  return {
    isComputing,
    duelAI,
    depositHouseFunds,
    lastResolution,
    setLastResolution,
    leaderboard,
    refetchLeaderboard,
    userAddress
  };
}
