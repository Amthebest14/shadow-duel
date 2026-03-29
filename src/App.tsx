import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSeismic } from './seismic-provider';
import { useAccount } from 'wagmi';
import { useDuel, type Move } from './hooks/useDuel';

const SVGS = {
  FIST: "M 8 4 L 16 4 L 20 12 L 16 20 L 8 20 L 4 12 Z", 
  ROCK: "M 12 3 A 9 9 0 0 0 3 12 A 9 9 0 0 0 12 21 A 9 9 0 0 0 21 12 A 9 9 0 0 0 12 3 Z", 
  PAPER: "M 4 3 L 20 3 L 20 21 L 4 21 Z", 
  SCISSORS: "M 6 6 L 18 18 M 18 6 L 6 18", 
};

const GLITCH_PATHS = [SVGS.FIST, SVGS.ROCK, SVGS.PAPER, SVGS.SCISSORS];

function App() {
  const { isConnected } = useAccount();
  const { isReady, walletBalance, refreshBalance } = useSeismic();
  const { duelAI, isComputing, lastResolution, setLastResolution, depositHouseFunds } = useDuel();

  // Mode Selection
  const [inArena, setInArena] = useState(false);
  
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
       
       // Map AI move int back to Move type
       const aiMoveStr: Move = lastResolution.aiMove === 1 ? "ROCK" : lastResolution.aiMove === 2 ? "PAPER" : "SCISSORS";
       setOpponentResult(aiMoveStr);

       // Winner detection
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

  const playerPath = isPlaying || (!playerResult && !duelOutcome) ? SVGS.FIST : (playerResult ? SVGS[playerResult] : SVGS.FIST);
  const opponentPath = isPlaying ? GLITCH_PATHS[glitchIndex] : (!opponentResult ? SVGS.FIST : SVGS[opponentResult]);

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center p-6 relative overflow-x-hidden font-mono antialiased">
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-[#39FF14]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Dashboard */}
      <header className="glass-panel w-full max-w-5xl p-6 mb-8 flex justify-between items-center z-20 border border-white/10 bg-black/40 rounded-xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">SHADOW DUEL</h1>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-tight">Encrypted RPS vs Enclave AI</p>
          <p className="text-xs text-[#39FF14]/50 mt-1 font-mono">ENCLAVE: 0xC296a75fd7cDb9500f8639BE3d35D29f66941C87</p>
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
          <ConnectButton />
        </div>
      </header>

      {/* Arena / Matchmaking View */}
      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center relative z-10 py-12">
        {!inArena ? (
           <div className="max-w-md w-full flex flex-col gap-8 text-center bg-black/40 p-12 border border-white/5 rounded-3xl backdrop-blur-xl">
              <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black text-white italic tracking-tighter">THE ARENA AWAITS</h2>
                <p className="text-gray-500 text-sm uppercase tracking-[0.2em]">Challenge the Shadow AI Enclave</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                 <button 
                  onClick={() => setInArena(true)}
                  className="group relative overflow-hidden bg-[#39FF14] text-black px-8 py-6 rounded-2xl font-black text-xl hover:scale-[1.02] transition-all active:scale-95 shadow-[0_0_30px_rgba(57,255,20,0.3)]"
                 >
                    <span className="relative z-10 tracking-[0.1em]">ENTER SHADOW ARENA</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                 </button>
                 
                 <div className="flex flex-col gap-1 items-center justify-center opacity-50">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Wager Requirement</p>
                    <p className="text-sm font-bold text-[#39FF14]">0.01 SEIS</p>
                 </div>
              </div>

              <button 
                onClick={() => depositHouseFunds('0.1')}
                className="text-[10px] text-white/20 hover:text-[#39FF14] transition-colors border border-white/5 py-2 px-4 rounded-xl mt-8"
              >
                [ DEBUG: FUND HOUSE BANK 0.1 SEIS ]
              </button>
           </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Hand Duel Display */}
            <div className="flex items-center justify-between w-full max-w-4xl px-8 mb-16 relative">
              <div className="text-center group">
                <p className="mb-8 text-[#39FF14] font-black tracking-[0.3em] text-xs uppercase opacity-70">You</p>
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
                  [ TEE Enclave <br/> Protected ]
                </p>
              </div>

              <div className="text-center">
                <p className="mb-8 text-[#39FF14] font-black tracking-[0.3em] text-xs uppercase opacity-70">Shadow AI</p>
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

            {/* Controls */}
            <div className="w-full flex flex-col items-center gap-12">
               <div className="text-center">
                 <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mb-4">
                   {isPlaying ? "SIMULATING OUTCOME..." : (duelOutcome ? "DUEL RESOLVED" : "SELECT YOUR ENCRYPTED SHAPE")}
                 </p>
                 
                 <div className="flex gap-4">
                    {["ROCK", "PAPER", "SCISSORS"].map((move) => (
                      <button
                        key={move}
                        disabled={isPlaying || !!duelOutcome || isComputing}
                        onClick={() => handleThrow(move as Move)}
                        className={`w-28 py-6 rounded-2xl font-black text-xs tracking-widest border transition-all duration-300 hover:scale-105 active:scale-95 ${
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

               {/* Outcome Modal / Actions */}
               {(duelOutcome || isComputing) && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-6"
                 >
                    {isComputing ? (
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-12 py-4 rounded-2xl backdrop-blur-md">
                        <div className="w-4 h-4 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold text-white tracking-[0.2em]">WAITING FOR TEE ENCLAVE...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-8">
                        <div className={`px-16 py-6 rounded-3xl border-2 flex flex-col items-center gap-2 transform -skew-x-12 ${
                          duelOutcome === "VICTORY" ? "bg-[#39FF14] border-[#39FF14] text-black shadow-[0_0_60px_rgba(57,255,20,0.4)]" :
                          duelOutcome === "DEFEAT" ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]" :
                          "bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]"
                        }`}>
                           <p className="text-5xl font-black italic tracking-tighter leading-none">{duelOutcome}</p>
                           <p className="text-[10px] font-bold uppercase tracking-[0.5em] opacity-60">Result Recorded</p>
                        </div>
                        
                        <button 
                          onClick={resetMatch}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-2xl text-xs font-black tracking-widest transition-all hover:scale-105 active:scale-95"
                        >
                          PLAY ANOTHER MATCH
                        </button>
                      </div>
                    )}
                 </motion.div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-auto z-10 flex justify-between p-6 opacity-30">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black tracking-widest">SHADOW_DUEL_V2.0_STABLE</p>
          <p className="text-[8px] font-bold text-gray-500">ENCRYPTED INPUTS SECURED BY TEE</p>
        </div>
        <div className="text-right text-[10px] font-black tracking-widest group cursor-default">
           BUILT_ON_SEISMIC <span className="text-[#39FF14] group-hover:animate-pulse">_</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
