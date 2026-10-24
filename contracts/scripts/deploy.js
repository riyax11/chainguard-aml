import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying AMLRegistry...");
  
  const AMLRegistry = await hre.ethers.getContractFactory("AMLRegistry");
  const amlRegistry = await AMLRegistry.deploy();

  await amlRegistry.waitForDeployment();
  const address = await amlRegistry.getAddress();

  console.log(`AMLRegistry deployed to: ${address}`);

  // Write address and ABI to backend config so the Express server can use it
  const backendConfigDir = process.cwd() + '/../backend/config';
  if (!fs.existsSync(backendConfigDir)){
      fs.mkdirSync(backendConfigDir);
  }

  const contractData = {
    address: address,
    abi: JSON.parse(amlRegistry.interface.formatJson())
  };

  fs.writeFileSync(
    backendConfigDir + '/contract.json',
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract data written to backend/config/contract.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
