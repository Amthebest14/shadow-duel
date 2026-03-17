import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface ShieldedWalletContextType {
  isReady: boolean;
  shieldedBalance: string | null;
  updateBalance: (delta: number) => void;
}

const ShieldedWalletContext = createContext<ShieldedWalletContextType>({
  isReady: false,
  shieldedBalance: null,
  updateBalance: () => {},
});

export const ShieldedWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount();
  const [isReady, setIsReady] = useState(false);
  const [shieldedBalance, setShieldedBalance] = useState<string | null>(null);

  useEffect(() => {
    const isDevBypass = new URLSearchParams(window.location.search).get('bypass') === 'true';
    if (isConnected || isDevBypass) {
      // Simulate shielded connection setup
      const timer = setTimeout(() => {
        setIsReady(true);
        setShieldedBalance("10.50 SEIS");
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
      setShieldedBalance(null);
    }
  }, [isConnected]);

  const updateBalance = (delta: number) => {
    if (!shieldedBalance) return;
    const current = parseFloat(shieldedBalance.split(' ')[0]);
    setShieldedBalance(`${(current + delta).toFixed(2)} SEIS`);
  };

  return (
    <ShieldedWalletContext.Provider value={{ isReady, shieldedBalance, updateBalance }}>
      {children}
    </ShieldedWalletContext.Provider>
  );
};

export const useShieldedWallet = () => useContext(ShieldedWalletContext);
