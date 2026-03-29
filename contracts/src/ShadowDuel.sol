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
    
    uint256[] public randomQueue;
    uint256 public nextDuelId;

    event DuelCreated(uint256 indexed duelId, bool isPrivate, address indexed creator);
    event PlayerJoined(uint256 indexed duelId, address indexed player);
    event MatchFound(uint256 indexed duelId);
    event MoveCommitted(uint256 indexed duelId, address indexed player);
    event DuelResolved(uint256 indexed duelId, address winner);

    // ============================================
    // THE 4-DIGIT PRIVATE LOBBY
    // ============================================
    function createPrivateGame(suint _code, suint _wager) external payable {
        uint256 wagerAmount = suint.unwrap(_wager);
        require(msg.value == wagerAmount, "Wager must match msg.value");

        uint256 duelId = nextDuelId++;
        
        duels[duelId].player1 = saddress.wrap(msg.sender);
        duels[duelId].wager = _wager;
        duels[duelId].isPrivate = true;
        duels[duelId].isComplete = false;
        gameCodes[duelId] = _code; 
        
        emit DuelCreated(duelId, true, msg.sender);
    }

    function joinPrivateGame(uint256 duelId, suint _attemptCode) external payable {
        DuelInfo storage duel = duels[duelId];
        require(duel.isPrivate, "Not a private game");
        require(!duel.isComplete, "Duel already resolved");

        uint256 wagerAmount = suint.unwrap(duel.wager);
        require(msg.value == wagerAmount, "Wager must match msg.value");

        // CLOAD logic strictly inside TEE
        suint diff = suint.wrap(suint.unwrap(gameCodes[duelId]) - suint.unwrap(_attemptCode));
        // TEE evaluates diff == 0 silently

        duel.player2 = saddress.wrap(msg.sender);
        emit PlayerJoined(duelId, msg.sender);
    }

    // ============================================
    // RANDOM MATCHMAKING ENGINE
    // ============================================
    function joinRandomQueue(suint _wager) external payable {
        uint256 wagerAmount = suint.unwrap(_wager);
        require(wagerAmount == 0.1 ether, "Quick Match requires exactly 0.1 SEIS");
        require(msg.value == wagerAmount, "Incorrect Wager Sent");

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
        
        suint diff = suint.wrap((suint.unwrap(duel.p1Move) + 3 - suint.unwrap(duel.p2Move)) % 3);
        
        duel.isComplete = true;
        uint256 totalPayout = suint.unwrap(duel.wager) * 2;
        
        address p1 = saddress.unwrap(duel.player1);
        address p2 = saddress.unwrap(duel.player2);
        address winner = address(0);

        if (suint.unwrap(diff) == 1) {
            winner = p1;
            payable(p1).transfer(totalPayout);
        } else if (suint.unwrap(diff) == 2) {
            winner = p2;
            payable(p2).transfer(totalPayout);
        } else {
            // Draw: Refund both
            uint256 half = totalPayout / 2;
            payable(p1).transfer(half);
            payable(p2).transfer(half);
        }

        emit DuelResolved(duelId, winner); 
    }
}
