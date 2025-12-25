import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "WeightTrend";

// <root>/packages/fhevm-hardhat-template
const rel = "..";

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

// Try to find deployments directory
// First try ./deployments (frontend/deployments - local development)
// Then try ../deployments (pro14/deployments - root deployments)
let deploymentsDir = null;

// Try current directory first (frontend/deployments)
const currentDeploymentsDir = path.resolve("./deployments");
if (fs.existsSync(currentDeploymentsDir)) {
  deploymentsDir = currentDeploymentsDir;
}

// If not found, try parent directory (for Vercel builds or root deployments)
if (!deploymentsDir && fs.existsSync(dir)) {
  const parentDeploymentsDir = path.join(dir, "deployments");
  if (fs.existsSync(parentDeploymentsDir)) {
    deploymentsDir = parentDeploymentsDir;
  }
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

function readDeployment(chainName, chainId, contractName, optional) {
  if (!deploymentsDir) {
    if (!optional) {
      console.error(
        `${line}Unable to locate deployments directory.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const jsonPath = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(jsonPath)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${jsonPath}' file.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(jsonPath, "utf-8");

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  // Ensure address is a string and not null/undefined
  if (!obj.address || obj.address === "null" || obj.address === null || obj.address === "") {
    if (!optional) {
      console.error(
        `${line}Deployment file '${jsonPath}' has invalid address.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  // Ensure address is a valid hex string
  if (typeof obj.address !== "string" || !obj.address.startsWith("0x")) {
    if (!optional) {
      console.error(
        `${line}Deployment file '${jsonPath}' has invalid address format: ${obj.address}.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  return obj;
}

// Try hardhat network first, then localhost, then sepolia
let deployLocalhost = readDeployment("hardhat", 31337, CONTRACT_NAME, true /* optional */);
if (!deployLocalhost) {
  deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, true /* optional */);
}

// Debug: log what we found
if (deploymentsDir) {
  console.log(`Using deployments directory: ${deploymentsDir}`);
}
if (deployLocalhost) {
  console.log(`Found localhost deployment: ${deployLocalhost.address}`);
} else {
  console.log("No localhost deployment found");
}

// Sepolia is optional
let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);

// If no deployments found, check if ABI files already exist (for Vercel builds)
if (!deployLocalhost && !deploySepolia) {
  const existingABIFile = path.join(outdir, `${CONTRACT_NAME}ABI.ts`);
  const existingAddressesFile = path.join(outdir, `${CONTRACT_NAME}Addresses.ts`);
  
  if (fs.existsSync(existingABIFile) && fs.existsSync(existingAddressesFile)) {
    console.log("No deployments found, but ABI files already exist. Skipping generation.");
    process.exit(0);
  }
  
  console.error(`${line}No deployments found. Please deploy the contract first.${line}`);
  process.exit(1);
}

// Get ABI from whichever deployment has it
let abi = null;
if (deployLocalhost && deployLocalhost.abi) {
  abi = deployLocalhost.abi;
} else if (deploySepolia && deploySepolia.abi) {
  abi = deploySepolia.abi;
}

// If no ABI found, try to get it from artifacts
if (!abi) {
  const artifactsDir = path.join(dir, "artifacts");
  const contractArtifactPath = path.join(artifactsDir, "contracts", `${CONTRACT_NAME}.sol`, `${CONTRACT_NAME}.json`);
  if (fs.existsSync(contractArtifactPath)) {
    try {
      const artifact = JSON.parse(fs.readFileSync(contractArtifactPath, "utf-8"));
      abi = artifact.abi;
    } catch (e) {
      console.error(`Failed to read artifact: ${e.message}`);
    }
  }
}

if (!abi) {
  console.error(`${line}Unable to find ABI. Please compile the contract first.${line}`);
  process.exit(1);
}

// Fill in missing ABIs and addresses
if (!deploySepolia) {
  deploySepolia = { abi: abi, address: "0x0000000000000000000000000000000000000000" };
} else {
  if (!deploySepolia.abi) {
    deploySepolia.abi = abi;
  }
  if (!deploySepolia.address || deploySepolia.address === "0x0000000000000000000000000000000000000000") {
    deploySepolia.address = "0x0000000000000000000000000000000000000000";
  }
}

if (!deployLocalhost) {
  deployLocalhost = { abi: abi, address: "0x0000000000000000000000000000000000000000" };
} else {
  // Preserve the existing address - don't overwrite it
  const existingAddress = deployLocalhost.address;
  if (!deployLocalhost.abi) {
    deployLocalhost.abi = abi;
  }
  // Only set to zero if address is truly missing or invalid
  // But NEVER overwrite a valid address
  if (!existingAddress || existingAddress === "" || existingAddress === "null" || existingAddress === null) {
    deployLocalhost.address = "0x0000000000000000000000000000000000000000";
  }
  // If address exists and is valid, it's already set correctly - don't touch it
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: abi }, null, 2)} as const;
\n`;
// Ensure addresses are strings
const localhostAddress = (deployLocalhost && deployLocalhost.address) ? String(deployLocalhost.address) : "0x0000000000000000000000000000000000000000";
const sepoliaAddress = (deploySepolia && deploySepolia.address) ? String(deploySepolia.address) : "0x0000000000000000000000000000000000000000";

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${sepoliaAddress}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${localhostAddress}", chainId: 31337, chainName: "hardhat" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

