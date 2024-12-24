const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Collection Contract", function () {
  let Collection;
  let collection;
  let owner;
  let user1;
  let user2;
  let PRICE_PER_TOKEN = ethers.utils.parseEther("0.01"); // 0.01 ETH
  let LIMIT_PER_ADDRESS = 2;
  let MAX_SUPPLY = 5;
  let tokenURI = "https://example.com/metadata.json";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    Collection = await ethers.getContractFactory("Collection");
    collection = await Collection.deploy();
    await collection.deployed();

    // Setting initial state
    await collection.setPrice(PRICE_PER_TOKEN);
    await collection.setLimit(LIMIT_PER_ADDRESS);
    await collection.setMaxSupply(MAX_SUPPLY);
  });

  it("should deploy the contract", async function () {
    expect(collection.address).to.properAddress;
  });

  it("should have the correct initial state", async function () {
    expect(await collection.PRICE_PER_TOKEN()).to.equal(PRICE_PER_TOKEN);
    expect(await collection.LIMIT_PER_ADDRESS()).to.equal(LIMIT_PER_ADDRESS);
    expect(await collection.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
  });

  it("should mint a new NFT and assign it to the sender", async function () {
    await expect(
      collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN })
    )
      .to.emit(collection, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 0);

    // Check ownership of the token
    expect(await collection.ownerOf(0)).to.equal(user1.address);
  });

  it("should not allow minting beyond the supply limit", async function () {
    // Minting 5 tokens should reach the max supply limit
    for (let i = 0; i < MAX_SUPPLY; i++) {
      await collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN });
    }

    await expect(
      collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN })
    ).to.be.revertedWith("You have exceeded Max Supply");
  });

  it("should not allow minting beyond the per-address limit", async function () {
    await collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN });
    await collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN });

    await expect(
      collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN })
    ).to.be.revertedWith("You have exceeded miniting limit");
  });

  it("should allow only the owner to set the price", async function () {
    await expect(collection.connect(user1).setPrice(ethers.utils.parseEther("0.02")))
      .to.be.revertedWith("Ownable: caller is not the owner");

    await collection.connect(owner).setPrice(ethers.utils.parseEther("0.02"));
    expect(await collection.PRICE_PER_TOKEN()).to.equal(ethers.utils.parseEther("0.02"));
  });

  it("should allow the owner to withdraw funds", async function () {
    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

    // Mint some NFTs to send funds to the contract
    await collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN });

    const contractBalance = await ethers.provider.getBalance(collection.address);

    // Withdraw funds
    await expect(collection.connect(owner).withdrawMoney())
      .to.emit(collection, "Transfer")
      .withArgs(collection.address, owner.address, contractBalance);

    // Verify the owner's balance has increased
    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
    expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
  });

  it("should not allow withdrawal by non-owners", async function () {
    await expect(collection.connect(user1).withdrawMoney())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should prevent minting with incorrect ether value", async function () {
    await expect(
      collection.connect(user1).mintNFT(tokenURI, { value: ethers.utils.parseEther("0.005") })
    ).to.be.revertedWith("Ether paid is incorrect");
  });

  it("should prevent minting a duplicate tokenURI", async function () {
    await collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN });

    // Try minting the same tokenURI again
    await expect(
      collection.connect(user2).mintNFT(tokenURI, { value: PRICE_PER_TOKEN })
    ).to.be.revertedWith("This NFT has already been minted");
  });

  it("should track the number of tokens minted per address", async function () {
    expect(await collection.mintedAddress(user1.address)).to.equal(0);

    await collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN });
    expect(await collection.mintedAddress(user1.address)).to.equal(1);

    await collection.connect(user1).mintNFT(tokenURI, { value: PRICE_PER_TOKEN });
    expect(await collection.mintedAddress(user1.address)).to.equal(2);
  });
});
