// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SavannaFi SVN staking
/// @notice Users stake and unstake SVN into numbered pools (one pool per stock on the site).
///         Positions are tracked per pool and per wallet. Unstaking is always available,
///         even when the contract is paused or a pool is disabled.
contract SVNStaking is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Pool {
        bool enabled; // new stakes allowed
        uint256 cap; // max total staked in this pool, 0 means no cap
        uint256 total; // total SVN staked in this pool
        uint256 stakers; // wallets with a non-zero position
    }

    IERC20 public immutable stakingToken;
    uint256 public immutable poolCount;

    mapping(uint256 => Pool) private _pools;
    mapping(uint256 => mapping(address => uint256)) private _staked;

    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event PoolEnabled(uint256 indexed poolId, bool enabled);
    event PoolCap(uint256 indexed poolId, uint256 cap);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    error InvalidPool();
    error PoolDisabled();
    error ZeroAmount();
    error CapExceeded();
    error InsufficientStake();
    error CannotRescueStakingToken();
    error ZeroAddress();
    error BadPoolCount();

    constructor(IERC20 token, uint256 poolCount_, address initialOwner) Ownable(initialOwner) {
        if (address(token) == address(0) || initialOwner == address(0)) revert ZeroAddress();
        if (poolCount_ == 0 || poolCount_ > 64) revert BadPoolCount();
        stakingToken = token;
        poolCount = poolCount_;
        for (uint256 i = 0; i < poolCount_; i++) {
            _pools[i].enabled = true;
            emit PoolEnabled(i, true);
        }
    }

    // ------------------------------------------------------------------ users

    /// @notice Stake `amount` SVN into `poolId`. The caller must approve this contract first.
    ///         The credited amount is what the contract actually received, so tokens that
    ///         charge a transfer fee are accounted for correctly.
    function stake(uint256 poolId, uint256 amount) external nonReentrant whenNotPaused {
        Pool storage p = _pool(poolId);
        if (!p.enabled) revert PoolDisabled();
        if (amount == 0) revert ZeroAmount();

        uint256 balanceBefore = stakingToken.balanceOf(address(this));
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = stakingToken.balanceOf(address(this)) - balanceBefore;
        if (received == 0) revert ZeroAmount();

        if (p.cap != 0 && p.total + received > p.cap) revert CapExceeded();

        uint256 current = _staked[poolId][msg.sender];
        if (current == 0) p.stakers += 1;
        _staked[poolId][msg.sender] = current + received;
        p.total += received;

        emit Staked(msg.sender, poolId, received);
    }

    /// @notice Withdraw `amount` SVN from `poolId`. Never blocked by pause.
    function unstake(uint256 poolId, uint256 amount) external nonReentrant {
        _unstake(poolId, amount);
    }

    /// @notice Withdraw the caller's whole position from `poolId`.
    function unstakeAll(uint256 poolId) external nonReentrant {
        _pool(poolId);
        _unstake(poolId, _staked[poolId][msg.sender]);
    }

    function _unstake(uint256 poolId, uint256 amount) private {
        Pool storage p = _pool(poolId);
        if (amount == 0) revert ZeroAmount();
        uint256 current = _staked[poolId][msg.sender];
        if (amount > current) revert InsufficientStake();

        unchecked {
            _staked[poolId][msg.sender] = current - amount;
        }
        p.total -= amount;
        if (current == amount) p.stakers -= 1;

        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, poolId, amount);
    }

    // ------------------------------------------------------------------ views

    function stakedOf(uint256 poolId, address user) external view returns (uint256) {
        _pool(poolId);
        return _staked[poolId][user];
    }

    function totalStaked(uint256 poolId) external view returns (uint256) {
        return _pool(poolId).total;
    }

    function poolInfo(uint256 poolId)
        external
        view
        returns (bool enabled, uint256 cap, uint256 total, uint256 stakers)
    {
        Pool storage p = _pool(poolId);
        return (p.enabled, p.cap, p.total, p.stakers);
    }

    /// @notice All pools in one call, for the frontend.
    function poolsOverview()
        external
        view
        returns (bool[] memory enabled, uint256[] memory caps, uint256[] memory totals, uint256[] memory stakers)
    {
        uint256 n = poolCount;
        enabled = new bool[](n);
        caps = new uint256[](n);
        totals = new uint256[](n);
        stakers = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            Pool storage p = _pools[i];
            enabled[i] = p.enabled;
            caps[i] = p.cap;
            totals[i] = p.total;
            stakers[i] = p.stakers;
        }
    }

    /// @notice A wallet's position in every pool, for the frontend.
    function userStakes(address user) external view returns (uint256[] memory amounts) {
        uint256 n = poolCount;
        amounts = new uint256[](n);
        for (uint256 i = 0; i < n; i++) amounts[i] = _staked[i][user];
    }

    function totalStakedAll() external view returns (uint256 sum) {
        for (uint256 i = 0; i < poolCount; i++) sum += _pools[i].total;
    }

    // ------------------------------------------------------------------ owner

    function setPoolEnabled(uint256 poolId, bool enabled) external onlyOwner {
        _pool(poolId).enabled = enabled;
        emit PoolEnabled(poolId, enabled);
    }

    /// @notice Set a pool cap. 0 removes the cap. A cap below the current total only blocks new stakes.
    function setPoolCap(uint256 poolId, uint256 cap) external onlyOwner {
        _pool(poolId).cap = cap;
        emit PoolCap(poolId, cap);
    }

    /// @notice Pause new stakes. Unstaking stays open.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Recover tokens sent to this contract by mistake. Staked SVN can never be taken out.
    function rescueToken(IERC20 token, address to, uint256 amount) external onlyOwner {
        if (address(token) == address(stakingToken)) revert CannotRescueStakingToken();
        if (to == address(0)) revert ZeroAddress();
        token.safeTransfer(to, amount);
        emit TokenRescued(address(token), to, amount);
    }

    // --------------------------------------------------------------- internal

    function _pool(uint256 poolId) private view returns (Pool storage) {
        if (poolId >= poolCount) revert InvalidPool();
        return _pools[poolId];
    }
}
