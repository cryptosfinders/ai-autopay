
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/Autopay.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        Autopay autopay = new Autopay();
        vm.stopBroadcast();

        console2.log("Autopay deployed:", address(autopay));

        // Write a tiny JSON to /deployments/arc-testnet.json via ffi is overkill here.
        // We'll just echo to std out for copy/paste and let the Node agent write it after deploy.
    }
}
