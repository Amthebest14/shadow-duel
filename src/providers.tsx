import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { defineChain } from 'viem';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { SeismicProvider } from './seismic-provider';

const seismicTestnet = defineChain({
  id: 5124,
  name: 'Seismic Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Seismic Testnet',
    symbol: 'SEIS',
  },
  rpcUrls: {
    default: { http: ['https://gcp-2.seismictest.net/rpc'] },
  },
  blockExplorers: {
    default: { name: 'SocialScan', url: 'https://seismic-explorer.socialscan.io' },
  },
});

const config = getDefaultConfig({
  appName: 'Shadow Duel',
  projectId: 'YOUR_PROJECT_ID', // Replace with a valid WalletConnect project ID in production
  chains: [seismicTestnet],
  ssr: false, // Vite is SPA by default
});

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#39FF14',
            accentColorForeground: 'black',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <SeismicProvider>
            {children}
          </SeismicProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
