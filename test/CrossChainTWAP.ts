import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("CrossChainTWAP", function () {
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let crossChainTWAP: any;
  let mockToken: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy ERC20Mock
    const MockToken = await ethers.getContractFactory("ERC20Mock");
    mockToken = await MockToken.deploy("Mock USDC", "USDC");
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
        tokenAddr, // Mock (same token)
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
    expect(order.interval).to.equal(300);
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

  it("Should not allow canceling after execution starts", async function () {
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

    // Manually increase executedSlices via storage (simulate relayer)
    // Storage layout: orders[0].executedSlices is at slot 0, offset 6
    // We'll use hardhat_setStorageAt to update it
    const orderId = 0;
    const order = await crossChainTWAP.orders(orderId);
    const storageSlot = ethers.encodeBytes32String("orders");
    const mappingSlot = ethers.solidityPackedKeccak256(["uint256"], [orderId]);
    const executedSlicesOffset = 6; // executedSlices is the 7th field (0-indexed)
    const targetSlot = ethers.solidityPackedKeccak256(
      ["bytes32", "uint256"],
      [mappingSlot, executedSlicesOffset]
    );

    await ethers.provider.send("hardhat_setStorageAt", [
      await crossChainTWAP.getAddress(),
      targetSlot,
      ethers.zeroPadValue(ethers.toBeHex(1), 32)
    ]);

    // Now try to cancel
    await expect(crossChainTWAP.connect(addr1).cancelSwap(0)).to.be.revertedWith("CrossChainTWAP: already started");
  });
});