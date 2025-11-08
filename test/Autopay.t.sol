// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { Autopay } from "../contracts/Autopay.sol";

contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}

contract AutopayTest is Test {
    Autopay ap;
    MockUSDC usdc; // ✅ corrected declaration

    address payer = address(0xBEEF);
    address payee = address(0xCAFE);

    function setUp() public {
        usdc = new MockUSDC(); // ✅ now resolves
        ap = new Autopay(address(usdc));

        usdc.mint(payer, 1_000_000_000);

        vm.prank(payer);
        usdc.approve(address(ap), type(uint256).max);
    }

    function testCreateAndSettle() public {
        vm.prank(payer);
        uint256 id = ap.createPlan(payee, 1234, 60);

        vm.warp(block.timestamp + 61);

        ap.settleIfDue(id);

        assertEq(usdc.balanceOf(payee), 1234);
    }
}

