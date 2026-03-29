import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSeismic } from './seismic-provider';
import { useDuel, type Move } from './hooks/useDuel';
import { LiquidShadow } from './components/LiquidShadow';

const SVGS = {
  FIST: "M 8 4 L 16 4 L 20 12 L 16 20 L 8 20 L 4 12 Z", 
  ROCK: "M 12 3 A 9 9 0 0 0 3 12 A 9 9 0 0 0 12 21 A 9 9 0 0 0 21 12 A 9 9 0 0 0 12 3 Z", 
  PAPER: "M 4 3 L 20 3 L 20 21 L 4 21 Z", 
  SCISSORS: "M 6 6 L 18 18 M 18 6 L 6 18", 
};

const GLITCH_PATHS = [SVGS.FIST, SVGS.ROCK, SVGS.PAPER, SVGS.SCISSORS];

type View = "MENU" | "ARENA" | "LEADERBOARD";

function App() {
  const { isReady, walletBalance, refreshBalance } = useSeismic();
  const { duelAI, isComputing, lastResolution, setLastResolution, depositHouseFunds, leaderboard, userAddress } = useDuel();

  // Navigation State
  const [currentView, setCurrentView] = useState<View>("MENU");
  
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
      }, 75); 
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle PvE resolution
  useEffect(() => {
    if (lastResolution) {
       setIsPlaying(false);
       
       const aiMoveStr: Move = lastResolution.aiMove === 1 ? "ROCK" : lastResolution.aiMove === 2 ? "PAPER" : "SCISSORS";
       setOpponentResult(aiMoveStr);

       if (lastResolution.winner === "0x0000000000000000000000000000000000000000") {
         setDuelOutcome("DRAW");
       } else if (lastResolution.payout !== "0") {
         setDuelOutcome("VICTORY");
       } else {
         setDuelOutcome("DEFEAT");
       }
       
       refreshBalance();
    }
  }, [lastResolution, refreshBalance]);

  const handleThrow = async (selectedMove: Move) => {
    setPlayerResult(selectedMove);
    setIsPlaying(true);
    setDuelOutcome(null);
    setOpponentResult(null);

    try {
      await duelAI(selectedMove);
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  const resetMatch = () => {
    setLastResolution(null);
    setPlayerResult(null);
    setOpponentResult(null);
    setDuelOutcome(null);
    setIsPlaying(false);
  };

  const formatAddress = (addr: string) => {
    if (userAddress && addr.toLowerCase() === userAddress.toLowerCase()) {
        return <span className="text-[#39FF14] font-bold">YOU ({addr.slice(0, 6)}...{addr.slice(-4)})</span>;
    }
    return `${addr.slice(0, 4)}***${addr.slice(-4)}`;
  };

  const myStats = useMemo(() => {
    if (!userAddress) return null;
    return leaderboard.find(e => e.address.toLowerCase() === userAddress.toLowerCase());
  }, [leaderboard, userAddress]);

  const playerPath = isPlaying || (!playerResult && !duelOutcome) ? SVGS.FIST : (playerResult ? SVGS[playerResult] : SVGS.FIST);
  const opponentPath = isPlaying ? GLITCH_PATHS[glitchIndex] : (!opponentResult ? SVGS.FIST : SVGS[opponentResult]);

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center p-6 relative overflow-x-hidden font-mono antialiased text-white selection:bg-[#39FF14] selection:text-black">
      
      {/* Visual WoW Layer: WebGL Fluid Background */}
      <LiquidShadow />

      {/* Header Dashboard */}
      <header className="glass-panel w-full max-w-5xl p-5 mb-8 flex justify-between items-center z-50 border border-white/10 bg-black/40 rounded-2xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-6">
          {currentView !== "MENU" && (
            <button 
              onClick={() => { resetMatch(); setCurrentView("MENU"); }}
              className="bg-white/5 hover:bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(57,255,20,0.1)]"
            >
              ← BACK_TO_MENU
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-widest text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)] leading-none">SHADOW DUEL</h1>
            {userAddress && (
                <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">
                   POINTS_RANK: <span className="text-[#39FF14]">{myStats?.points || 0} PTS</span>
                </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {userAddress && (
             <div className="text-right flex flex-col items-end">
               <div className="flex items-center gap-2">
                 <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-[#39FF14] animate-pulse' : 'bg-yellow-500'}`} />
                 <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">ENCLAVE_READY</span>
               </div>
               <div className="mt-1">
                 <p className="text-lg font-bold font-mono text-white tracking-widest bg-black/60 px-4 py-1 border border-white/5 rounded-lg shadow-inner">
                   {walletBalance || "0.0000 SEIS"}
                 </p>
               </div>
             </div>
          )}
          <ConnectButton />
        </div>
      </header>

      {/* Content Sections */}
      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center relative z-10 py-6">
        <AnimatePresence mode="wait">
          {currentView === "MENU" && (
             <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl w-full flex flex-col gap-12 items-center text-center py-12"
             >
                <div className="flex flex-col gap-4 relative">
                  <div className="absolute inset-0 bg-[#39FF14]/10 blur-[80px] rounded-full pointer-events-none" />
                  <h2 className="text-8xl font-black text-white italic tracking-tighter leading-[0.85] mb-2 drop-shadow-2xl">SHADOW<br/><span className="text-[#39FF14] drop-shadow-[0_0_30px_rgba(57,255,20,0.6)]">ARENA</span></h2>
                  <p className="text-gray-500 text-xs uppercase tracking-[0.5em] font-black opacity-80">PROTOTYPE_v3.5_STABLE  |  TEE_ENCLAVE</p>
                </div>
                
                <div className="flex flex-col gap-8 w-full max-w-lg">
                   <motion.button 
                    whileHover={{ scale: 1.05, rotateZ: 1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView("ARENA")}
                    className="group relative overflow-hidden bg-white text-black px-12 py-10 rounded-[2.5rem] font-black text-3xl transition-transform shadow-[0_20px_60px_-15px_rgba(255,255,255,0.2)]"
                   >
                      <span className="relative z-10 tracking-tighter">ENTER ARENA</span>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-[#39FF14] scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gray-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                   </motion.button>

                   <motion.button 
                    whileHover={{ scale: 1.05, rotateZ: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView("LEADERBOARD")}
                    className="group relative overflow-hidden bg-black/40 border-2 border-[#39FF14] text-[#39FF14] px-12 py-10 rounded-[2.5rem] font-black text-3xl transition-transform shadow-[0_0_40px_rgba(57,255,20,0.15)] backdrop-blur-xl"
                   >
                      <span className="relative z-10 tracking-tighter">THE RANKINGS</span>
                      <div className="absolute inset-0 bg-[#39FF14]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                   </motion.button>
                </div>

                <div className="flex gap-12 mt-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] text-gray-600 tracking-[0.4em] font-black">WAGER_REQUIREMENT</p>
                    <p className="text-lg font-black text-white">0.01 SEIS</p>
                  </div>
                  <div className="w-[1px] h-10 bg-white/10" />
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] text-gray-600 tracking-[0.4em] font-black">POOL_LIQUIDITY</p>
                    <p className="text-lg font-black text-[#39FF14]">SECURED</p>
                  </div>
                </div>
             </motion.div>
          )}

          {currentView === "LEADERBOARD" && (
             <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, x: 50, rotateY: 15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -50 }}
              style={{ perspective: 1000 }}
              className="w-full max-w-3xl glass-panel border border-white/10 bg-black/80 p-12 rounded-[3.5rem] backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] relative"
             >
                <div className="flex justify-between items-end mb-16 px-4">
                   <div>
                      <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">THE TOP SHADOWS</h2>
                      <p className="text-[#39FF14] text-[10px] uppercase tracking-[0.5em] font-black mt-4">Enclave Verified Ranking Protocol</p>
                   </div>
                   <div className="text-right">
                      <p className="text-gray-600 text-[10px] uppercase tracking-widest font-black">FIELD_SIZE</p>
                      <p className="text-4xl font-black text-white leading-none">{leaderboard.length}</p>
                   </div>
                </div>

                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                   {leaderboard.map((entry, idx) => (
                      <motion.div 
                          key={entry.address}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex justify-between items-center p-6 rounded-3xl border transition-all ${
                              userAddress && entry.address.toLowerCase() === userAddress.toLowerCase() 
                                  ? "bg-[#39FF14]/10 border-[#39FF14]/30 shadow-[0_0_30px_rgba(57,255,20,0.1)]" 
                                  : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                          }`}
                      >
                         <div className="flex items-center gap-8">
                            <span className={`text-2xl font-black italic w-12 text-center ${idx < 3 ? 'text-[#39FF14] drop-shadow-[0_0_10px_rgba(57,255,20,0.3)]' : 'text-gray-700'}`}>#{idx + 1}</span>
                            <span className="text-sm font-bold text-gray-200 tracking-[0.1em] font-mono">
                               {formatAddress(entry.address)}
                            </span>
                         </div>
                         <div className="flex items-center gap-12">
                            <div className="flex flex-col items-end opacity-40">
                              <span className="text-[8px] uppercase tracking-[0.4em] font-black mb-1">Total_Wins</span>
                              <span className="text-sm font-black text-white">{entry.wins}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-[#39FF14] uppercase tracking-[0.4em] font-black mb-1">Rank_Score</span>
                              <span className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{entry.points}</span>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </motion.div>
          )}

          {currentView === "ARENA" && (
            <motion.div 
              key="arena"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full flex flex-col items-center"
            >
              <div className="flex items-center justify-between w-full max-w-5xl px-8 mb-20 relative">
                <motion.div 
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-center group"
                >
                  <p className="mb-8 text-[#39FF14] font-black tracking-[0.5em] text-[12px] uppercase opacity-70">Enclave_User</p>
                  <div className={`w-72 h-96 glass-panel rounded-[3rem] border border-white/10 flex items-center justify-center relative transition-all duration-700 ${isPlaying ? 'animate-bounce shadow-[0_0_40px_rgba(57,255,20,0.1)]' : 'shadow-2xl'}`}>
                     <svg viewBox="0 0 24 24" className={`w-40 h-40 fill-none stroke-[#39FF14] stroke-[0.3] drop-shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all duration-300`}>
                       <path d={playerPath} />
                     </svg>
                  </div>
                </motion.div>

                <div className="flex flex-col items-center gap-6 py-12 z-10">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="bg-black/90 border-2 border-white/10 px-10 py-6 rounded-3xl backdrop-blur-xl shadow-2xl text-center flex flex-col gap-1 relative overflow-hidden"
                  >
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent animate-pulse" />
                     <p className="text-[10px] text-gray-500 font-black tracking-[0.5em] uppercase">Stake</p>
                     <p className="text-3xl font-black text-white italic">0.01</p>
                     <p className="text-[12px] text-[#39FF14] font-black tracking-widest">SEIS</p>
                  </motion.div>
                  <div className="h-20 w-[1px] bg-gradient-to-b from-transparent via-[#39FF14]/50 to-transparent" />
                </div>

                <motion.div 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-center"
                >
                  <p className="mb-8 text-[#39FF14] font-black tracking-[0.5em] text-[12px] uppercase opacity-70">Shadow_A.I</p>
                  <div className={`w-72 h-96 bg-white/[0.01] rounded-[3rem] border border-white/5 flex items-center justify-center relative transition-all duration-700 ${isPlaying ? 'animate-pulse scale-105 shadow-[0_0_80px_rgba(57,255,20,0.1)]' : 'opacity-40'}`}>
                     <svg viewBox="0 0 24 24" className={`w-40 h-40 fill-none stroke-white/20 stroke-[0.3] filter transition-all duration-300 ${isPlaying ? 'blur-[2px] invert brightness-200' : 'opacity-20'}`}>
                       <path d={opponentPath} />
                     </svg>
                  </div>
                </motion.div>
              </div>

              <div className="w-full flex flex-col items-center gap-16">
                 <div className="text-center">
                   <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.3em] mb-10 opacity-60">
                     {isPlaying ? "TEE_ENCLAVE: CALCULATING_RANDOM_STATE..." : (duelOutcome ? "GAME_SESSION_FINALIZED" : "SELECT_INPUT_HAND")}
                   </p>
                   
                   <div className="flex gap-6">
                      {["ROCK", "PAPER", "SCISSORS"].map((move) => (
                        <motion.button
                          key={move}
                          whileHover={{ scale: 1.1, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={isPlaying || !!duelOutcome || isComputing}
                          onClick={() => handleThrow(move as Move)}
                          className={`w-40 py-10 rounded-[2rem] font-black text-xs tracking-[0.3em] border-2 transition-all duration-500 ${
                            playerResult === move 
                              ? "bg-[#39FF14] border-[#39FF14] text-black shadow-[0_0_40px_rgba(57,255,20,0.5)]" 
                              : "bg-black/30 border-white/5 text-white/30 hover:bg-[#39FF14]/5 hover:border-[#39FF14]/30"
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {move}
                        </motion.button>
                      ))}
                   </div>
                 </div>

                 <AnimatePresence>
                   {(duelOutcome || isComputing) && (
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        className="flex flex-col items-center gap-8"
                     >
                        {isComputing ? (
                          <div className="flex items-center gap-4 bg-black/60 border border-[#39FF14]/30 px-16 py-6 rounded-3xl backdrop-blur-3xl shadow-[0_0_50px_rgba(57,255,20,0.1)]">
                            <div className="w-5 h-5 border-3 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-black text-white tracking-[0.3em]">SECURE_TEE_PAYOUT...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-12">
                            <div className={`px-28 py-10 rounded-[3rem] border-4 flex flex-col items-center gap-1 transform -skew-x-[15deg] transition-all duration-1000 ${
                              duelOutcome === "VICTORY" ? "bg-[#39FF14] border-[#39FF14] text-black shadow-[0_0_80px_rgba(57,255,20,0.6)]" :
                              duelOutcome === "DEFEAT" ? "bg-red-600/20 border-red-600 text-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]" :
                              "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                            }`}>
                               <p className="text-8xl font-black italic tracking-tighter leading-none mb-1">{duelOutcome}</p>
                               <div className="flex items-center gap-2 opacity-80">
                                 <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                 <p className="text-[14px] font-black uppercase tracking-[0.5em]">
                                   +{lastResolution?.pointsEarned || 0} POINTS_SYNCED
                                 </p>
                               </div>
                            </div>
                            
                            <div className="flex gap-6">
                               <button 
                                  onClick={resetMatch}
                                  className="bg-white text-black px-12 py-6 rounded-3xl text-xs font-black tracking-widest transition-all hover:scale-[1.05] active:scale-95 shadow-xl"
                              >
                                  CONTINUE_FIGHT
                              </button>
                               <button 
                                  onClick={() => { resetMatch(); setCurrentView("MENU"); }}
                                  className="bg-black border-2 border-white/10 text-white px-12 py-6 rounded-3xl text-xs font-black tracking-widest transition-all hover:bg-white/10"
                              >
                                  LEAVE_ARENA
                              </button>
                            </div>
                          </div>
                        )}
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Branded Status Bar */}
      <footer className="w-full max-w-5xl mt-auto z-50 flex justify-between p-8 opacity-20 border-t border-white/5">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-black tracking-[0.5em] uppercase">SHADOW_DUEL_v3.5_WEBGL_OVERHAUL</p>
          <p className="text-[9px] font-bold text-gray-600 uppercase">FULLY_DECENTRALIZED | TEE_AUTHENTICATED_SESSIONS</p>
        </div>
        <div className="text-right text-[11px] font-black tracking-[0.3em] group cursor-default">
           OPERATIONAL_ON_SEISMIC <span className="text-[#39FF14] group-hover:animate-pulse">_</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
