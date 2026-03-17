// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ShadowDuel.sol";

contract DeployShadowDuel is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ShadowDuel duel = new ShadowDuel();

        vm.stopBroadcast();
        
        console.log("Shadow Duel deployed at:", address(duel));
    }
}
