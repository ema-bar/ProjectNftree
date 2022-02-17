import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  nftmarketaddress, nftaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'



export default function CreatorDashboard() {
  const [nfts, setNfts] = useState([])
  const [solds, setSold] = useState([])
  const [reselleds, setReselled] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [loadingStateCreatedSold, setLoadingStateCreateSold] = useState('not-loaded')
  const [loadingStateReselled, setLoadingStateReselled] = useState('not-loaded')
  useEffect(() => {
    loadNFTs(),
    loadNFTsCreatedAndSold(),
    loadNFTsReselled()
  }, [])

  async function loadNFTsReselled(){
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
      
    const marketContract = new ethers.Contract(nftmarketaddress, NFTMarketplace.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchItemsReselled()
    console.log("Lunghezza items reselled: " + data.length)
    const itemsReselled = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let originalSellingPrice = ethers.utils.formatUnits(i.originalSellingPrice.toString(), 'ether') 
      let itemReselled = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        creator: i.creator,
        listOfSeller : i.listOfSeller,
        sold: i.sold,
        originalSellingPrice,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      console.log(itemReselled.listOfSeller.length)
      
      return itemReselled
    })) 
    setReselled(itemsReselled)
    setLoadingStateReselled('loaded') 
  }

  async function loadNFTsCreatedAndSold() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
      
    const marketContract = new ethers.Contract(nftmarketaddress, NFTMarketplace.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchItemsCreatedAndSold()
    console.log("Lunghezza items: " + data.length)
    const itemsCreatedAndSold = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let originalSellingPrice = ethers.utils.formatUnits(i.originalSellingPrice.toString(), 'ether') 
      let itemCreatedAndSold = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        creator: i.creator,
        listOfSeller : i.listOfSeller,
        sold: i.sold,
        originalSellingPrice,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      console.log(itemCreatedAndSold.listOfSeller.length)
      
      return itemCreatedAndSold
    })) 
    setSold(itemsCreatedAndSold)
    setLoadingStateCreateSold('loaded') 
  }
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
      
    const marketContract = new ethers.Contract(nftmarketaddress, NFTMarketplace.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchItemsCreated()
    
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let originalSellingPrice = ethers.utils.formatUnits(i.originalSellingPrice.toString(), 'ether') 
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        creator: i.creator,
        sold: i.sold,
        originalSellingPrice,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      
      return item
    }))
    
    setNfts(items)
    setLoadingState('loaded') 
  }
  if ((loadingState === 'loaded' && !nfts.length) 
  && (loadingStateCreatedSold === 'loaded' && !solds.length)
  && (loadingStateReselled === 'loaded' && !reselleds.length)){
    return (<h1 className="py-10 px-20 text-3xl font-semibold text-center">No NFTs present</h1>)
  } 
  return (
    <div >
      <div className="p-4 ">
        <h2 className="text-3xl py-2 font-semibold text-center">NFTs Created</h2>
          <div className="flex justify-center" >
            <div className="px-4" style={{ maxWidth: '1600px' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {
                nfts.map((nft, i) => (
                  <div key={i} className="descrNft border border-4 shadow rounded-xl overflow-hidden">
                    <img src={nft.image} className="object-cover w-96 h-96" />
                      <div className="descrNft border border-t-4 border-black-700 p-4">
                        <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                        <div style={{ height: '30px', overflow: 'hidden' }}>
                          <p className="text-l text-black-400 ">{nft.description}</p>
                        </div>
                      </div>
                      <div className="p-4 border border-t-4 descrNft">
                        <p className="text-2xl mb-4 font-bold text-white">{nft.originalSellingPrice} ETH</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
     
      <div className="p-4">
        <h2 className="text-3xl py-2 font-semibold text-center">NFTs Created & Sold</h2>
          <div className="flex justify-center" >
            <div className="px-4" style={{ maxWidth: '1600px' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {
                solds.map((sold, i) => (
                  <div key={i} className="descrNft border border-4 shadow rounded-xl overflow-hidden">
                    <img src={sold.image} className="object-cover w-96 h-96" />
                    <div className="descrNft border border-t-4 border-black-700 p-4">
                        <p style={{ height: '64px' }} className="text-2xl font-semibold">{sold.name}</p>
                        <div style={{ height: '30px', overflow: 'hidden' }}>
                          <p className="text-l text-black-400 ">{sold.description}</p>
                        </div>
                      </div>
                      <div className="p-4 border border-t-4 descrNft">
                        <p className="text-2xl mb-4 font-bold text-white">{sold.originalSellingPrice} ETH</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-3xl py-2 font-semibold text-center">NFTs Reselled</h2>
          <div className="flex justify-center" >
            <div className="px-4" style={{ maxWidth: '1600px' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {
                reselleds.map((reselled, i) => (
                  <div key={i} className="descrNft border border-4 shadow rounded-xl overflow-hidden">
                    <img src={reselled.image} className="object-cover w-96 h-96" />
                    <div className="descrNft border border-t-4 border-black-700 p-4">
                        <p style={{ height: '64px' }} className="text-2xl font-semibold">{reselled.name}</p>
                        <div style={{ height: '30px', overflow: 'hidden' }}>
                          <p className="text-l text-black-400 ">{reselled.description}</p>
                        </div>
                      </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>    
      </div>
      
    </div>
  )
}
