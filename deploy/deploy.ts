import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedWeightTrend = await deploy("WeightTrend", {
    from: deployer,
    log: true,
  });

  console.log(`WeightTrend contract: `, deployedWeightTrend.address);
};
// Optimized deployment script
export default func;
func.id = "deploy_weightTrend"; // id required to prevent reexecution
// Improved error handling
func.tags = ["WeightTrend"];

