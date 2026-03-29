import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSeismic } from './seismic-provider';
import { useAccount } from 'wagmi';
import { useDuel, type Move, type ActiveDuel } from './hooks/useDuel';

const SVGS = {
  FIST: "M 8 4 L 16 4 L 20 12 L 16 20 L 8 20 L 4 12 Z", 
  ROCK: "M 12 3 A 9 9 0 0 0 3 12 A 9 9 0 0 0 12 21 A 9 9 0 0 0 21 12 A 9 9 0 0 0 12 3 Z", 
  PAPER: "M 4 3 L 20 3 L 20 21 L 4 21 Z", 
  SCISSORS: "M 6 6 L 18 18 M 18 6 L 6 18", 
};

const GLITCH_PATHS = [SVGS.FIST, SVGS.ROCK, SVGS.PAPER, SVGS.SCISSORS];

function App() {
  const { isConnected, address } = useAccount();
  const isDevBypass = new URLSearchParams(window.location.search).get('bypass') === 'true';
  const effectiveConnected = isConnected || isDevBypass;
  const { isReady, walletBalance, refreshBalance } = useSeismic();
  const { commitMove, resolveDuel, isComputing, createPrivateDuel, joinPrivateDuel, joinQuickMatch, lastResolution, activeMatchId } = useDuel();

  // Lobby Navigation State
  const [lobbyView, setLobbyView] = useState<'SELECTION' | 'HOST' | 'JOIN'>('SELECTION');
  const [privateCode, setPrivateCode] = useState('');
  const [hostWager, setHostWager] = useState('0.1');
  const [isSearching, setIsSearching] = useState(false);

  // Selected Duel Game State
  const [activePlay, setActivePlay] = useState<ActiveDuel | null>(null);
  
  // Hand Morph Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerResult, setPlayerResult] = useState<Move | null>(null);
  const [opponentResult, setOpponentResult] = useState<Move | null>(null);
  const [duelOutcome, setDuelOutcome] = useState<"VICTORY" | "DEFEAT" | "DRAW" | null>(null);
  
  const [glitchIndex, setGlitchIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setGlitchIndex((prev) => (prev + 1) % GLITCH_PATHS.length);
      }, 75); // fast glitch speed
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle on-chain event synchronization
  useEffect(() => {
    if (activeMatchId && !activePlay) {
      console.log("[App] Match found, transitioning to SELECTION.");
      setActivePlay({ 
        id: activeMatchId, 
        wager: lobbyView === 'HOST' ? parseFloat(hostWager) : 0.1, 
        player1ShadowName: `SHADOW#${activeMatchId.slice(-4).toUpperCase()}` 
      });
      setIsSearching(false);
      setLobbyView('SELECTION');
    }
  }, [activeMatchId, activePlay, lobbyView, hostWager]);

  useEffect(() => {
    if (lastResolution && activePlay && lastResolution.duelId === activePlay.id) {
       setIsPlaying(false);
       // result = VICTORY if lastResolution.winner == address
       const isWinner = lastResolution.winner.toLowerCase() === address?.toLowerCase();
       const isDraw = lastResolution.winner === "0x0000000000000000000000000000000000000000";
       setDuelOutcome(isDraw ? "DRAW" : isWinner ? "VICTORY" : "DEFEAT");
       refreshBalance();
    }
  }, [lastResolution, activePlay, address, refreshBalance]);

  const handleThrow = async (selectedMove: Move) => {
    if (!activePlay) return;
    setPlayerResult(selectedMove);
    setIsPlaying(true);
    setDuelOutcome(null);

    try {
      await commitMove(activePlay.id, selectedMove);
      // Now we stay in isPlaying (shake) until lastResolution arrives or user resolves
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  const closeMatch = () => {
    setActiveMatchId(null);
    setActivePlay(null);
    setPlayerResult(null);
    setOpponentResult(null);
    setDuelOutcome(null);
    setIsPlaying(false);
    setLobbyView('SELECTION');
  };

  const handleQuickSearch = async () => {
    setIsSearching(true);
    try {
        await joinQuickMatch();
        // Wait for MatchFound event via useEffect
    } catch (e) {
        console.error(e);
        setIsSearching(false);
    }
  };


  const playerPath = isPlaying || !playerResult ? SVGS.FIST : SVGS[playerResult];
  const opponentPath = isPlaying ? GLITCH_PATHS[glitchIndex] : (!opponentResult ? SVGS.FIST : SVGS[opponentResult]);

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center p-6 relative overflow-x-hidden font-mono antialiased">
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-[#39FF14]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Dashboard */}
      <header className="glass-panel w-full max-w-5xl p-6 mb-8 flex justify-between items-center z-20 border border-white/10 bg-black/40 rounded-xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">SHADOW DUEL</h1>
          <p className="text-sm text-gray-400 mt-1">Encrypted RPS on Seismic Testnet</p>
          <p className="text-xs text-[#39FF14]/50 mt-1 font-mono">Live on Seismic Testnet: 0xBA0FbC0053336B622784DB8BD7eFa2e21FE802aE</p>
        </div>
        <div className="flex items-center gap-6">
          {isConnected && (
             <div className="text-right flex flex-col items-end">
               <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-[#39FF14] animate-pulse' : 'bg-yellow-500'}`} />
                 <span className={`text-sm ${isReady ? 'text-[#39FF14]' : 'text-gray-400'}`}>{isReady ? 'TEE Secured' : 'Connecting Vault...'}</span>
               </div>
               <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold font-mono text-white tracking-widest bg-black px-4 py-1 border border-white/10 rounded-lg shadow-inner">
                     Wallet: <span className="text-[#39FF14]">{walletBalance || "0.0000 SEIS"}</span>
                    </p>
                  </div>
               </div>
             </div>
          )}
          <ConnectButton.Custom>
             {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const connected = mounted && account && chain;
              return (
                <div {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' }})}>
                  {(() => {
                    if (!connected) return <button onClick={openConnectModal} className="px-6 py-3 bg-black border border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:shadow-[0_0_15px_rgba(57,255,20,0.6)] hover:bg-[#39FF14]/10 transition-all">CONNECT WALLET</button>;
                    if (chain.unsupported) return <button onClick={openChainModal} className="px-6 py-3 bg-red-900 border border-red-500 text-white rounded-lg">Wrong network</button>;
                    return (
                      <button onClick={openAccountModal} className="flex items-center gap-2 px-4 py-2 bg-black border border-[#39FF14]/50 hover:border-[#39FF14] text-gray-200 rounded-lg shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-all font-mono">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#39FF14] to-emerald-900"></div>
                        {account.displayName}
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </header>

      {/* Main Lobby or Arena Area */}
      <main className="w-full max-w-5xl flex flex-col items-center z-10 relative">
        
        {!effectiveConnected || !isReady ? (
          <div className="flex flex-col items-center justify-center p-32 text-center glass-panel border border-white/10 bg-black/40 rounded-xl w-full">
            <svg className="w-24 h-24 text-[#39FF14]/50 mb-6 drop-shadow-[0_0_15px_rgba(57,255,20,0.3)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-wider">ACCESS RESTRICTED</h2>
            <p className="text-gray-400 max-w-md">Wallet connection required. All matchmaking and moves are cryptographically shielded by the Seismic TEE.</p>
          </div>
        ) : !activePlay ? (
          <div className="w-full flex flex-col items-center">
             {isSearching ? (
                <div className="w-full max-w-2xl p-16 flex flex-col items-center justify-center bg-[#000000] border border-[#39FF14] shadow-[0_0_40px_rgba(57,255,20,0.3)] rounded-xl relative overflow-hidden">
                   <div className="absolute inset-0 bg-[#39FF14]/5" />
                   <h2 className="text-3xl font-black text-[#39FF14] mb-8 animate-pulse tracking-widest relative z-10 text-center">SEARCHING FOR OPPONENT...</h2>
                   <div className="w-full h-2 bg-gray-900 overflow-hidden relative border border-white/5 rounded">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="w-1/2 h-full bg-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.8)]"
                      />
                   </div>
                   <p className="text-sm text-gray-500 font-mono mt-6 tracking-widest relative z-10">[ WAGER: 0.10 SEIS SECURED ]</p>
                </div>
             ) : lobbyView === 'SELECTION' && (
                <div className="w-full max-w-3xl flex flex-col gap-6 mt-4">
                   <button 
                     onClick={handleQuickSearch}
                     className="w-full relative overflow-hidden group glass-panel p-8 bg-[#000000] border border-[#39FF14]/50 hover:border-[#39FF14] hover:shadow-[0_0_40px_rgba(57,255,20,0.4)] transition-all flex flex-col items-center justify-center rounded-xl"
                   >
                     <div className="absolute inset-0 bg-[#39FF14]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                     <h2 className="text-3xl font-black text-[#39FF14] mb-2 tracking-widest relative z-10">QUICK SEARCH</h2>
                     <p className="text-gray-400 text-sm font-mono relative z-10">STATIONARY WAGER: 0.10 SEIS (1-BLOCK FINALITY)</p>
                   </button>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                     <button onClick={() => setLobbyView('HOST')} className="glass-panel p-8 bg-[#000000] border border-white/10 hover:border-[#39FF14]/50 transition-all flex flex-col items-center justify-center rounded-xl">
                        <h2 className="text-2xl font-bold text-white tracking-widest">HOST DUEL</h2>
                        <p className="text-gray-500 text-xs mt-2 font-mono text-center">Create encrypted 4-digit TEE lobby</p>
                     </button>
                     <button onClick={() => setLobbyView('JOIN')} className="glass-panel p-8 bg-[#000000] border border-white/10 hover:border-[#39FF14]/50 transition-all flex flex-col items-center justify-center rounded-xl">
                        <h2 className="text-2xl font-bold text-white tracking-widest">JOIN DUEL</h2>
                        <p className="text-gray-500 text-xs mt-2 font-mono text-center">Execute CLOAD bypass to enter</p>
                     </button>
                   </div>
                </div>
             )}

             {lobbyView === 'HOST' && !isSearching && (
                <div className="w-full max-w-xl glass-panel p-8 bg-[#000000] border border-[#39FF14]/30 flex flex-col items-center justify-center rounded-xl relative mt-4">
                   <button onClick={() => setLobbyView('SELECTION')} className="absolute top-4 left-4 text-xs text-gray-500 hover:text-[#39FF14] tracking-widest font-mono">← ABORT</button>
                   <h2 className="text-2xl font-black text-white mb-8 tracking-widest mt-4">HOST PRIVATE DUEL</h2>
                   
                   <div className="w-full mb-6">
                     <p className="text-[#39FF14] font-mono text-sm mb-2 drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">DUEL WAGER (SEIS)</p>
                     <input type="number" step="0.1" value={hostWager} onChange={(e) => setHostWager(e.target.value)} className="w-full bg-black border-2 border-gray-800 text-white focus:border-[#39FF14] focus:outline-none rounded-lg p-4 font-mono text-xl" />
                   </div>

                   <div className="w-full mb-8">
                     <p className="text-[#39FF14] font-mono text-sm mb-2 drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">ENCRYPTED 4-DIGIT CODE</p>
                     <input type="text" maxLength={4} placeholder="0000" value={privateCode} onChange={(e) => setPrivateCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-4xl font-black bg-[#000000] border-2 border-gray-800 text-[#39FF14] focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.6)] focus:outline-none rounded-lg py-4 tracking-[1em] placeholder-gray-800" />
                   </div>
                   
                   <button onClick={async () => {
                     try {
                       await createPrivateDuel(privateCode, parseFloat(hostWager));
                       // Wait for event or manual join confirmation
                     } catch (e) {
                       console.error(e);
                     }
                   }} className="w-full py-4 bg-[#39FF14]/10 border border-[#39FF14] text-[#39FF14] font-black tracking-widest rounded-lg hover:bg-[#39FF14] hover:text-[#000000] transition-all disabled:opacity-50" disabled={privateCode.length !== 4 || !hostWager || isComputing}>INITIATE CSTORE</button>
                </div>
             )}

             {lobbyView === 'JOIN' && !isSearching && (
                <div className="w-full max-w-xl glass-panel p-8 bg-[#000000] border border-[#39FF14]/30 flex flex-col items-center justify-center rounded-xl relative mt-4">
                   <button onClick={() => setLobbyView('SELECTION')} className="absolute top-4 left-4 text-xs text-gray-500 hover:text-[#39FF14] tracking-widest font-mono">← ABORT</button>
                   <h2 className="text-2xl font-black text-white mb-8 tracking-widest mt-4">JOIN PRIVATE DUEL</h2>

                   <div className="w-full mb-8">
                     <p className="text-[#39FF14] font-mono text-sm mb-2 drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">ACCESS CODE</p>
                     <input type="text" maxLength={4} placeholder="0000" value={privateCode} onChange={(e) => setPrivateCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-4xl font-black bg-[#000000] border-2 border-gray-800 text-[#39FF14] focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.6)] focus:outline-none rounded-lg py-4 tracking-[1em] placeholder-gray-800" />
                   </div>
                   
                   <button 
                     onClick={async () => {
                        try {
                          await joinPrivateDuel("888", privateCode);
                          // ID 888 is hardcoded for private join demo, ideally we'd have a list
                        } catch (e) {
                          console.error(e);
                        }
                     }}
                     className="w-full py-4 bg-[#39FF14]/10 border border-[#39FF14] text-[#39FF14] font-black tracking-widest rounded-lg hover:bg-[#39FF14] hover:text-[#000000] transition-all disabled:opacity-50" disabled={privateCode.length !== 4 || isComputing}
                   >
                     EVALUATE CLOAD
                   </button>
                </div>
             )}
          </div>
        ) : (
          // DUEL ARENA UI
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex justify-center">
              
              <div className="w-full max-w-4xl relative glass-panel bg-black/80 border-[#39FF14]/20 p-12">
                
                {duelOutcome && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl"
                  >
                     <h1 className={`text-6xl font-black tracking-widest mb-4 ${duelOutcome === 'VICTORY' ? 'text-[#39FF14] drop-shadow-[0_0_30px_rgba(57,255,20,0.8)]' : duelOutcome === 'DEFEAT' ? 'text-red-600 drop-shadow-[0_0_30px_rgba(255,0,0,0.8)]' : 'text-gray-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]'}`}>
                       {duelOutcome}
                     </h1>
                     <p className="text-xl text-white mb-8">
                       {duelOutcome === 'VICTORY' ? `Payout Transferred: +${activePlay.wager.toFixed(2)} SEIS` : duelOutcome === 'DEFEAT' ? `Wager Lost: -${activePlay.wager.toFixed(2)} SEIS` : 'Wager Refunded (0 SEIS)'}
                     </p>
                     <button onClick={closeMatch} className="px-8 py-3 bg-white text-black font-bold border border-white hover:bg-black hover:text-white transition-all">RETURN TO LOBBY</button>
                  </motion.div>
                )}

                <div className="flex w-full justify-between items-center gap-8 relative z-10">
                  {/* Player Hand */}
                  <div className="flex flex-col items-center w-1/3">
                    <h3 className="text-xl font-bold text-[#39FF14] mb-2 tracking-wider drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">YOU</h3>
                    <motion.div
                      animate={isPlaying ? { y: [0, -40, 0, -40, 0, -40, 0], rotate: [0, -10, 10, -10, 10, -10, 0]} : {}}
                      transition={{ duration: 0.5, ease: "easeInOut", repeat: isPlaying ? Infinity : 0 }}
                      className={`w-48 h-48 flex items-center justify-center rounded-2xl transition-all duration-500 border ${duelOutcome === 'VICTORY' ? 'bg-[#39FF14]/20 shadow-[0_0_40px_rgba(57,255,20,0.5)] border-[#39FF14] scale-110 z-20' : 'bg-black border-gray-800'}`}
                    >
                      <svg className={`w-28 h-28 ${duelOutcome === 'VICTORY' ? 'text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.8)]' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <motion.path animate={{ d: playerPath }} transition={{ duration: duelOutcome ? 0.3 : 0 }} />
                      </svg>
                    </motion.div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-500 mb-2 font-bold tracking-widest">WAGER</p>
                    <p className="text-3xl font-bold text-white mb-4 bg-gray-900 border border-gray-700 px-6 py-2 rounded shadow-inner">{activePlay.wager.toFixed(2)} <span className="text-[#39FF14] text-xl">SEIS</span></p>
                    <p className="text-xs text-gray-600 font-bold tracking-widest">[ TEE ENCLAVE ]</p>
                  </div>

                  {/* Opponent Hand */}
                  <div className="flex flex-col items-center w-1/3 relative">
                    <h3 className="text-xl font-bold text-gray-500 mb-2 tracking-wider truncate max-w-full" title={activePlay.player1ShadowName}>{activePlay.player1ShadowName}</h3>
                    <motion.div
                      animate={isPlaying ? { y: [0, -40, 0, -40, 0, -40, 0], rotate: [0, 10, -10, 10, -10, 10, 0]} : {}}
                      transition={{ duration: 0.5, ease: "easeInOut", repeat: isPlaying ? Infinity : 0 }}
                      className={`w-48 h-48 flex items-center justify-center rounded-2xl transition-all duration-500 border ${duelOutcome === 'DEFEAT' ? 'bg-red-900/40 shadow-[0_0_40px_rgba(255,0,0,0.5)] border-red-500 scale-110 z-20' : 'bg-black border-gray-800'}`}
                    >
                      <svg 
                        className={`w-28 h-28 ${isPlaying ? 'text-[#39FF14]/50 mix-blend-screen scale-110 drop-shadow-[0_0_20px_rgba(57,255,20,0.8)]' : duelOutcome === 'DEFEAT' ? 'text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]' : 'text-gray-300'}`} 
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ filter: isPlaying ? 'url(#glitch)' : 'none' }}
                      >
                        <motion.path animate={{ d: opponentPath }} transition={{ duration: duelOutcome ? 0.3 : 0 }} />
                      </svg>
                    </motion.div>
                  </div>
                </div>

                {/* Move Controls */}
                {!duelOutcome && (
                  <div className={`mt-16 flex flex-col items-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-100'}`}>
                    <p className="text-[#39FF14] mb-4 font-bold tracking-widest text-sm animate-pulse">
                        {isPlaying ? "WAITING FOR ON-CHAIN RESOLUTION..." : "MATCH SECURED: SELECT YOUR ENCRYPTED SHAPE"}
                    </p>
                    <div className="flex gap-4">
                      {["ROCK", "PAPER", "SCISSORS"].map((move) => (
                         <button 
                           key={move}
                           onClick={() => handleThrow(move as Move)}
                           disabled={isPlaying || isComputing}
                           className="px-8 py-4 bg-transparent border-2 border-gray-600 text-white font-bold text-xl rounded hover:border-[#39FF14] hover:text-[#39FF14] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all font-mono disabled:opacity-30"
                         >
                           {move}
                         </button>
                      ))}
                    </div>
                    {isPlaying && (
                        <button 
                            onClick={() => resolveDuel(activePlay.id)}
                            className="mt-8 px-6 py-2 bg-white/10 border border-white/20 text-white text-xs rounded hover:bg-white/20 transition-all font-mono"
                        >
                            FORCE RESOLVE (CALL TEE)
                        </button>
                    )}
                  </div>
                )}
                
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <svg width="0" height="0" className="hidden">
        <filter id="glitch">
          <feTurbulence type="fractalNoise" baseFrequency="0.2 0.7" numOctaves="3" result="warp" />
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="15" in="SourceGraphic" in2="warp" />
        </filter>
      </svg>
    </div>
  )
}

export default App
