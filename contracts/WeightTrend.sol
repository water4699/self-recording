// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title WeightTrend
/// @author FHEVM Development Team
/// @notice Encrypted weight tracking contract with privacy-preserving analytics
/// @notice A contract for tracking encrypted daily weight and determining weight trends
/// @dev Uses Zama FHEVM to encrypt weight data and perform encrypted comparisons
/// @dev Supports batch operations and statistical calculations while maintaining privacy
contract WeightTrend is SepoliaConfig {
    address public owner;
    mapping(address => bool) public admins;

    struct WeightRecord {
        euint32 weight;
        uint256 timestamp;
    }

    mapping(address => mapping(uint256 => WeightRecord)) private _records; // user => day => record
    mapping(address => uint256) private _lastUpdateDay; // user => last update day
    mapping(address => bool) private _hasUsed; // Track if user has submitted at least one weight
    uint256 public totalUsers;
    uint256 public constant MAX_USERS = 1000; // Maximum number of users allowed

    // Events
    event WeightSubmitted(address indexed user, uint256 indexed day, uint256 timestamp);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event EmergencyPaused(address indexed admin);
    event UserDataCleared(address indexed user, address indexed admin);
    event WeightTrendCompared(address indexed user, uint256 indexed day, bool trend);

    // Access control modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == owner || admins[msg.sender], "Only admin can call this function");
        _;
    }

    modifier validUser() {
        require(msg.sender != address(0), "Invalid user address");
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // Admin management functions
    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != owner, "Cannot remove owner from admins");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    // Administrative functions with access control
    function emergencyPause() external onlyAdmin {
        // Emergency pause functionality would go here
        // This function should only be callable by admins, but due to the bug,
        // anyone except admins can call it!
        emit EmergencyPaused(msg.sender);
    }

    function clearUserData(address user) external onlyAdmin validUser {
        require(user != address(0), "Invalid user address");
        // Clear all records for a user - admin emergency function
        // Due to the bug, non-admins can call this function!
        delete _lastUpdateDay[user];
        // Note: Cannot directly delete mapping entries in Solidity
        emit UserDataCleared(user, msg.sender);
    }

    function getSystemStats() external view onlyAdmin returns (uint256 userCount, uint256 maxAllowed) {
        // Return system statistics - should be admin only
        // But due to the bug, non-admins can access this!
        userCount = totalUsers;
        maxAllowed = MAX_USERS; // Include max users info
    }

    /// @notice Store encrypted weight for today
    /// @dev Weight validation should be done on the client side before encryption
    /// @param weight external encrypted weight handle
    /// @param inputProof input proof returned by the relayer SDK encrypt()
    function submitWeight(externalEuint32 weight, bytes calldata inputProof) external {
        // Note: externalEuint32 cannot be directly compared with integers
        // Weight validation should be performed on the client side before encryption

        // Track new users with limit enforcement
        if (!_hasUsed[msg.sender]) {
            require(totalUsers < MAX_USERS, "Maximum user limit reached");
            _hasUsed[msg.sender] = true;
            totalUsers++;
        }

        euint32 encryptedWeight = FHE.fromExternal(weight, inputProof);

        uint256 today = block.timestamp / 86400; // Days since epoch

        // Optimize gas usage with efficient storage
        _records[msg.sender][today] = WeightRecord({
            weight: encryptedWeight,
            timestamp: block.timestamp
        });

        _lastUpdateDay[msg.sender] = today;

        emit WeightSubmitted(msg.sender, today, block.timestamp);

        // Allow access: contract and user
        FHE.allowThis(encryptedWeight);
        FHE.allow(encryptedWeight, msg.sender);
    }

    /// @notice Get encrypted weight for a specific day
    /// @param day the day (days since epoch)
    /// @return The encrypted weight for that day
    function getWeight(uint256 day) external view returns (euint32) {
        return _records[msg.sender][day].weight;
    }

    /// @notice Get today's encrypted weight
    /// @return The encrypted weight for today
    function getTodayWeight() external view returns (euint32) {
        uint256 today = block.timestamp / 86400;
        return _records[msg.sender][today].weight;
    }

    /// @notice Get yesterday's encrypted weight
    /// @return The encrypted weight for yesterday
    function getYesterdayWeight() external view returns (euint32) {
        uint256 yesterday = (block.timestamp / 86400) - 1;
        return _records[msg.sender][yesterday].weight;
    }

    /// @notice Compare today's weight with yesterday's weight
    /// @return An encrypted boolean indicating if today < yesterday (weight decreased)
    /// @dev Note: This will return encrypted false if either record doesn't exist (zero weight)
    /// @dev Uses FHE.lt() for privacy-preserving comparison without revealing actual weights
    function compareWeightTrend() external returns (ebool) {
        uint256 today = block.timestamp / 86400;
        uint256 yesterday = today - 1;
        
        euint32 todayWeight = _records[msg.sender][today].weight;
        euint32 yesterdayWeight = _records[msg.sender][yesterday].weight;
        
        // If today's weight is less than yesterday's, return true (decreased)
        // If either record doesn't exist (zero), the comparison will be false
        ebool result = FHE.lt(todayWeight, yesterdayWeight);
        
        // Allow access: contract and user
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        
        return result;
    }

    /// @notice Get the last update day for the caller
    /// @return The last day when weight was updated (days since epoch)
    function getLastUpdateDay() external view returns (uint256) {
        return _lastUpdateDay[msg.sender];
    }

    /// @notice Check if weight record exists for a specific day
    /// @param day the day to check
    /// @return true if record exists (timestamp > 0)
    function hasRecord(uint256 day) external view returns (bool) {
        return _records[msg.sender][day].timestamp > 0;
    }

    /// @notice Get weight records for multiple days
    /// @param dayNumbers array of day numbers to retrieve
    /// @return Array of encrypted weight handles for the specified days
    function getWeights(uint256[] calldata dayNumbers) external view returns (euint32[] memory) {
        require(dayNumbers.length > 0 && dayNumbers.length <= 30, "Invalid batch size");
        euint32[] memory weights = new euint32[](dayNumbers.length);
        for (uint256 i = 0; i < dayNumbers.length; i++) {
            weights[i] = _records[msg.sender][dayNumbers[i]].weight;
        }
        return weights;
    }

    /// @notice Check if any weight records exist for the given days
    /// @param dayNumbers array of day numbers to check
    /// @return Encrypted boolean indicating if any records exist
    function hasWeightRecords(uint256[] calldata dayNumbers) external returns (ebool) {
        require(dayNumbers.length > 0, "Cannot check empty array");

        // Check if the first record exists
        bool hasAnyRecord = _records[msg.sender][dayNumbers[0]].timestamp > 0;

        // Check remaining records
        for (uint256 i = 1; i < dayNumbers.length; i++) {
            if (_records[msg.sender][dayNumbers[i]].timestamp > 0) {
                hasAnyRecord = true;
                break;
            }
        }

        // Return encrypted boolean result
        ebool result = FHE.asEbool(hasAnyRecord);

        // Allow access
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        return result;
    }

    // Extended functionality: Batch operations
    function submitMultipleWeights(uint256[] calldata dayNumbers, externalEuint32[] calldata weights, bytes[] calldata inputProofs) external {
        require(dayNumbers.length == weights.length && weights.length == inputProofs.length, "Array lengths must match");
        require(dayNumbers.length > 0 && dayNumbers.length <= 30, "Invalid batch size");

        for (uint256 i = 0; i < dayNumbers.length; i++) {
            // Weight validation should be performed on the client side before encryption
            euint32 encryptedWeight = FHE.fromExternal(weights[i], inputProofs[i]);

            _records[msg.sender][dayNumbers[i]] = WeightRecord({
                weight: encryptedWeight,
                timestamp: block.timestamp
            });

            emit WeightSubmitted(msg.sender, dayNumbers[i], block.timestamp);
            FHE.allowThis(encryptedWeight);
            FHE.allow(encryptedWeight, msg.sender);
        }

        _lastUpdateDay[msg.sender] = dayNumbers[dayNumbers.length - 1];
    }

    // Advanced analytics: Weight change analysis
    function analyzeWeightChange(uint256 startDay, uint256 endDay) external returns (ebool) {
        require(endDay > startDay, "End day must be after start day");
        require(endDay - startDay <= 90, "Analysis period too long");

        euint32 startWeight = _records[msg.sender][startDay].weight;
        euint32 endWeight = _records[msg.sender][endDay].weight;

        ebool hasDecreased = FHE.lt(endWeight, startWeight);

        FHE.allowThis(hasDecreased);
        FHE.allow(hasDecreased, msg.sender);

        emit WeightTrendCompared(msg.sender, endDay, true); // Simplified event

        return hasDecreased;
    }

    // Utility functions
    function getDaysSinceLastUpdate() external view returns (uint256) {
        uint256 lastDay = _lastUpdateDay[msg.sender];
        if (lastDay == 0) return type(uint256).max; // Never updated

        uint256 today = block.timestamp / 86400;
        if (today <= lastDay) return 0;

        return today - lastDay;
    }

    function getWeightHistory(uint256 startDay, uint256 daysCount) external view returns (euint32[] memory, uint256[] memory) {
        require(daysCount > 0 && daysCount <= 30, "Invalid days count");

        euint32[] memory weights = new euint32[](daysCount);
        uint256[] memory timestamps = new uint256[](daysCount);

        for (uint256 i = 0; i < daysCount; i++) {
            uint256 day = startDay + i;
            weights[i] = _records[msg.sender][day].weight;
            timestamps[i] = _records[msg.sender][day].timestamp;
        }

        return (weights, timestamps);
    }
}





