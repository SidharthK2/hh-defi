const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth");

async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();
  const lendingPool = await getLendingPool(deployer);
  console.log(`Lending Pool address: ${lendingPool.address}`);

  // Deposit
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // Approve
  await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);
  console.log(`Depositing...`);
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
  console.log(`${ethers.utils.formatEther(AMOUNT.toString())} WETH deposited!`);
  let { availableBorrowsETH, totalDebtETH } = await getUserBorrowData(
    lendingPool,
    deployer
  );
  const daiPrice = await getDAIPrice();
  const amountDaiToBorrow =
    (await availableBorrowsETH.toString()) * 0.95 * daiPrice;
  console.log(amountDaiToBorrow);
  //Borrow

  const daiToeknAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  await borrowDai(daiToeknAddress, lendingPool, amountDaiToBorrow, deployer);
  await getUserBorrowData(lendingPool, deployer);
  await repay(amountDaiToBorrow, daiToeknAddress, lendingPool, deployer);
  await getUserBorrowData(lendingPool, deployer);
}
async function borrowDai(
  daiAddress,
  lendingPool,
  amountDaiToBorrowWei,
  account
) {
  const borrowTx = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrowWei,
    1,
    0,
    account
  );
  await borrowTx.wait(1);
  console.log(`You have borrowed!`);
}

async function repay(amount, daiAddress, lendingPool, account) {
  await approveErc20(daiAddress, lendingPool.address, amountToSpend);
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
  repayTx.wait(1);
  console.log("Repaid!");
}

async function getUserBorrowData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log(
    `You have ${ethers.utils.formatEther(
      totalCollateralETH.toString()
    )} worth ETH deposited`
  );
  console.log(
    `You have total ${ethers.utils.formatEther(
      totalDebtETH.toString()
    )} worth of ETH borrowed`
  );
  console.log(
    `You can borrow ${ethers.utils.formatEther(
      availableBorrowsETH.toString()
    )} worth of ETH`
  );
  return { availableBorrowsETH, totalDebtETH };
}

async function getLendingPool(account) {
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    account
  );
  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  );
  return lendingPool;
}
async function approveErc20(
  erc20Address,
  spenderAddress,
  amountToSpend,
  account
) {
  const erc20Token = await ethers.getContractAt(
    "IERC20",
    erc20Address,
    account
  );
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("Approved!");
}

async function getDAIPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  );
  const price = (await daiEthPriceFeed.latestRoundData())[1];
  console.log(`The DAI/ETH price is ${price.toString()}`);
  return price;
}

main()
  .then(() => process.exit(0))
  .then((error) => {
    console.log(error);
    process.exit(1);
  });
