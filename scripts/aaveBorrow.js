const { getNamedAccounts } = require("hardhat");
const { getWeth } = require("../scripts/getWeth");

async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();
}

main()
  .then(() => process.exit(0))
  .then((error) => {
    console.log(error);
    process.exit(1);
  });
