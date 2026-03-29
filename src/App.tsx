import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSeismic } from './seismic-provider';
import { useDuel, type Move } from './hooks/useDuel';

const SVGS = {
  FIST: "M 8 4 L 16 4 L 20 12 L 16 20 L 8 20 L 4 12 Z", 
  ROCK: "M 12 3 A 9 9 0 0 0 3 12 A 9 9 0 0 0 12 21 A 9 9 0 0 0 21 12 A 9 9 0 0 0 12 3 Z", 
  PAPER: "M 4 3 L 20 3 L 20 21 L 4 21 Z", 
  SCISSORS: "M 6 6 L 18 18 M 18 6 L 6 18", 
};

const GLITCH_PATHS = [SVGS.FIST, SVGS.ROCK, SVGS.PAPER, SVGS.SCISSORS];

function App() {
  const { isReady, walletBalance, refreshBalance } = useSeismic();
  const { duelAI, isComputing, lastResolution, setLastResolution, depositHouseFunds, leaderboard, userAddress } = useDuel();

  // Mode Selection
  const [inArena, setInArena] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
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
    setInArena(true);
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
    <div className="min-h-screen bg-[#000000] flex flex-col items-center p-6 relative overflow-x-hidden font-mono antialiased text-white">
      {/* Background Ambience */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-[#39FF14]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Dashboard */}
      <header className="glass-panel w-full max-w-5xl p-6 mb-8 flex justify-between items-center z-20 border border-white/10 bg-black/40 rounded-xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">SHADOW DUEL</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-tight">ENCRYPTED ENCLAVE PVP (POINTS SYSTEM v2.0)</p>
          {userAddress && (
            <div className="flex items-center gap-3 mt-1">
               <span className="text-[10px] bg-[#39FF14]/10 text-[#39FF14] px-2 py-0.5 rounded border border-[#39FF14]/20 font-bold">
                 POINTS: {myStats?.points || 0}
               </span>
               <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/10 font-bold">
                 WINS: {myStats?.wins || 0}
               </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          {userAddress && (
             <div className="text-right flex flex-col items-end">
               <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-[#39FF14] animate-pulse' : 'bg-yellow-500'}`} />
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                    {isReady ? `TEE SECURED` : 'Connecting Vault...'}
                 </span>
               </div>
               <div className="mt-1">
                 <p className="text-xl font-bold font-mono text-white tracking-widest bg-black px-4 py-1 border border-white/10 rounded-lg shadow-inner">
                   <span className="text-[#39FF14]">{walletBalance || "0.0000 SEIS"}</span>
                 </p>
               </div>
             </div>
          )}
          <ConnectButton />
        </div>
      </header>

      {/* Main Arena / Lobby */}
      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center relative z-10 py-12">
        {showLeaderboard ? (
           <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl glass-panel border border-white/10 bg-black/80 p-12 rounded-[2rem] backdrop-blur-2xl shadow-2xl relative"
           >
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
              >
                [ CLOSE ]
              </button>
              
              <div className="flex justify-between items-end mb-12">
                 <div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">THE TOP SHADOWS</h2>
                    <p className="text-[#39FF14] text-[10px] uppercase tracking-[0.4em] font-bold">150 PTS / WIN | 50 PTS / LOSS</p>
                 </div>
                 <div className="text-right">
                    <p className="text-gray-600 text-[10px] uppercase tracking-widest">Global Field</p>
                    <p className="text-2xl font-black text-white">{leaderboard.length}</p>
                 </div>
              </div>

              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {leaderboard.map((entry, idx) => (
                    <div 
                        key={entry.address}
                        className={`flex justify-between items-center p-5 rounded-2xl border transition-all ${
                            userAddress && entry.address.toLowerCase() === userAddress.toLowerCase() 
                                ? "bg-[#39FF14]/10 border-[#39FF14]/30 shadow-[0_0_20px_rgba(57,255,20,0.1)]" 
                                : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                        }`}
                    >
                       <div className="flex items-center gap-6">
                          <span className={`text-xl font-black italic w-8 ${idx < 3 ? 'text-[#39FF14]' : 'text-gray-700'}`}>#{idx + 1}</span>
                          <span className="text-sm font-bold text-gray-300 tracking-wider font-mono">
                             {formatAddress(entry.address)}
                          </span>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Wins</span>
                            <span className="text-sm font-black text-white/60">{entry.wins}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-[#39FF14] uppercase tracking-widest font-black">Points</span>
                            <span className="text-2xl font-black text-white">{entry.points}</span>
                          </div>
                       </div>
                    </div>
                 ))}
                 
                 {leaderboard.length === 0 && (
                    <div className="text-center py-20 opacity-20 italic">
                       Establishing connection to Enclave data...
                    </div>
                 )}
              </div>
           </motion.div>
        ) : !inArena ? (
           <div className="max-w-2xl w-full flex flex-col gap-12 items-center text-center">
              <div className="flex flex-col gap-4">
                <h2 className="text-7xl font-black text-white italic tracking-tighter leading-none mb-2">SHADOW<br/><span className="text-[#39FF14] drop-shadow-[0_0_30px_rgba(57,255,20,0.5)]">ARENA</span></h2>
                <p className="text-gray-500 text-sm uppercase tracking-[0.4em] font-bold">Instant Resolution | Enclave Protected</p>
              </div>
              
              <div className="flex flex-col gap-6 w-full max-w-md">
                 <button 
                  onClick={() => setInArena(true)}
                  className="group relative overflow-hidden bg-white text-black px-12 py-8 rounded-3xl font-black text-2xl hover:scale-[1.05] transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                 >
                    <span className="relative z-10 tracking-[0.1em]">ENTER ARENA (0.01 SEIS)</span>
                    <div className="absolute inset-0 bg-gray-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                 </button>

                 <button 
                  onClick={() => setShowLeaderboard(true)}
                  className="group relative overflow-hidden bg-transparent border-2 border-[#39FF14] text-[#39FF14] px-12 py-8 rounded-3xl font-black text-2xl hover:scale-[1.05] transition-all active:scale-95 shadow-[0_0_30px_rgba(57,255,20,0.2)]"
                 >
                    <span className="relative z-10 tracking-[0.1em]">VIEW ENCLAVE RANKINGS</span>
                    <div className="absolute inset-0 bg-[#39FF14]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                 </button>
              </div>

              <div className="flex gap-12 opacity-40">
                 <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase tracking-widest text-[#39FF14]">Win Reward</p>
                    <p className="text-xl font-black">150 PTS</p>
                 </div>
                 <div className="w-[1px] h-full bg-white/10" />
                 <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase tracking-widest text-white">Loss Effort</p>
                    <p className="text-xl font-black">50 PTS</p>
                 </div>
              </div>

              <button 
                onClick={() => depositHouseFunds('0.1')}
                className="text-[10px] text-white/10 hover:text-[#39FF14] transition-colors mt-4"
              >
                [ FORCE REFILL ENCLAVE BANK ]
              </button>
           </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Arena HUD */}
            <div className="flex items-center justify-between w-full max-w-4xl px-8 mb-16 relative">
              <div className="text-center group">
                <p className="mb-8 text-[#39FF14] font-black tracking-[0.3em] text-[10px] uppercase opacity-70">You</p>
                <div className={`w-64 h-80 glass-panel rounded-3xl border border-white/10 flex items-center justify-center relative transition-all duration-500 ${isPlaying ? 'animate-bounce' : ''}`}>
                   <svg viewBox="0 0 24 24" className={`w-36 h-36 fill-none stroke-[#39FF14] stroke-[0.5] drop-shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all duration-300`}>
                     <path d={playerPath} />
                   </svg>
                   {playerResult && !isPlaying && (
                     <div className="absolute -bottom-4 bg-white/5 border border-white/10 px-4 py-1 rounded-full backdrop-blur-md">
                       <span className="text-[10px] text-gray-400 font-bold tracking-tighter uppercase">{playerResult}</span>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 py-12 z-10">
                <div className="bg-black/80 border border-white/10 px-8 py-4 rounded-2xl backdrop-blur-xl shadow-2xl text-center flex flex-col gap-1">
                   <p className="text-[8px] text-gray-500 font-black tracking-widest uppercase">Wager</p>
                   <p className="text-2xl font-black text-white tracking-widest leading-none">0.01</p>
                   <p className="text-[10px] text-[#39FF14] font-bold">SEIS</p>
                </div>
                <div className="h-12 w-[1px] bg-gradient-to-b from-white/0 via-white/20 to-white/0" />
                <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.4em] select-none text-center">
                  [ 40% WIN PROBABILITY <br/> NO DRAWS ]
                </p>
              </div>

              <div className="text-center">
                <p className="mb-8 text-[#39FF14] font-black tracking-[0.3em] text-[10px] uppercase opacity-70">Shadow AI</p>
                <div className={`w-64 h-80 bg-white/[0.02] rounded-3xl border border-white/5 flex items-center justify-center relative transition-all duration-500 ${isPlaying ? 'animate-bounce delay-75 shadow-[0_0_50px_rgba(57,255,20,0.1)]' : ''}`}>
                   <svg viewBox="0 0 24 24" className={`w-36 h-36 fill-none stroke-white/20 stroke-[0.5] filter transition-all duration-300 ${isPlaying ? 'blur-sm scale-110 opacity-100 invert' : 'opacity-40'}`}>
                     <path d={opponentPath} />
                   </svg>
                   {opponentResult && !isPlaying && (
                     <div className="absolute -bottom-4 bg-[#39FF14]/10 border border-[#39FF14]/20 px-4 py-1 rounded-full backdrop-blur-md">
                       <span className="text-[10px] text-[#39FF14] font-bold tracking-tighter uppercase">{opponentResult}</span>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Selection Grid */}
            <div className="w-full flex flex-col items-center gap-12">
               <div className="text-center">
                 <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mb-6">
                   {isPlaying ? "TEE ENCLAVE COMPUTING RESULT..." : (duelOutcome ? "TRANSACTION FINALIZED" : "SELECT YOUR MOVE")}
                 </p>
                 
                 <div className="flex gap-4">
                    {["ROCK", "PAPER", "SCISSORS"].map((move) => (
                      <button
                        key={move}
                        disabled={isPlaying || !!duelOutcome || isComputing}
                        onClick={() => handleThrow(move as Move)}
                        className={`w-32 py-8 rounded-3xl font-black text-[10px] tracking-widest border transition-all duration-300 hover:scale-105 active:scale-95 ${
                          playerResult === move 
                            ? "bg-[#39FF14] border-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.4)]" 
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {move}
                      </button>
                    ))}
                 </div>
               </div>

               {/* Outcome Reveal */}
               {(duelOutcome || isComputing) && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-6"
                 >
                    {isComputing ? (
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-12 py-4 rounded-2xl backdrop-blur-md">
                        <div className="w-4 h-4 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-bold text-white tracking-[0.2em]">ENCRYPTED PAYOUT PENDING...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-8">
                        <div className={`px-24 py-8 rounded-[2rem] border-2 flex flex-col items-center gap-1 transform -skew-x-12 ${
                          duelOutcome === "VICTORY" ? "bg-[#39FF14] border-[#39FF14] text-black shadow-[0_0_60px_rgba(57,255,20,0.4)]" :
                          duelOutcome === "DEFEAT" ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]" :
                          "bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]"
                        }`}>
                           <p className="text-6xl font-black italic tracking-tighter leading-none">{duelOutcome}</p>
                           <p className="text-[12px] font-bold uppercase tracking-[0.4em] opacity-80">
                             +{lastResolution?.pointsEarned || 0} POINTS
                           </p>
                        </div>
                        
                        <div className="flex gap-4">
                             <button 
                                onClick={resetMatch}
                                className="bg-[#39FF14] text-black px-10 py-5 rounded-2xl text-xs font-black tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                                PLAY AGAIN
                            </button>
                            <button 
                                onClick={() => { setShowLeaderboard(true); resetMatch(); }}
                                className="bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl text-xs font-black tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                                VIEW RANKINGS
                            </button>
                        </div>
                      </div>
                    )}
                 </motion.div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-5xl mt-auto z-10 flex justify-between p-6 opacity-30 border-t border-white/5">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black tracking-widest uppercase">SHADOW_DUEL_V2.75_POINTS</p>
          <p className="text-[8px] font-bold text-gray-500 uppercase">TE-ENCLAVE SECURED | ANTI-COLLISION SHIELD ACTIVE</p>
        </div>
        <div className="text-right text-[10px] font-black tracking-widest group cursor-default">
           STAGED_FOR_PRODUCTION <span className="text-[#39FF14] group-hover:animate-pulse">_</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
