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
        bool isComplete;
    }

    mapping(address => PlayerInfo) private players;
    mapping(uint256 => DuelInfo) private duels;
    uint256 public nextDuelId;

    event DuelCreated(uint256 indexed duelId, address indexed creator);
    event MoveCommitted(uint256 indexed duelId, address indexed player);
    event DuelResolved(uint256 indexed duelId, address winner);

    // Moves: 1 = Rock, 2 = Paper, 3 = Scissors
    function createDuel(suint _wager) external payable {
        uint256 duelId = nextDuelId++;
        
        duels[duelId].player1 = saddress.wrap(msg.sender);
        duels[duelId].wager = _wager;
        duels[duelId].isComplete = false;

        emit DuelCreated(duelId, msg.sender);
    }

    function joinDuel(uint256 duelId, suint _move) external payable {
        require(!duels[duelId].isComplete, "Duel is complete");
        // Simplified Logic for Demo: Player 2 joins AND commits move
        duels[duelId].player2 = saddress.wrap(msg.sender);
        duels[duelId].p2Move = _move;
        
        emit MoveCommitted(duelId, msg.sender);
    }

    function commitMove(uint256 duelId, suint _move) external {
        require(!duels[duelId].isComplete, "Duel is complete");
        // Simplified Logic: Player 1 commits move
        duels[duelId].p1Move = _move;
        
        emit MoveCommitted(duelId, msg.sender);
    }

    function resolveDuel(uint256 duelId) external {
        DuelInfo storage duel = duels[duelId];
        require(!duel.isComplete, "Already resolved");
        
        // This executes within the TEE
        // 1=Rock, 2=Paper, 3=Scissors
        suint diff = suint.wrap((suint.unwrap(duel.p1Move) + 3 - suint.unwrap(duel.p2Move)) % 3);
        
        // Use RNG Precompile (0x64) for ties or loot distribution
        
        duel.isComplete = true;
        // In reality, shielded payout logic would occur here
        
        emit DuelResolved(duelId, msg.sender); // Emit public resolution or keeping private
    }
}
