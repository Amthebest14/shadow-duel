import { useState } from 'react'
import { motion } from 'framer-motion'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [balance] = useState("10.5 SEIS");
  const [rank] = useState("Shadow Ninja");

  const playRound = async () => {
    setIsPlaying(true);
    setResult(null);
    // Simulate Seismic Encrypted Transaction & Block Finality
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Morph outcome
    const outcomes = ["ROCK", "PAPER", "SCISSORS"];
    setResult(outcomes[Math.floor(Math.random() * outcomes.length)]);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-seismic-accent/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-seismic-accent/5 rounded-full blur-[100px]" />

      {/* Header / Dashboard */}
      <header className="glass-panel w-full max-w-4xl p-6 mb-12 flex justify-between items-center z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-widest neon-text text-seismic-accent">SHADOW DUEL</h1>
          <p className="text-sm text-gray-400 mt-1">Encrypted RPS on Seismic Testnet</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-seismic-accent animate-pulse" />
            <span className="text-gray-300">Connected</span>
          </div>
          <p className="text-lg font-mono">Bal: {balance}</p>
          <p className="text-sm text-gray-500">Rank: {rank}</p>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="glass-panel w-full max-w-2xl p-12 flex flex-col items-center z-10">
        <div className="h-64 flex items-center justify-center mb-8">
          <motion.div
            animate={
              isPlaying ? {
                y: [0, -40, 0, -40, 0, -40, 0], // Shake
                rotate: [0, -10, 10, -10, 10, -10, 0]
              } : {}
            }
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`w-40 h-40 flex items-center justify-center rounded-3xl transition-colors duration-300 ${result ? 'bg-seismic-accent/20 neon-glow border border-seismic-accent/50' : 'bg-gray-800 border border-gray-700'}`}
          >
            {/* SVG placeholder for Hand Morph */}
            {result ? (
              <span className="text-3xl text-seismic-accent font-bold neon-text">{result}</span>
            ) : (
              <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                 <circle cx="12" cy="12" r="5" className={isPlaying ? "animate-ping text-seismic-accent" : ""} />
              </svg>
            )}
          </motion.div>
        </div>

        <button 
          onClick={playRound}
          disabled={isPlaying}
          className="px-8 py-4 bg-seismic-accent text-seismic-bg font-bold text-xl rounded-full hover:bg-white hover:text-black transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isPlaying ? "SUBMITTING (ENCRYPTED)..." : "ENGAGE DUEL"}
        </button>
      </main>

    </div>
  )
}

export default App
