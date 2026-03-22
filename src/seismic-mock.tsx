import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';

interface ShieldedWalletContextType {
  isReady: boolean;
  shieldedBalance: string | null;
  updateBalance: (delta: number) => void;
  depositToVault: (amount: number) => Promise<void>;
}

const ShieldedWalletContext = createContext<ShieldedWalletContextType>({
  isReady: false,
  shieldedBalance: null,
  updateBalance: () => {},
  depositToVault: async () => {},
});

export const ShieldedWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, address } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance({ address });
  const [isReady, setIsReady] = useState(false);
  const [shieldedBalance, setShieldedBalance] = useState<string | null>(null);

  // Sync actual Wagmi testnet balance into the Shielded State representation
  useEffect(() => {
    if (balanceData) {
      setShieldedBalance(`${parseFloat(balanceData.formatted).toFixed(2)} SEIS`);
    } else {
      setShieldedBalance(null);
    }
  }, [balanceData]);

  useEffect(() => {
    const isDevBypass = new URLSearchParams(window.location.search).get('bypass') === 'true';
    if (isConnected || isDevBypass) {
      // Simulate shielded connection setup
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
      setShieldedBalance(null);
    }
  }, [isConnected]);

  const updateBalance = (_delta?: number) => {
    // When a duel is resolved, instantly refetch the real on-chain Testnet Vault ETH.
    setTimeout(() => {
      refetchBalance();
    }, 500); // 1-Block finality sync
  };

  const depositToVault = async (amount: number) => {
    // Simulating ETH transaction to Vault
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        updateBalance(amount);
        resolve();
      }, 800);
    });
  };

  return (
    <ShieldedWalletContext.Provider value={{ isReady, shieldedBalance, updateBalance, depositToVault }}>
      {children}
    </ShieldedWalletContext.Provider>
  );
};

export const useShieldedWallet = () => useContext(ShieldedWalletContext);
