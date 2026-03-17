import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useShieldedWallet } from './seismic-mock';
import { useAccount } from 'wagmi';

// SVG Paths for HandMorph
const SVGS = {
  FIST: "M 8 4 L 16 4 L 20 12 L 16 20 L 8 20 L 4 12 Z", // Closed Octagon (Fist)
  ROCK: "M 12 3 A 9 9 0 0 0 3 12 A 9 9 0 0 0 12 21 A 9 9 0 0 0 21 12 A 9 9 0 0 0 12 3 Z", // Circle (Rock)
  PAPER: "M 4 3 L 20 3 L 20 21 L 4 21 Z", // Rectangle (Paper)
  SCISSORS: "M 6 6 L 18 18 M 18 6 L 6 18", // Cross (Scissors)
};

const GLITCH_PATHS = [SVGS.FIST, SVGS.ROCK, SVGS.PAPER, SVGS.SCISSORS];

function App() {
  const { isConnected } = useAccount();
  const { isReady, shieldedBalance } = useShieldedWallet();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playerResult, setPlayerResult] = useState<"ROCK" | "PAPER" | "SCISSORS" | null>(null);
  const [opponentResult, setOpponentResult] = useState<"ROCK" | "PAPER" | "SCISSORS" | null>(null);
  
  // Opponent glitch path index
  const [glitchIndex, setGlitchIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setGlitchIndex((prev) => (prev + 1) % GLITCH_PATHS.length);
      }, 100); // 100ms glitch speed
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const playRound = async () => {
    setIsPlaying(true);
    setPlayerResult(null);
    setOpponentResult(null);

    // Simulate Seismic Encrypted Transaction & 500ms Block Finality
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const outcomes: Array<"ROCK" | "PAPER" | "SCISSORS"> = ["ROCK", "PAPER", "SCISSORS"];
    setPlayerResult(outcomes[Math.floor(Math.random() * outcomes.length)]);
    setOpponentResult(outcomes[Math.floor(Math.random() * outcomes.length)]);
    
    setIsPlaying(false);
  };

  const playerPath = isPlaying || !playerResult ? SVGS.FIST : SVGS[playerResult];
  const opponentPath = isPlaying ? GLITCH_PATHS[glitchIndex] : (!opponentResult ? SVGS.FIST : SVGS[opponentResult]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center p-6 relative overflow-x-hidden font-mono antialiased">
      {/* Background decorations */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-[#39FF14]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Dashboard */}
      <header className="glass-panel w-full max-w-5xl p-6 mb-12 flex justify-between items-center z-10 border border-white/10 bg-black/40 rounded-xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">SHADOW DUEL</h1>
          <p className="text-sm text-gray-400 mt-1">Encrypted RPS on Seismic Testnet</p>
        </div>
        <div className="flex items-center gap-6">
          {isConnected && (
             <div className="text-right flex flex-col items-end">
               <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-[#39FF14] animate-pulse' : 'bg-yellow-500'}`} />
                 <span className="text-gray-300">{isReady ? 'Shielded' : 'Connecting Vault...'}</span>
               </div>
               <div className="flex items-center gap-2 mt-1">
                 {!isReady && <span className="w-3 h-3 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin"></span>}
                 <p className="text-lg font-mono text-white">Bal: {shieldedBalance || "--- SEIS"}</p>
               </div>
             </div>
          )}
          
          {/* Custom Connect Button */}
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const connected = mounted && account && chain;
              return (
                <div
                  {...(!mounted && {
                    'aria-hidden': true,
                    style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button 
                          onClick={openConnectModal} 
                          className="px-6 py-3 bg-black border border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:shadow-[0_0_15px_rgba(57,255,20,0.6)] hover:bg-[#39FF14]/10 transition-all font-mono"
                        >
                          CONNECT WALLET
                        </button>
                      );
                    }
                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} className="px-6 py-3 bg-red-900 border border-red-500 text-white rounded-lg">
                          Wrong network
                        </button>
                      );
                    }
                    return (
                      <button 
                        onClick={openAccountModal}
                        className="flex items-center gap-2 px-4 py-2 bg-black border border-[#39FF14]/50 hover:border-[#39FF14] text-gray-200 rounded-lg shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-all font-mono"
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#39FF14] to-emerald-900"></div>
                        {account.displayName}
                        {account.displayBalance ? ` (${account.displayBalance})` : ''}
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="w-full max-w-4xl flex flex-col items-center z-10">
        
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center p-24 text-center glass-panel border border-white/10 bg-black/40 rounded-xl w-full">
            <svg className="w-24 h-24 text-[#39FF14]/50 mb-6 drop-shadow-[0_0_15px_rgba(57,255,20,0.3)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-4">ACCESS RESTRICTED</h2>
            <p className="text-gray-400 mb-8 max-w-md">Connect your wallet to access the Shadow Duel arena. All matchmaking and moves are cryptographically shielded by the Seismic TEE.</p>
          </div>
        ) : !isReady ? (
           <div className="flex flex-col items-center justify-center p-24 text-center glass-panel border border-white/10 bg-black/40 rounded-xl w-full">
             <div className="w-16 h-16 border-4 border-[#39FF14]/20 border-t-[#39FF14] rounded-full animate-spin mb-6"></div>
             <p className="text-[#39FF14] font-mono animate-pulse">Establishing Secure TEE Connection...</p>
           </div>
        ) : (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="flex w-full justify-between items-center mb-12 gap-8">
                {/* Player Hand */}
                <div className="flex flex-col items-center w-1/2">
                  <h3 className="text-xl font-bold text-white mb-6 tracking-wider">YOU</h3>
                  <motion.div
                    animate={
                      isPlaying ? {
                        y: [0, -30, 0, -30, 0, -30, 0], // 3-beat Shake
                        rotate: [0, -10, 10, -10, 10, -10, 0]
                      } : {}
                    }
                    transition={{ duration: 0.6, ease: "easeInOut", repeat: isPlaying ? Infinity : 0 }}
                    className={`w-56 h-56 flex flex-col items-center justify-center rounded-3xl transition-all duration-500 ${playerResult ? 'bg-[#39FF14]/10 shadow-[0_0_30px_rgba(57,255,20,0.3)] border border-[#39FF14]/50 scale-105' : 'bg-gray-900 border border-gray-800'}`}
                  >
                    <svg 
                      className={`w-32 h-32 ${playerResult ? 'text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.8)]' : 'text-gray-500 drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]'}`} 
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <motion.path animate={{ d: playerPath }} transition={{ duration: 0.5, ease: "easeInOut" }} />
                    </svg>
                    {playerResult && !isPlaying && (
                      <span className="text-2xl mt-4 font-bold text-[#39FF14] drop-shadow-[0_0_5px_rgba(57,255,20,0.8)]">{playerResult}</span>
                    )}
                  </motion.div>
                </div>

                <div className="text-4xl font-bold text-gray-600">VS</div>

                {/* Opponent Hand */}
                <div className="flex flex-col items-center w-1/2">
                  <h3 className="text-xl font-bold text-gray-400 mb-6 tracking-wider opacity-50">SHADOW OPPONENT</h3>
                  <motion.div
                    animate={
                      isPlaying ? {
                        y: [0, -30, 0, -30, 0, -30, 0], // 3-beat Shake sync
                        rotate: [0, 10, -10, 10, -10, 10, 0] // Mirrored shake
                      } : {}
                    }
                    transition={{ duration: 0.6, ease: "easeInOut", repeat: isPlaying ? Infinity : 0 }}
                    className={`w-56 h-56 flex flex-col items-center justify-center rounded-3xl transition-all duration-500 ${opponentResult ? 'bg-red-900/10 shadow-[0_0_30px_rgba(255,0,0,0.3)] border border-red-500/50 scale-105' : 'bg-gray-900 border border-gray-800'}`}
                  >
                    <svg 
                      className={`w-32 h-32 ${isPlaying ? 'text-[#39FF14]/30 mix-blend-screen scale-110' : (opponentResult ? 'text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]' : 'text-gray-700')}`} 
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ filter: isPlaying ? 'url(#glitch)' : 'none' }}
                    >
                      <motion.path animate={{ d: opponentPath }} transition={{ duration: isPlaying ? 0 : 0.5, ease: "easeInOut" }} />
                    </svg>
                    {opponentResult && !isPlaying && (
                      <span className="text-2xl mt-4 font-bold text-red-500 drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">{opponentResult}</span>
                    )}
                  </motion.div>
                </div>
              </div>

              <button 
                onClick={playRound}
                disabled={isPlaying}
                className="px-12 py-5 bg-[#39FF14] text-[#0B0B0B] font-bold text-2xl rounded-sm hover:bg-white hover:text-black transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(57,255,20,0.5)] border border-[#39FF14]"
              >
                {isPlaying ? "COMPUTING TEE ENCLAVE..." : "ENGAGE DUEL"}
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* SVG Filters */}
      <svg width="0" height="0" className="hidden">
        <filter id="glitch">
          <feTurbulence type="fractalNoise" baseFrequency="0.1 0.4" numOctaves="2" result="warp" />
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="10" in="SourceGraphic" in2="warp" />
        </filter>
      </svg>
    </div>
  )
}

export default App
