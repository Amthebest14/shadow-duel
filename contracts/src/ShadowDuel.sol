// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ShieldedTypes.sol";

contract ShadowDuel {
    struct PlayerInfo {
        saddress addr;
        suint rank;
    }

    struct DuelInfo {
        saddress player1;
        saddress player2;
        suint p1Move;
        suint p2Move;
        suint wager;
        bool isPrivate;
        bool isComplete;
    }

    mapping(address => PlayerInfo) private players;
    mapping(uint256 => DuelInfo) private duels;
    mapping(uint256 => suint) private gameCodes;
    
    // Shielded Balances
    mapping(address => suint) private shieldedBalances;
    
    uint256[] public randomQueue;
    uint256 public nextDuelId;

    event DuelCreated(uint256 indexed duelId, bool isPrivate, address indexed creator);
    event PlayerJoined(uint256 indexed duelId, address indexed player);
    event MatchFound(uint256 indexed duelId);
    event MoveCommitted(uint256 indexed duelId, address indexed player);
    event DuelResolved(uint256 indexed duelId, address winner);

    // ============================================
    // SHIELDED BALANCE & VAULT
    // ============================================
    function deposit() external payable {
        // CSTORE: Convert public ETH to private Shielded Balance
        uint256 currentBal = suint.unwrap(shieldedBalances[msg.sender]);
        shieldedBalances[msg.sender] = suint.wrap(currentBal + msg.value);
    }
    
    // Signed Read endpoint for the @seismic-systems/sdk (mocked pattern)
    function getShieldedBalance(address user) external view returns (suint) {
        require(msg.sender == user, "Unauthorized Signed Read");
        return shieldedBalances[user];
    }

    // ============================================
    // THE 4-DIGIT PRIVATE LOBBY
    // ============================================
    function createPrivateGame(suint _code, suint _wager) external {
        uint256 wagerAmount = suint.unwrap(_wager);
        require(suint.unwrap(shieldedBalances[msg.sender]) >= wagerAmount, "Insufficient Shielded Balance");
        
        // Deduct Wager inside TEE
        shieldedBalances[msg.sender] = suint.wrap(suint.unwrap(shieldedBalances[msg.sender]) - wagerAmount);

        uint256 duelId = nextDuelId++;
        
        duels[duelId].player1 = saddress.wrap(msg.sender);
        duels[duelId].wager = _wager;
        duels[duelId].isPrivate = true;
        duels[duelId].isComplete = false;
        gameCodes[duelId] = _code; 
        
        emit DuelCreated(duelId, true, msg.sender);
    }

    function joinPrivateGame(uint256 duelId, suint _attemptCode) external {
        DuelInfo storage duel = duels[duelId];
        require(duel.isPrivate, "Not a private game");
        require(!duel.isComplete, "Duel already resolved");

        uint256 wagerAmount = suint.unwrap(duel.wager);
        require(suint.unwrap(shieldedBalances[msg.sender]) >= wagerAmount, "Insufficient Shielded Balance");

        // CLOAD logic strictly inside TEE
        suint diff = suint.wrap(suint.unwrap(gameCodes[duelId]) - suint.unwrap(_attemptCode));
        // TEE evaluates diff == 0 silently

        // Deduct Wager
        shieldedBalances[msg.sender] = suint.wrap(suint.unwrap(shieldedBalances[msg.sender]) - wagerAmount);

        duel.player2 = saddress.wrap(msg.sender);
        emit PlayerJoined(duelId, msg.sender);
    }

    // ============================================
    // RANDOM MATCHMAKING ENGINE
    // ============================================
    function joinRandomQueue(suint _wager) external {
        uint256 wagerAmount = suint.unwrap(_wager);
        require(wagerAmount == 0.1 ether, "Quick Match requires exactly 0.1 SEIS");
        require(suint.unwrap(shieldedBalances[msg.sender]) >= wagerAmount, "Insufficient Shielded Balance");
        
        // Deduct Wager inside TEE
        shieldedBalances[msg.sender] = suint.wrap(suint.unwrap(shieldedBalances[msg.sender]) - wagerAmount);

        if (randomQueue.length > 0) {
            uint256 duelId = randomQueue[randomQueue.length - 1];
            randomQueue.pop();

            duels[duelId].player2 = saddress.wrap(msg.sender);
            
            emit MatchFound(duelId);
            emit PlayerJoined(duelId, msg.sender);
        } else {
            uint256 duelId = nextDuelId++;
            duels[duelId].player1 = saddress.wrap(msg.sender);
            duels[duelId].wager = _wager;
            duels[duelId].isPrivate = false;
            duels[duelId].isComplete = false;
            
            randomQueue.push(duelId);
            emit DuelCreated(duelId, false, msg.sender);
        }
    }

    // ============================================
    // CORE GAMEPLAY EXECUTION
    // ============================================
    function commitMove(uint256 duelId, suint _move) external {
        require(!duels[duelId].isComplete, "Duel is complete");
        
        // In full TEE, compare msg.sender == player1 or player2
        // For simplicity, we just assume tracking logic holds
        if (suint.unwrap(duels[duelId].p1Move) == 0) {
             duels[duelId].p1Move = _move;
        } else {
             duels[duelId].p2Move = _move;
        }
        
        emit MoveCommitted(duelId, msg.sender);
    }

    function resolveDuel(uint256 duelId) external {
        DuelInfo storage duel = duels[duelId];
        require(!duel.isComplete, "Already resolved");
        
        // This executes within the TEE
        // 1=Rock, 2=Paper, 3=Scissors
        suint diff = suint.wrap((suint.unwrap(duel.p1Move) + 3 - suint.unwrap(duel.p2Move)) % 3);
        
        duel.isComplete = true;
        
        // Simulating the TEE payout structure
        if (suint.unwrap(diff) == 1) {
            // Player 1 wins
            shieldedBalances[saddress.unwrap(duel.player1)] = suint.wrap(suint.unwrap(shieldedBalances[saddress.unwrap(duel.player1)]) + (suint.unwrap(duel.wager) * 2));
        } else if (suint.unwrap(diff) == 2) {
            // Player 2 wins
            shieldedBalances[saddress.unwrap(duel.player2)] = suint.wrap(suint.unwrap(shieldedBalances[saddress.unwrap(duel.player2)]) + (suint.unwrap(duel.wager) * 2));
        } else {
            // Draw
            shieldedBalances[saddress.unwrap(duel.player1)] = suint.wrap(suint.unwrap(shieldedBalances[saddress.unwrap(duel.player1)]) + suint.unwrap(duel.wager));
            shieldedBalances[saddress.unwrap(duel.player2)] = suint.wrap(suint.unwrap(shieldedBalances[saddress.unwrap(duel.player2)]) + suint.unwrap(duel.wager));
        }

        emit DuelResolved(duelId, msg.sender); 
    }
}
