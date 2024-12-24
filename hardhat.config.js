require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();



const { API_URI_KEY, PRIVATE_KEY } = process.env;

// Validate environment variables
if (!API_URI_KEY || !PRIVATE_KEY) {
  throw new Error("API_URL_KEY or PRIVATE_KEY is missing in the .env file");
}

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "cardano",
  networks: {
    hardhat: {},
    cardano: {
      url: API_URI_KEY, // Ensure this is a valid string
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
};


console.log("API_URL_KEY:", API_URI_KEY);
console.log("PRIVATE_KEY:", PRIVATE_KEY);
