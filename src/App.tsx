import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// SVG Paths for HandMorph
const SVGS = {
  FIST: "M 8 4 L 16 4 L 20 12 L 16 20 L 8 20 L 4 12 Z", // Closed Octagon
  ROCK: "M 12 3 A 9 9 0 0 0 3 12 A 9 9 0 0 0 12 21 A 9 9 0 0 0 21 12 A 9 9 0 0 0 12 3 Z", // Circle (Rock)
  PAPER: "M 4 3 L 20 3 L 20 21 L 4 21 Z", // Rectangle (Paper)
  SCISSORS: "M 6 6 L 18 18 M 18 6 L 6 18", // Cross (Scissors)
};

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<"ROCK" | "PAPER" | "SCISSORS" | null>(null);
  const [balance, setBalance] = useState("--- SEIS");
  const [isSignReading, setIsSignReading] = useState(true);

  useEffect(() => {
    // Simulate Signed Read for Shielded Balance
    const fetchBalance = async () => {
      await new Promise(r => setTimeout(r, 1500));
      setBalance("10.5 SEIS");
      setIsSignReading(false);
    };
    fetchBalance();
  }, []);

  const playRound = async () => {
    setIsPlaying(true);
    setResult(null);
    // Simulate Seismic Encrypted Transaction & Block Finality
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Morph outcome
    const outcomes: Array<"ROCK" | "PAPER" | "SCISSORS"> = ["ROCK", "PAPER", "SCISSORS"];
    setResult(outcomes[Math.floor(Math.random() * outcomes.length)]);
    setIsPlaying(false);
  };

  const currentPath = isPlaying || !result ? SVGS.FIST : SVGS[result];

  return (
    <div className="min-h-screen bg-seismic-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-seismic-accent/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-seismic-accent/5 rounded-full blur-[100px]" />

      {/* Header / Dashboard */}
      <header className="glass-panel w-full max-w-4xl p-6 mb-12 flex justify-between items-center z-10 border border-white/10 bg-black/40">
        <div>
          <h1 className="text-3xl font-bold tracking-widest neon-text text-seismic-accent">SHADOW DUEL</h1>
          <p className="text-sm text-gray-400 mt-1">Encrypted RPS on Seismic Testnet</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-seismic-accent animate-pulse" />
            <span className="text-gray-300">Connected</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isSignReading && <span className="w-3 h-3 border-2 border-seismic-accent border-t-transparent rounded-full animate-spin"></span>}
            <p className="text-lg font-mono text-white">Bal: {balance}</p>
          </div>
          <p className="text-sm text-gray-500">Rank: Shadow Ninja</p>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="glass-panel border-white/10 bg-black/40 w-full max-w-2xl p-12 flex flex-col items-center z-10">
        <div className="h-64 flex items-center justify-center mb-8">
          <motion.div
            animate={
              isPlaying ? {
                y: [0, -30, 0, -30, 0, -30, 0], // 3-beat Shake
                rotate: [0, -10, 10, -10, 10, -10, 0]
              } : {}
            }
            transition={{ duration: 0.6, ease: "easeInOut", repeat: isPlaying ? Infinity : 0 }}
            className={`w-48 h-48 flex flex-col items-center justify-center rounded-3xl transition-all duration-500 ${result ? 'bg-seismic-accent/10 neon-glow border border-seismic-accent/50 scale-110' : 'bg-gray-900 border border-gray-800'}`}
          >
            <svg 
              className={`w-28 h-28 ${result ? 'text-seismic-accent drop-shadow-[0_0_15px_rgba(57,255,20,0.8)]' : 'text-gray-500 drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]'}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <motion.path
                animate={{ d: currentPath }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </svg>
            {result && !isPlaying && (
              <span className="text-xl mt-4 font-bold text-seismic-accent neon-text">{result}</span>
            )}
          </motion.div>
        </div>

        <button 
          onClick={playRound}
          disabled={isPlaying || isSignReading}
          className="px-8 py-4 bg-seismic-accent text-[#0B0B0B] font-bold text-xl rounded-full hover:bg-white hover:text-black transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(57,255,20,0.4)]"
        >
          {isPlaying ? "SUBMITTING (ENCRYPTED)..." : "ENGAGE DUEL"}
        </button>
      </main>

    </div>
  )
}

export default App
