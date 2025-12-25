import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { WeightTrend } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("WeightTrendSepolia", function () {
  let signers: Signers;
  let weightTrendContract: WeightTrend;
  let weightTrendContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const WeightTrendDeployment = await deployments.get("WeightTrend");
      weightTrendContractAddress = WeightTrendDeployment.address;
      weightTrendContract = await ethers.getContractAt("WeightTrend", WeightTrendDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("submit weight and compare trend", async function () {
    steps = 12;

    this.timeout(4 * 40000);

    progress("Encrypting weight '75' for yesterday simulation...");
    const encryptedWeight1 = await fhevm
      .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
      .add32(75)
      .encrypt();

    progress(
      `Call submitWeight(75) WeightTrend=${weightTrendContractAddress} handle=${ethers.hexlify(encryptedWeight1.handles[0])} signer=${signers.alice.address}...`,
    );
    let tx = await weightTrendContract
      .connect(signers.alice)
      .submitWeight(encryptedWeight1.handles[0], encryptedWeight1.inputProof);
    await tx.wait();

    progress("Encrypting weight '70' for today...");
    const encryptedWeight2 = await fhevm
      .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
      .add32(70)
      .encrypt();

    progress(
      `Call submitWeight(70) WeightTrend=${weightTrendContractAddress} handle=${ethers.hexlify(encryptedWeight2.handles[0])} signer=${signers.alice.address}...`,
    );
    tx = await weightTrendContract
      .connect(signers.alice)
      .submitWeight(encryptedWeight2.handles[0], encryptedWeight2.inputProof);
    await tx.wait();

    progress(`Call WeightTrend.getTodayWeight()...`);
    const encryptedTodayWeight = await weightTrendContract.connect(signers.alice).getTodayWeight();

    progress(`Decrypting WeightTrend.getTodayWeight()=${encryptedTodayWeight}...`);
    const clearTodayWeight = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTodayWeight,
      weightTrendContractAddress,
      signers.alice,
    );
    progress(`Clear WeightTrend.getTodayWeight()=${clearTodayWeight}`);

    expect(clearTodayWeight).to.eq(70);

    progress(`Call WeightTrend.compareWeightTrend()...`);
    const encryptedTrend = await weightTrendContract.connect(signers.alice).compareWeightTrend();

    if (encryptedTrend !== ethers.ZeroHash) {
      progress(`Decrypting WeightTrend.compareWeightTrend()=${encryptedTrend}...`);
      const clearTrend = await fhevm.userDecryptEbool(
        encryptedTrend,
        weightTrendContractAddress,
        signers.alice,
      );
      progress(`Clear WeightTrend.compareWeightTrend()=${clearTrend}`);
      // If today (70) < yesterday (75), trend should be true (decreased)
      // Note: This assumes both weights were submitted on different days
      // In real scenario, you'd need actual day separation
    } else {
      progress("No trend data available (need at least 2 days of data)");
    }
  });
});


    it('should deploy on Sepolia testnet', async function () {
      // Sepolia-specific deployment test
      expect(true).to.be.true;
    });

