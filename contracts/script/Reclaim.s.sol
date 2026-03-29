// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IShadowDuel {
    function withdrawHouseFunds(uint256 amount) external;
}

contract ReclaimFunds is Script {
    function run() external {
        uint256 deployerPrivateKey = 0x806ad6b1b28bf970a5083c257c893319a5418e9f4f4316a71759c0c0f45c47c4;
        address targetWallet = 0xEb78Ef1Eaa3AF5E3C6B451566B48420372B600Fd;
        
        address[] memory addresses = new address[](2);
        addresses[0] = 0xFe7199629bc40FAd451d387B4F385492a40B0a43; // Phase 11
        addresses[1] = 0xcdD1a18860f2B927D7843ce16fAF39A3a50eB87B; // Phase 10

        vm.startBroadcast(deployerPrivateKey);

        for (uint i = 0; i < addresses.length; i++) {
            address contractAddr = addresses[i];
            uint256 bal = contractAddr.balance;
            if (bal > 0) {
                console.log("Reclaiming from:", contractAddr);
                console.log("Balance:", bal);
                IShadowDuel(contractAddr).withdrawHouseFunds(bal);
            }
        }

        // Send all current deployer balance (that was reclaimed) to target wallet
        // Keep a tiny bit for gas if needed, but here we just send the reclaimed amount
        // Actually withdrawHouseFunds sends to OWNER (deployer). 
        // So we then send from Deployer to Target.
        
        uint256 deployerBalance = address(msg.sender).balance;
        if (deployerBalance > 0.01 ether) {
            console.log("Sending to Target Wallet:", targetWallet);
            payable(targetWallet).transfer(deployerBalance - 0.01 ether);
        }

        vm.stopBroadcast();
    }
}
