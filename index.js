import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

let rpcEndpoint = null

if (process.env.NEXT_PUBLIC_WORKSPACE_URL) {
  rpcEndpoint = process.env.NEXT_PUBLIC_WORKSPACE_URL
}

export default function Home() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {    
    const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, NFTMarketplace.abi, provider)
    const data = await marketContract.fetchNFTItems()
    const items = await Promise.all(data.map(async i => {
      console.log("qui si")
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        itemId: i.itemId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        creator: i.creator,
        listOfSeller : i.listOfSeller,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      console.log(item.listOfSeller.length)
      
    
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }
  
  async function buyNft(nft) {
    
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, NFTMarketplace.abi, signer)

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    console.log("qui: " + price)
    const transaction = await contract.createNFTSale(nftaddress, nft.itemId, {
      value: price
    })
    //await transaction.wait()
    console.log(transaction)
    loadNFTs()
  }
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl font-semibold text-center">No NFTs in marketplace</h1>)
  return (
      <div className="flex justify-center" >
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
              nfts.map((nft, i) => (
                <div key={i} className="descrNft border border-4 shadow rounded-xl overflow-hidden">
                  <img src={nft.image} className="object-cover w-96 h-96"/>
                  <div className="descrNft border border-t-4 border-black-700 p-4">
                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                    <div style={{ height: '30px', overflow: 'hidden' }}>
                      <p className="text-l text-black-400 ">{nft.description}</p>
                    </div>
                  </div>
                  <div className="p-4 border border-t-4 descrNft">
                    <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                    <button className="w-full text-xl bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-12 border-b-4 border-red-700 hover:border-red-500 rounded" onClick={() => buyNft(nft)}>BUY</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
  )
}