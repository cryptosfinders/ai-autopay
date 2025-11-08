// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { Autopay } from "../contracts/Autopay.sol";

contract Deploy is Script {
    function run() external {
        address usdc = vm.envAddress("USDC"); // reads from .env

        vm.startBroadcast();
        new Autopay(usdc);
        vm.stopBroadcast();
    }
}

