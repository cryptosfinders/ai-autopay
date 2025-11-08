// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns(bool);
}

contract Autopay {
    IERC20 public immutable USDC; // SCREAMING_SNAKE_CASE 

    struct Plan {
        address payer;
        address payee;
        uint256 amount;
        uint64 intervalSecs;
        uint64 nextDue;
        bool active;
    }

    mapping(uint256 => Plan) public plans;
    uint256 public nextId = 1;

    constructor(address _usdc) {
        USDC = IERC20(_usdc);
    }

    function createPlan(address payee, uint256 amount, uint64 intervalSecs) external returns(uint256 id) {
        id = nextId++;

        // Named struct field initialization (more readable & matches lint rules)
        plans[id] = Plan({
            payer: msg.sender,
            payee: payee,
            amount: amount,
            intervalSecs: intervalSecs,
            nextDue: uint64(block.timestamp + intervalSecs),
            active: true
        });
    }

    function settleIfDue(uint256 id) external {
        Plan storage p = plans[id];
        require(p.active, "not active");
        require(block.timestamp >= p.nextDue, "not due");

        // Transfer using updated USDC reference
        require(USDC.transferFrom(p.payer, p.payee, p.amount), "transfer failed");

        p.nextDue += p.intervalSecs;
    }
}

