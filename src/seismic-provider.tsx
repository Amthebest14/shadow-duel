import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { shadowDuelAbi } from './abis/ShadowDuel';
import { formatEther, parseEther } from 'viem';

interface SeismicContextType {
  isReady: boolean;
  shieldedBalance: string | null;
  refreshBalance: () => Promise<void>;
  depositToVault: (amount: string) => Promise<void>;
}

const SeismicContext = createContext<SeismicContextType>({
  isReady: false,
  shieldedBalance: null,
  refreshBalance: async () => {},
  depositToVault: async () => {},
});

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

export const SeismicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  
  const [isReady, setIsReady] = useState(false);
  const [shieldedBalance, setShieldedBalance] = useState<string | null>(null);

  // In a real Seismic environment, this would involve a Signed Read via SDK.
  // For this version, we call the contract's getShieldedBalance view function.
  const { data: rawBalance, refetch: refetchShielded, isError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: shadowDuelAbi,
    functionName: 'getShieldedBalance',
    args: [address as `0x${string}`],
    account: address, // Critical to satisfy getShieldedBalance's msg.sender == user check
    query: {
        enabled: !!address,
        retry: 2,
    }
  });

  useEffect(() => {
    if (rawBalance !== undefined) {
      setShieldedBalance(`${formatEther(rawBalance as bigint)} SEIS`);
      setIsReady(true);
    } else if (isError) {
      console.error("[Seismic] Failed to read shielded balance.");
      setShieldedBalance("0.00 SEIS");
      setIsReady(true); // Fail gracefully so the app doesn't stay stuck
    }
  }, [rawBalance, isError]);

  const refreshBalance = useCallback(async () => {
    await refetchShielded();
  }, [refetchShielded]);

  const depositToVault = useCallback(async (amount: string) => {
    if (!address) return;
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: shadowDuelAbi,
        functionName: 'deposit',
        value: parseEther(amount),
      });
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        await refreshBalance();
      }
    } catch (err) {
      console.error("Deposit failed:", err);
      throw err;
    }
  }, [address, writeContractAsync, publicClient, refreshBalance]);

  return (
    <SeismicContext.Provider value={{ isReady, shieldedBalance, refreshBalance, depositToVault }}>
      {children}
    </SeismicContext.Provider>
  );
};

export const useSeismic = () => useContext(SeismicContext);
