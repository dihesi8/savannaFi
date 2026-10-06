// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice TESTNET ONLY. A free-to-mint token so the team can try the staking app.
///         Never use this as the real SVN token.
contract MockSVN is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 10_000 ether;
    uint256 public constant FAUCET_COOLDOWN = 1 hours;
    mapping(address => uint256) public lastFaucet;

    error FaucetCooldown();

    constructor() ERC20("Mock SVN", "SVN") {}

    function faucet() external {
        if (block.timestamp < lastFaucet[msg.sender] + FAUCET_COOLDOWN) revert FaucetCooldown();
        lastFaucet[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
