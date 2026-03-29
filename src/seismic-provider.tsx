import React, { createContext, useContext } from 'react';
import { useAccount, useBalance } from 'wagmi';

interface SeismicContextType {
  isReady: boolean;
  walletBalance: string | null;
  refreshBalance: () => void;
}

const SeismicContext = createContext<SeismicContextType>({
  isReady: false,
  walletBalance: null,
  refreshBalance: () => {},
});

export const SeismicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { data: balanceData, refetch: refreshBalance } = useBalance({ address });

  const walletBalance = balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : null;
  const isReady = isConnected && !!balanceData;

  return (
    <SeismicContext.Provider value={{ isReady, walletBalance, refreshBalance }}>
      {children}
    </SeismicContext.Provider>
  );
};

export const useSeismic = () => useContext(SeismicContext);
