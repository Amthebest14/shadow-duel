import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, usePublicClient, useWatchContractEvent } from 'wagmi';
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
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [lastResolution, setLastResolution] = useState<{
    duelId: string;
    winner: string;
  } | null>(null);

  // Listen for real-time matchmaking
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: shadowDuelAbi,
    eventName: 'MatchFound',
    onLogs(logs) {
      logs.forEach((log) => {
        const { duelId } = log.args;
        if (duelId !== undefined) {
          console.log(`[TEE Enclave] Match Found! ID: ${duelId}`);
          setActiveMatchId(duelId.toString());
        }
      });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: shadowDuelAbi,
    eventName: 'PlayerJoined',
    onLogs(logs) {
      logs.forEach((log) => {
        const { duelId, player } = log.args;
        if (duelId !== undefined && player !== undefined) {
          console.log(`[TEE Enclave] Player ${player} joined duel ${duelId}`);
          // If we are the host, this tells us a challenger arrived
          setActiveMatchId(duelId.toString());
        }
      });
    },
  });

  // Listen for real-time duel resolutions
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: shadowDuelAbi,
    eventName: 'DuelResolved',
    onLogs(logs) {
      logs.forEach((log) => {
        const { duelId, winner } = log.args;
        if (duelId !== undefined && winner !== undefined) {
          console.log(`[TEE Enclave] Duel Resolved on-chain! ID: ${duelId}, Winner: ${winner}`);
          setLastResolution({ duelId: duelId.toString(), winner });
        }
      });
    },
  });

  const createPrivateDuel = useCallback(async (code: string, wagerAmount: number) => {
    setIsComputing(true);
    try {
      const codeBigInt = BigInt(code);
      const wagerBigInt = parseEther(wagerAmount.toString());

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'createPrivateGame',
        args: [codeBigInt, wagerBigInt],
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

  const joinPrivateDuel = useCallback(async (duelId: string, code: string) => {
    setIsComputing(true);
    try {
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

  const commitMove = useCallback(async (duelId: string, move: Move) => {
    setIsComputing(true);
    try {
      const moveInt = move === "ROCK" ? 1n : move === "PAPER" ? 2n : 3n;
      const duelIdBigInt = BigInt(duelId);

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'commitMove',
        args: [duelIdBigInt, moveInt],
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
  }, [writeContractAsync, publicClient]);

  const resolveDuel = useCallback(async (duelId: string) => {
    setIsComputing(true);
    try {
        const duelIdBigInt = BigInt(duelId);
        const hash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: shadowDuelAbi,
            functionName: 'resolveDuel',
            args: [duelIdBigInt],
        });
        if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash });
        }
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        setIsComputing(false);
    }
  }, [writeContractAsync, publicClient]);

  return {
    isComputing,
    createPrivateDuel,
    joinPrivateDuel,
    joinQuickMatch,
    commitMove,
    resolveDuel,
    lastResolution,
    activeMatchId,
    setActiveMatchId
  };
}
