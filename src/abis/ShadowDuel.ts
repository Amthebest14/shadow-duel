export const shadowDuelAbi = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "suint", "name": "_code", "type": "uint256" }, { "internalType": "suint", "name": "_wager", "type": "uint256" }],
    "name": "createPrivateGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "duelId", "type": "uint256" }, { "internalType": "suint", "name": "_attemptCode", "type": "uint256" }],
    "name": "joinPrivateGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "suint", "name": "_wager", "type": "uint256" }],
    "name": "joinRandomQueue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "duelId", "type": "uint256" }, { "internalType": "suint", "name": "_move", "type": "uint256" }],
    "name": "commitMove",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "duelId", "type": "uint256" }],
    "name": "resolveDuel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "uint256", "name": "duelId", "type": "uint256" }, { "indexed": false, "internalType": "bool", "name": "isPrivate", "type": "bool" }, { "indexed": true, "internalType": "address", "name": "creator", "type": "address" }],
    "name": "DuelCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "uint256", "name": "duelId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "player", "type": "address" }],
    "name": "PlayerJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "uint256", "name": "duelId", "type": "uint256" }],
    "name": "MatchFound",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "uint256", "name": "duelId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "player", "type": "address" }],
    "name": "MoveCommitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "uint256", "name": "duelId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "winner", "type": "address" }],
    "name": "DuelResolved",
    "type": "event"
  }
] as const;
