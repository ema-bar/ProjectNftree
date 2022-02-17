import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import { useRouter } from 'next/router'

import {
  nftmarketaddress, nftaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'


//const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export default function MyAssets() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [formInput, updateFormInput] = useState({ price: ''})
  const router = useRouter()

  useEffect(() => {
    loadNFTs()
  }, [])


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
    const data = await marketContract.fetchMyNFT()
    
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        itemId: i.itemId.toNumber(),
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        creator: i.creator,
        //oxCredit: meta.data.oxCredit,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
        
      }
      return item
    }))
    /**for (let i = 0; i < items.length; i++) {
      console.log("i: "+ i + " credit: " +  items[i].oxCredit)
    }  */
    setNfts(items)
    setLoadingState('loaded') 
    
  }
 

  async function sellNFT(nft){
    const price  = formInput.price
    const name = nft.name
    const description = nft.description
    console.log(price,name,description)
    
    if (!price) return

    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    
    const obJPrice = ethers.utils.parseUnits(price, 'ether')
    console.log(obJPrice)
    const contract = new ethers.Contract(nftmarketaddress, NFTMarketplace.abi, signer)
    console.log("dopo contratto")
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()
    console.log("dopo listingprice")

    let transaction = await contract.reSaleNft(nftaddress, nft.itemId, obJPrice, { value: listingPrice })
    console.log("dopo transazione")
    await transaction.wait()
    router.push('/')
  }
  
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl font-semibold text-center">No NFTs owned</h1>)
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border border-4  descrNft shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="object-cover w-96 h-96"/>
                <div className="descrNft border border-t-4 border-black-700 p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '30px', overflow: 'hidden' }}>
                    <p className="text-l text-black-400 ">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 border border-t-4 descrNft">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                  <button className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-5 border-b-4 border-blue-700 hover:border-blue-500 rounded" onClick={() => sellNFT(nft)}>SELL</button><span className='sm:px-5'></span>
                  <input placeholder="NFT Price in Eth" className="mt-2 border-b-4 rounded py-2 px-4 sm:pr-6" onChange={e => updateFormInput({ ...formInput, price: e.target.value })}/>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}