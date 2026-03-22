// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ShadowDuel.sol";

contract DeployShadowDuel is Script {
    function run() external {
        vm.startBroadcast();

        ShadowDuel duel = new ShadowDuel();

        vm.stopBroadcast();
        
        console.log("Shadow Duel deployed at:", address(duel));
    }
}
