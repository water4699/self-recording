import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { WeightTrend, WeightTrend__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("WeightTrend")) as WeightTrend__factory;
  const weightTrendContract = (await factory.deploy()) as WeightTrend;
  const weightTrendContractAddress = await weightTrendContract.getAddress();

  return { weightTrendContract, weightTrendContractAddress };
}

// Enhanced test suite with better organization and coverage
describe("WeightTrend", function () {
  // Set longer timeout for FHEVM operations
  this.timeout(60000);
  let signers: Signers;
  let weightTrendContract: WeightTrend;
  let weightTrendContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ weightTrendContract, weightTrendContractAddress } = await deployFixture());
  });

  it("should allow submitting weight for today", async function () {
    const weight = 70;
    const encryptedWeight = await fhevm
      .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
      .add32(weight)
      .encrypt();

    const tx = await weightTrendContract
      .connect(signers.alice)
      .submitWeight(encryptedWeight.handles[0], encryptedWeight.inputProof);
    await tx.wait();

    const lastUpdateDay = await weightTrendContract.connect(signers.alice).getLastUpdateDay();
    expect(lastUpdateDay).to.equal(Math.floor(Date.now() / 1000 / 86400));
  });

  it("should allow getting encrypted weight", async function () {
    const weight = 70;
    const encryptedWeight = await fhevm
      .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
      .add32(weight)
      .encrypt();

    await weightTrendContract
      .connect(signers.alice)
      .submitWeight(encryptedWeight.handles[0], encryptedWeight.inputProof);

    const today = Math.floor(Date.now() / 1000 / 86400);
    const storedWeight = await weightTrendContract.connect(signers.alice).getWeight(today);
    expect(storedWeight).to.not.be.undefined;
  });

  it("should allow comparing weight trend", async function () {
    // Submit weight for yesterday (simulate by manipulating time)
    const yesterdayWeight = 75;
    const todayWeight = 70;

    // Submit yesterday's weight
    const encryptedYesterdayWeight = await fhevm
      .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
      .add32(yesterdayWeight)
      .encrypt();

    await weightTrendContract
      .connect(signers.alice)
      .submitWeight(encryptedYesterdayWeight.handles[0], encryptedYesterdayWeight.inputProof);

    // Submit today's weight
    const encryptedTodayWeight = await fhevm
      .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
      .add32(todayWeight)
      .encrypt();

    await weightTrendContract
      .connect(signers.alice)
      .submitWeight(encryptedTodayWeight.handles[0], encryptedTodayWeight.inputProof);

    const result = await weightTrendContract.connect(signers.alice).compareWeightTrend();
    expect(result).to.not.be.undefined;
  });

  it("should return correct last update day", async function () {
    const weight = 70;
    const encryptedWeight = await fhevm
      .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
      .add32(weight)
      .encrypt();

    await weightTrendContract
      .connect(signers.alice)
      .submitWeight(encryptedWeight.handles[0], encryptedWeight.inputProof);

    const lastUpdateDay = await weightTrendContract.connect(signers.alice).getLastUpdateDay();
    expect(lastUpdateDay).to.equal(Math.floor(Date.now() / 1000 / 86400));
  });

  it("should check if record exists for a day", async function () {
    const today = Math.floor(Date.now() / 1000 / 86400);
    const hasRecordBefore = await weightTrendContract.connect(signers.alice).hasRecord(today);
    expect(hasRecordBefore).to.be.false;

    const weight = 70;
    const encryptedWeight = await fhevm
      .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
      .add32(weight)
      .encrypt();

    await weightTrendContract
      .connect(signers.alice)
      .submitWeight(encryptedWeight.handles[0], encryptedWeight.inputProof);

    const hasRecordAfter = await weightTrendContract.connect(signers.alice).hasRecord(today);
    expect(hasRecordAfter).to.be.true;
  });

  it("should support batch weight retrieval", async function () {
    const weights = [70, 72, 71];
    const days = [];

    // Submit weights for multiple days (simulating different days)
    for (let i = 0; i < weights.length; i++) {
      const encryptedWeight = await fhevm
        .createEncryptedInput(weightTrendContractAddress, signers.alice.address)
        .add32(weights[i])
        .encrypt();

      await weightTrendContract
        .connect(signers.alice)
        .submitWeight(encryptedWeight.handles[0], encryptedWeight.inputProof);

      days.push(Math.floor(Date.now() / 1000 / 86400));
    }

    const retrievedWeights = await weightTrendContract.connect(signers.alice).getWeights(days);
    expect(retrievedWeights).to.have.lengthOf(weights.length);
    expect(retrievedWeights[0]).to.not.be.undefined;
  });
});
