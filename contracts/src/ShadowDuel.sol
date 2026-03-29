// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ShieldedTypes.sol";

contract ShadowDuel {
    address public owner;

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

    constructor() {
        owner = msg.sender;
    }

    // ============================================
    // MATCHMAKING
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
        duel.player2 = saddress.wrap(msg.sender);
        emit PlayerJoined(duelId, msg.sender);
    }

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
    // GAMEPLAY & AUTO-RESOLUTION
    // ============================================
    function commitMove(uint256 duelId, suint _move) external {
        DuelInfo storage duel = duels[duelId];
        require(!duel.isComplete, "Duel is complete");
        
        if (suint.unwrap(duel.p1Move) == 0) {
             duel.p1Move = _move;
        } else {
             duel.p2Move = _move;
             // AUTO-RESOLVE on second move
             _resolveDuelInternal(duelId);
        }
        emit MoveCommitted(duelId, msg.sender);
    }

    function resolveDuel(uint256 duelId) external {
        _resolveDuelInternal(duelId);
    }

    function _resolveDuelInternal(uint256 duelId) internal {
        DuelInfo storage duel = duels[duelId];
        require(!duel.isComplete, "Already resolved");
        require(suint.unwrap(duel.p1Move) != 0 && suint.unwrap(duel.p2Move) != 0, "Moves not ready");
        
        suint diff = suint.wrap((suint.unwrap(duel.p1Move) + 3 - suint.unwrap(duel.p2Move)) % 3);
        duel.isComplete = true;
        
        address p1 = saddress.unwrap(duel.player1);
        address p2 = saddress.unwrap(duel.player2);
        address winner = address(0);

        if (suint.unwrap(diff) == 1) {
            winner = p1;
            (bool s1,) = payable(p1).call{value: 0.17 ether}("");
            (bool s2,) = payable(owner).call{value: 0.03 ether}("");
            require(s1 && s2, "Payout failed");
        } else if (suint.unwrap(diff) == 2) {
            winner = p2;
            (bool s1,) = payable(p2).call{value: 0.17 ether}("");
            (bool s2,) = payable(owner).call{value: 0.03 ether}("");
            require(s1 && s2, "Payout failed");
        } else {
            // Draw: Refund both 0.1
            (bool s1,) = payable(p1).call{value: 0.1 ether}("");
            (bool s2,) = payable(p2).call{value: 0.1 ether}("");
            require(s1 && s2, "Refund failed");
        }

        emit DuelResolved(duelId, winner); 
    }

    function setOwner(address _owner) external {
        require(msg.sender == owner, "Only owner");
        owner = _owner;
    }
}
