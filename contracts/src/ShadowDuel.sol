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
    // SHADOW AI ENGINE (PvE)
    // ============================================
    function duelAI(suint pMove) external payable {
        require(msg.value == WAGER, "Must send exactly 0.01 SEIS");
        require(address(this).balance >= WIN_PAYOUT, "Insufficient House Funds");

        uint256 pMoveVal = suint.unwrap(pMove);
        require(pMoveVal >= 1 && pMoveVal <= 3, "Invalid move: 1=Rock, 2=Paper, 3=Scissors");

        // Simple on-chain randomness for AI move (1-3)
        uint256 aiMoveVal = (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 3) + 1;

        address winner = address(0);
        uint256 payout = 0;

        // RPS Logic: (pMove - aiMove + 3) % 3
        // 0 = Draw, 1 = Player Wins, 2 = AI Wins
        uint256 result = (pMoveVal + 3 - aiMoveVal) % 3;

        if (result == 0) {
            // DRAW: Refund Wager
            winner = address(0);
            payout = WAGER;
            (bool success,) = msg.sender.call{value: payout}("");
            require(success, "Refund failed");
        } else if (result == 1) {
            // PLAYER WINS: 0.017 Payout
            winner = msg.sender;
            payout = WIN_PAYOUT;
            (bool success,) = msg.sender.call{value: payout}("");
            require(success, "Payout failed");
        } else {
            // AI (HOUSE) WINS: Player keeps nothing
            winner = address(this);
            payout = 0;
        }

        emit DuelResolved(msg.sender, pMoveVal, aiMoveVal, winner, payout);
    }

    receive() external payable {
        emit HouseFunded(msg.sender, msg.value);
    }
}
