import { useState, useCallback } from 'react';
import { useWriteContract, usePublicClient, useWatchContractEvent } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { shadowDuelAbi } from '../abis/ShadowDuel';

export type Move = "ROCK" | "PAPER" | "SCISSORS";

export interface ActiveDuel {
  id: string;
  wager: number; 
  player1ShadowName: string;
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

export function useDuel() {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [isComputing, setIsComputing] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [lastResolution, setLastResolution] = useState<{
    duelId: string;
    winner: string;
  } | null>(null);

  const processLogs = useCallback((logs: any[]) => {
    console.log(`[TEE Enclave] Processing ${logs.length} logs...`);
    logs.forEach((log) => {
      try {
        const decoded = decodeEventLog({
          abi: shadowDuelAbi,
          data: log.data,
          topics: log.topics,
        });

        console.log(`[TEE Enclave] Decoded Event: ${decoded.eventName}`, decoded.args);

        if (decoded.eventName === 'MatchFound' || decoded.eventName === 'DuelCreated' || decoded.eventName === 'PlayerJoined') {
          const duelId = (decoded.args as any).duelId;
          if (duelId !== undefined) {
             const idStr = duelId.toString();
             console.log(`[TEE Enclave] Setting Active Match: ${idStr}`);
             setActiveMatchId(idStr);
          }
        }
        
        if (decoded.eventName === 'DuelResolved') {
            const { duelId, winner } = decoded.args as any;
            if (duelId !== undefined && winner !== undefined) {
              setLastResolution({ duelId: duelId.toString(), winner });
            }
        }
      } catch (e) {
        // Log mismatch is common for internal txs, skip silently
      }
    });
  }, []);

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: shadowDuelAbi,
    onLogs: processLogs,
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
        value: parseEther('0.1'), 
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

  const joinQuickMatch = useCallback(async () => {
    setIsComputing(true);
    try {
      const wagerBigInt = parseEther('0.1');

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'joinRandomQueue',
        args: [wagerBigInt],
        value: wagerBigInt,
      });

      if (publicClient) {
        console.log("[TEE Enclave] Waiting for Match confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        processLogs(receipt.logs);
        // Special Case: If we finish here and still no match ID, 
        // it means we are the "Host" of this new queue item.
      }
      return hash;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsComputing(false);
    }
  }, [writeContractAsync, publicClient, processLogs]);

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
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            processLogs(receipt.logs);
        }
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        setIsComputing(false);
    }
  }, [writeContractAsync, publicClient, processLogs]);

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
