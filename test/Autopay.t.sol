
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/Autopay.sol";

contract AutopayTest is Test {
    Autopay ap;
    address payer = address(0xBEEF);
    address payee = address(0xCAFE);

    function setUp() public {
        ap = new Autopay();
        vm.deal(payer, 1_000_000_000); // fund some native
    }

    function testCreateAndSettle() public {
        vm.prank(payer);
        uint256 id = ap.createPlan(payee, 1234, 60);

        // fast-forward to due
        vm.warp(block.timestamp + 61);

        // anyone can settle; use payer for simplicity
        vm.prank(payer);
        ap.settleIfDue{value: 1234}(id);
    }
}
