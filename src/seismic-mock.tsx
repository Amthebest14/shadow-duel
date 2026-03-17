import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface ShieldedWalletContextType {
  isReady: boolean;
  shieldedBalance: string | null;
}

const ShieldedWalletContext = createContext<ShieldedWalletContextType>({
  isReady: false,
  shieldedBalance: null,
});

export const ShieldedWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount();
  const [isReady, setIsReady] = useState(false);
  const [shieldedBalance, setShieldedBalance] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      // Simulate shielded connection setup
      const timer = setTimeout(() => {
        setIsReady(true);
        setShieldedBalance("10.5 SEIS");
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
      setShieldedBalance(null);
    }
  }, [isConnected]);

  return (
    <ShieldedWalletContext.Provider value={{ isReady, shieldedBalance }}>
      {children}
    </ShieldedWalletContext.Provider>
  );
};

export const useShieldedWallet = () => useContext(ShieldedWalletContext);
