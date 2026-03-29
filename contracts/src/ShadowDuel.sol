// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ShieldedTypes.sol";

contract ShadowDuel {
    address public owner;
    uint256 public constant WAGER = 0.01 ether;
    uint256 public constant WIN_PAYOUT = 0.017 ether;

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
    // SHADOW AI ENGINE (Weighted 40/60 - No Draws)
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
            // 40% Player Wins: AI picks the losing move
            // Formula: aiMove is the one pMove beats
            aiMoveVal = ((pMoveVal + 1) % 3) + 1;
            winner = msg.sender;
            payout = WIN_PAYOUT;
            (bool success,) = msg.sender.call{value: payout}("");
            require(success, "Payout failed");
        } else {
            // 60% AI Wins: AI picks the winning move
            // Formula: aiMove is the one that beats pMove
            aiMoveVal = (pMoveVal % 3) + 1;
            winner = address(this);
            payout = 0;
        }

        emit DuelResolved(msg.sender, pMoveVal, aiMoveVal, winner, payout);
    }

    receive() external payable {
        emit HouseFunded(msg.sender, msg.value);
    }
}
