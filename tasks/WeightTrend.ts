import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the WeightTrend contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the WeightTrend contract
 *
 *   npx hardhat --network localhost task:submit-weight --weight 70
 *   npx hardhat --network localhost task:compare-trend
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the WeightTrend contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the WeightTrend contract
 *
 *   npx hardhat --network sepolia task:submit-weight --weight 70
 *   npx hardhat --network sepolia task:compare-trend
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:address", "Prints the WeightTrend address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const weightTrend = await deployments.get("WeightTrend");

  console.log("WeightTrend address is " + weightTrend.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:submit-weight --weight 70
 *   - npx hardhat --network sepolia task:submit-weight --weight 70
 */
task("task:submit-weight", "Submits encrypted weight to WeightTrend Contract")
  .addOptionalParam("address", "Optionally specify the WeightTrend contract address")
  .addParam("weight", "The weight value in kg")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const weight = parseInt(taskArguments.weight);
    if (!Number.isInteger(weight) || weight <= 0) {
      throw new Error(`Argument --weight must be a positive integer`);
    }

    await fhevm.initializeCLIApi();

    const WeightTrendDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("WeightTrend");
    console.log(`WeightTrend: ${WeightTrendDeployment.address}`);

    const signers = await ethers.getSigners();

    const weightTrendContract = await ethers.getContractAt("WeightTrend", WeightTrendDeployment.address);

    // Encrypt the weight value
    const encryptedWeight = await fhevm
      .createEncryptedInput(WeightTrendDeployment.address, signers[0].address)
      .add32(weight)
      .encrypt();

    const tx = await weightTrendContract
      .connect(signers[0])
      .submitWeight(encryptedWeight.handles[0], encryptedWeight.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`WeightTrend submitWeight(${weight}) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:compare-trend
 *   - npx hardhat --network sepolia task:compare-trend
 */
task("task:compare-trend", "Compares today's weight with yesterday's weight")
  .addOptionalParam("address", "Optionally specify the WeightTrend contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const WeightTrendDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("WeightTrend");
    console.log(`WeightTrend: ${WeightTrendDeployment.address}`);

    const signers = await ethers.getSigners();

    const weightTrendContract = await ethers.getContractAt("WeightTrend", WeightTrendDeployment.address);

    const encryptedTrend = await weightTrendContract.connect(signers[0]).compareWeightTrend();

    if (encryptedTrend === ethers.ZeroHash) {
      console.log(`Encrypted trend: ${encryptedTrend}`);
      console.log("No trend data available (need at least 2 days of data)");
      return;
    }

    const clearTrend = await fhevm.userDecryptEbool(
      encryptedTrend,
      WeightTrendDeployment.address,
      signers[0],
    );
    console.log(`Encrypted trend: ${encryptedTrend}`);
    console.log(`Clear trend (weight decreased): ${clearTrend}`);
  });

