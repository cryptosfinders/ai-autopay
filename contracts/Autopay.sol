
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Autopay
 * @notice Minimal subscription & conditional payout contract using native currency.
 *         On Arc, native == USDC. Payers deposit native into contract, or pay just-in-time.
 */
contract Autopay {
    struct Plan {
        address payer;
        address payee;
        uint256 amount;        // in native units (USDC has 6 decimals on Arc native)
        uint64 intervalSecs;   // e.g., 86400 for daily
        uint64 nextDue;        // unix timestamp due
        bool active;
    }

    uint256 public nextPlanId;
    mapping(uint256 => Plan) public plans;

    event PlanCreated(uint256 indexed id, address indexed payer, address indexed payee, uint256 amount, uint64 intervalSecs, uint64 nextDue);
    event PlanCancelled(uint256 indexed id);
    event PlanSettled(uint256 indexed id, uint64 paidAt, uint256 amount, address payee);

    /**
     * @notice Create a plan. nextDue starts now + interval.
     */
    function createPlan(address payee, uint256 amount, uint64 intervalSecs) external returns (uint256 id) {
        require(payee != address(0), "bad payee");
        require(amount > 0, "bad amount");
        require(intervalSecs >= 60, "interval too small");

        id = ++nextPlanId;
        plans[id] = Plan({
            payer: msg.sender,
            payee: payee,
            amount: amount,
            intervalSecs: intervalSecs,
            nextDue: uint64(block.timestamp + intervalSecs),
            active: true
        });
        emit PlanCreated(id, msg.sender, payee, amount, intervalSecs, uint64(block.timestamp + intervalSecs));
    }

    function cancelPlan(uint256 id) external {
        Plan storage p = plans[id];
        require(p.payer == msg.sender, "not payer");
        require(p.active, "inactive");
        p.active = false;
        emit PlanCancelled(id);
    }

    /**
     * @notice Settles if due. Anyone can call (e.g., an agent bot), but funds come from msg.sender.
     *         For real autopay, consider account abstraction or pre-funding/escrow.
     */
    function settleIfDue(uint256 id) external payable {
        Plan storage p = plans[id];
        require(p.active, "inactive");
        require(block.timestamp >= p.nextDue, "not due");
        require(msg.value == p.amount, "wrong value"); // paying native USDC

        (bool ok, ) = p.payee.call{value: msg.value}("");
        require(ok, "transfer fail");

        p.nextDue = uint64(block.timestamp + p.intervalSecs);
        emit PlanSettled(id, uint64(block.timestamp), msg.value, p.payee);
    }
}
