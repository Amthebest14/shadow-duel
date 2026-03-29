// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ShieldedTypes.sol";

contract ShadowDuel {
    address public owner;
    uint256 public constant WAGER = 0.01 ether;
    uint256 public constant WIN_PAYOUT = 0.017 ether;

    struct PlayerStats {
        uint256 wins;
        bool exists;
    }

    mapping(address => PlayerStats) public stats;
    address[] public playerList;

    event DuelResolved(address indexed player, uint256 playerMove, uint256 aiMove, address winner, uint256 payout);
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
    // SHADOW AI ENGINE (Weighted 40/60 - Leaderboard)
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

        if (roll <= 40) {
            // 40% Player Wins
            aiMoveVal = ((pMoveVal + 1) % 3) + 1;
            winner = msg.sender;
            payout = WIN_PAYOUT;
            
            // Track Win
            if (!stats[msg.sender].exists) {
                stats[msg.sender].exists = true;
                playerList.push(msg.sender);
            }
            stats[msg.sender].wins += 1;

            (bool success,) = msg.sender.call{value: payout}("");
            require(success, "Payout failed");
        } else {
            // 60% AI Wins
            aiMoveVal = (pMoveVal % 3) + 1;
            winner = address(this);
            payout = 0;
        }

        emit DuelResolved(msg.sender, pMoveVal, aiMoveVal, winner, payout);
    }

    // ============================================
    // LEADERBOARD READS
    // ============================================
    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 count = playerList.length;
        address[] memory addresses = new address[](count);
        uint256[] memory winCounts = new uint256[](count);
        
        for (uint i = 0; i < count; i++) {
            addresses[i] = playerList[i];
            winCounts[i] = stats[addresses[i]].wins;
        }
        
        return (addresses, winCounts);
    }

    receive() external payable {
        emit HouseFunded(msg.sender, msg.value);
    }
}
