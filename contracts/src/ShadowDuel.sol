// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ShieldedTypes.sol";

contract ShadowDuel {
    address public owner;
    uint256 public constant WAGER = 0.01 ether;
    uint256 public constant WIN_PAYOUT = 0.017 ether;

    struct PlayerStats {
        uint256 wins;
        uint256 points;
        bool exists;
    }

    mapping(address => PlayerStats) public stats;
    address[] public playerList;

    event DuelResolved(address indexed player, uint256 playerMove, uint256 aiMove, address winner, uint256 payout, uint256 pointsEarned);
    event HouseFunded(address indexed donor, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // ============================================
    // LIQUIDITY MANAGEMENT
    // ============================================
    function depositHouseFunds() external payable {
        emit HouseFunded(msg.sender, msg.value);
    }

    function withdrawHouseFunds(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(amount);
    }

    // ============================================
    // SHADOW AI ENGINE (Weighted 40/60 - Points System)
    // ============================================
    function duelAI(suint pMove) external payable {
        require(msg.value == WAGER, "Must send exactly 0.01 SEIS");
        require(address(this).balance >= WIN_PAYOUT, "Insufficient House Funds");

        uint256 pMoveVal = suint.unwrap(pMove);
        require(pMoveVal >= 1 && pMoveVal <= 3, "Invalid move");

        // Weighted Roll: 1-100
        uint256 roll = (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 100) + 1;

        uint256 aiMoveVal;
        address winner;
        uint256 payout;
        uint256 pointsEarned;

        // Initialize player if first time
        if (!stats[msg.sender].exists) {
            stats[msg.sender].exists = true;
            playerList.push(msg.sender);
        }

        if (roll <= 40) {
            // 40% Player Wins: +150 Points
            aiMoveVal = ((pMoveVal + 1) % 3) + 1;
            winner = msg.sender;
            payout = WIN_PAYOUT;
            pointsEarned = 150;
            
            stats[msg.sender].wins += 1;
            stats[msg.sender].points += 150;

            (bool success,) = msg.sender.call{value: payout}("");
            require(success, "Payout failed");
        } else {
            // 60% AI Wins: +50 Points
            aiMoveVal = (pMoveVal % 3) + 1;
            winner = address(this);
            payout = 0;
            pointsEarned = 50;

            stats[msg.sender].points += 50;
        }

        emit DuelResolved(msg.sender, pMoveVal, aiMoveVal, winner, payout, pointsEarned);
    }

    // ============================================
    // LEADERBOARD READS
    // ============================================
    function getLeaderboard() external view returns (address[] memory, uint256[] memory, uint256[] memory) {
        uint256 count = playerList.length;
        address[] memory addresses = new address[](count);
        uint256[] memory totalPoints = new uint256[](count);
        uint256[] memory totalWins = new uint256[](count);
        
        for (uint i = 0; i < count; i++) {
            address player = playerList[i];
            addresses[i] = player;
            totalPoints[i] = stats[player].points;
            totalWins[i] = stats[player].wins;
        }
        
        return (addresses, totalPoints, totalWins);
    }

    receive() external payable {
        emit HouseFunded(msg.sender, msg.value);
    }
}
