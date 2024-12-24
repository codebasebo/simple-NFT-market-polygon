import "./App.css";
import { Contract, ethers } from "ethers";
import { useEffect, useState } from "react";
import contractABI from "./contractABI.json";


const contractAddress = "0xf079C078bA5037b1B6238f28353C855769d8bE79";

function App() {
  const [account, setAccount] = useState(null);
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);
  const [NFTContract, setNFTContract] = useState(null);
  // state for whether app is minting or not.
  const [isMinting, setIsMinting] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false); // Added state for network check

  // Check if the current network is the correct network
  useEffect(() => {
    async function checkNetwork() {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        setIsCorrectNetwork(chainId === "0x98a"); // Change to the correct chain ID
      }
    }
    //check for initial network
    checkNetwork();

    //Check for network change
    window.ethereum.on("chainChanged", (newChainId) => {
      setIsCorrectNetwork(newChainId === "0x98a"); // Change to the correct chain ID
    }, []);
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      setIsWalletInstalled(true);
    }
  }, []);

  useEffect(() => {
    function initNFTContract() {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      setNFTContract(new Contract(contractAddress, contractABI.abi, signer));
    }
    initNFTContract();
  }, [account]);

  async function connectWallet() {
    window.ethereum
      .request({
        method: "eth_requestAccounts",
      })
      .then((accounts) => {
        setAccount(accounts[0]);
      })
      .catch((error) => {
        alert("Something went wrong");
        console.log(`Error: ${error}`); // This results in "Error: [object Object]"

      });

  }

  async function disconnectWallet() {
    if (window.ethereum) {
      try {
        setAccount(null);
      } catch (error) {
        console.error("An error occurred while disconnecting the wallet:", error);
      }
    }
  }



  const data = [
    {
      url: "./assets/image/1.png",
      param: "handleMint(`https://gold-necessary-lion-12.mypinata.cloud/ipfs/QmctbzZRnvJZDHvbKsL93fEvQy3iMx9CeWyUkgaRYgxBbm/1`)",
    },
    {
      url: "./assets/image/2.png",
      param: "handleMint(`https://gold-necessary-lion-12.mypinata.cloud/ipfs/QmctbzZRnvJZDHvbKsL93fEvQy3iMx9CeWyUkgaRYgxBbm/2`)",
    },
    {
      url: "./assets/image/3.png",
      param: "handleMint(`https://gold-necessary-lion-12.mypinata.cloud/ipfs/QmctbzZRnvJZDHvbKsL93fEvQy3iMx9CeWyUkgaRYgxBbm/3`)",
    },
    {
      url: "./assets/image/4.png",
      param: "handleMint(`https://gold-necessary-lion-12.mypinata.cloud/ipfs/QmctbzZRnvJZDHvbKsL93fEvQy3iMx9CeWyUkgaRYgxBbm/4`)",
    },
    {
      url: "./assets/image/5.png",
      param: "handleMint(`https://gold-necessary-lion-12.mypinata.cloud/ipfs/QmctbzZRnvJZDHvbKsL93fEvQy3iMx9CeWyUkgaRYgxBbm/5`)",
    }
  ];

  async function withdrawMoney() {
    try {
      const response = await NFTContract.withdrawMoney();
      console.log("Received: ", response);
    } catch (err) {
      alert(err);
    }
  }

  if (!isCorrectNetwork) {
    return (
      <div className="container">
        <br />
        <h1>🔮 Simple NFT Marketplace</h1>
        <br />
        <p>Please connect to the Polygon zkEVM Cardona network to use this app.</p>
        <button className="connect-button" onClick={connectToNetwork}>Connect Wallet</button>
      </div>
    );
  }

  async function connectToNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x98a', // Chain ID for Polygon zkEVM Cardano
          chainName: 'Polygon zkEVM Cardano',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://rpc.cardona.zkevm-rpc.com'],
          blockExplorerUrls: ['https://https://cardona-zkevm.polygonscan.com']
        }]
      });
      console.log("Connected to the Polygon zkEVM Cardano network");
    } catch (error) {
      console.error("Failed to switch network", error);
    }
  }



  async function handleMint(tokenURI) {
    setIsMinting(true); // Indicate the minting process has started
    try {
      // Initialize the provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Create a contract instance
      const NFTContractWithSigner = NFTContract.connect(signer);

      // Define transaction options
      const options = { value: ethers.utils.parseEther("0.01") };

      // Estimate gas and get current gas price
      const gasEstimate = await NFTContractWithSigner.estimateGas.mintNFT(tokenURI, options);
      const gasPrice = await provider.getGasPrice();

      // Include estimated gas and gas price in options
      options.gasLimit = gasEstimate;
      options.gasPrice = gasPrice;

      console.log("Transaction Options:", options);

      // Send the transaction
      const response = await NFTContractWithSigner.mintNFT(tokenURI, options);

      console.log("Transaction successful:", response);
      alert("Minting successful!");
    } catch (err) {
      console.error("Error during minting:", err);

      // Handle specific errors
      if (err?.data?.message?.includes("insufficient funds")) {
        alert("You don't have enough funds to complete the transaction. Please add more ETH/MATIC to your wallet.");
      } else {
        alert(`Minting failed: ${err.message || "An unknown error occurred."}`);
      }
    } finally {
      setIsMinting(false);
    }
  }


  if (account === null) {
    return (
      <>
        <div className="connect-container">
          <br />
          <h1>🔮 Simple NFT </h1>
          <h2>NFT Marketplace</h2>
          <p>Buy an NFT from our marketplace.</p>

          {isWalletInstalled ? (
            <button className="connect-button" onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <p>Install Metamask wallet</p>
          )}
        </div>
      </>
    );

  }

  return (
    <div className="bg">
      <>
        <div className="container">
          <br />

          <h1>NFT Marketplace</h1>
          <p>A NFT Marketplace to view and mint your NFT</p>
          <p className="footer">Powered by simple NFT🔮</p>
          {data.map((item, index) => (
            <div className="imgDiv" key={index}> {/* Key moved here */}
              <img
                src={item.url}
                alt="images"
                width={250}
                height={250}
                border={2}
              />
              <button
                className="mint_btn"
                disabled={isMinting}
                onClick={() => {
                  handleMint(item.param);
                }}
              >
                Mint - 0.01 MATIC
              </button>
            </div>
          ))}


          <div className="withdraw_container">
            <button className="withdraw_btn"
              onClick={() => {
                withdrawMoney();
              }}
            >
              Withdraw Money from Contract
            </button>
          </div>
          <button className="disconnect-button" onClick={disconnectWallet}>Disconnect Wallet</button>
        </div>
      </>

    </div>

  );
}

export default App;

