import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("CrossChainTWAP", function () {
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let crossChainTWAP: any;
  let mockToken: any;

  const ETHERLINK_CHAIN_ID = 10208;
  const BASE_CHAIN_ID = 10106;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Mock ERC20 (USDC)
    const Token = await ethers.getContractFactory("ERC20");
    mockToken = await Token.deploy("Mock USDC", "USDC");
    await mockToken.waitForDeployment();

    // Mint tokens to addr1
    await mockToken.mint(await addr1.getAddress(), ethers.parseUnits("1000", 6));

    // Deploy CrossChainTWAP
    const TWAP = await ethers.getContractFactory("CrossChainTWAP");
    crossChainTWAP = await TWAP.deploy();
    await crossChainTWAP.waitForDeployment();
  });

  it("Should schedule a TWAP swap", async function () {
    const addr1Address = await addr1.getAddress();
    const tokenAddr = await mockToken.getAddress();

    // Approve tokens
    await mockToken.connect(addr1).approve(await crossChainTWAP.getAddress(), ethers.parseUnits("100", 6));

    // Schedule swap: 100 USDC from Etherlink → Base
    await expect(
      crossChainTWAP.connect(addr1).scheduleSwap(
        tokenAddr,
        tokenAddr, // Mock
        ethers.parseUnits("100", 6),
        5,
        300, // 5 minutes
        ethers.parseUnits("95", 6),
        false // Etherlink → Base
      )
    )
      .to.emit(crossChainTWAP, "SwapScheduled")
      .withArgs(0, addr1Address, tokenAddr, tokenAddr, ethers.parseUnits("100", 6), false);

    // Check order
    const order = await crossChainTWAP.getOrder(addr1Address, 0);
    expect(order.totalAmount).to.equal(ethers.parseUnits("100", 6));
    expect(order.numSlices).to.equal(5);
  });

  it("Should not allow zero slices", async function () {
    const tokenAddr = await mockToken.getAddress();
    await mockToken.connect(addr1).approve(await crossChainTWAP.getAddress(), ethers.parseUnits("100", 6));

    await expect(
      crossChainTWAP.connect(addr1).scheduleSwap(
        tokenAddr,
        tokenAddr,
        ethers.parseUnits("100", 6),
        0,
        300,
        ethers.parseUnits("95", 6),
        false
      )
    ).to.be.revertedWith("CrossChainTWAP: numSlices must be > 0");
  });

  it("Should allow canceling a swap", async function () {
    const addr1Address = await addr1.getAddress();
    const tokenAddr = await mockToken.getAddress();
    await mockToken.connect(addr1).approve(await crossChainTWAP.getAddress(), ethers.parseUnits("100", 6));

    await crossChainTWAP.connect(addr1).scheduleSwap(
      tokenAddr,
      tokenAddr,
      ethers.parseUnits("100", 6),
      5,
      300,
      ethers.parseUnits("95", 6),
      false
    );

    await expect(crossChainTWAP.connect(addr1).cancelSwap(0))
      .to.emit(crossChainTWAP, "SwapCanceled")
      .withArgs(0);

    const order = await crossChainTWAP.getOrder(addr1Address, 0);
    expect(order.canceled).to.be.true;
  });

  it("Should not allow canceling after execution", async function () {
    const addr1Address = await addr1.getAddress();
    const tokenAddr = await mockToken.getAddress();
    await mockToken.connect(addr1).approve(await crossChainTWAP.getAddress(), ethers.parseUnits("100", 6));

    await crossChainTWAP.connect(addr1).scheduleSwap(
      tokenAddr,
      tokenAddr,
      ethers.parseUnits("100", 6),
      5,
      300,
      ethers.parseUnits("95", 6),
      false
    );

    // Manually increase executedSlices (in real app, relayer does this)
    await ethers.provider.send("hardhat_setStorageAt", [
      await crossChainTWAP.getAddress(),
      ethers.encodeBytes32String("orders"),
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(address,uint256,uint256,uint256,uint256,uint256,uint256,bool,bool)"],
        [[addr1Address, tokenAddr, tokenAddr, ethers.parseUnits("100", 6), 5, 300, 1, false, false]]
      )
    ]);

    await expect(crossChainTWAP.connect(addr1).cancelSwap(0)).to.be.revertedWith("CrossChainTWAP: already started");
  });
});