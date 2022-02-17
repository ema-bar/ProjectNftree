import '../styles/globals.css'
import Link from 'next/link'
import { ethers } from 'ethers'
import Web3Modal from "web3modal"

import {
  onlusaddress, nftmarketaddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

function Marketplace({ Component, pageProps }) {
 
  function toggleModal(modalID, textError, error){
    if(typeof textError !== 'undefined' && textError !== null) {
      document.getElementById(textError).textContent=error;
    }
    document.getElementById(modalID).classList.toggle("hidden");
    document.getElementById(modalID + "-backdrop").classList.toggle("hidden");
    document.getElementById(modalID).classList.toggle("flex");
    document.getElementById(modalID + "-backdrop").classList.toggle("flex");
  }

  async function sendMoneyToNPO(){
    const web3Modal = new Web3Modal()
    const connectionFirst = await web3Modal.connect()
    const providerFirst = new ethers.providers.Web3Provider(connectionFirst)
    const signerFirst = providerFirst.getSigner()
    const contractFirst = new ethers.Contract(nftmarketaddress, NFTMarketplace.abi, signerFirst)
    try{
      await contractFirst.setOnlusAddress(onlusaddress)
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(nftmarketaddress, NFTMarketplace.abi, signer)
      let totalMoneyRaised = await contract.gettotalMoney()
      totalMoneyRaised = totalMoneyRaised.toString()
      console.log("totalMoneyRaised: "+totalMoneyRaised)
      const temp = await contract.sendMoneyToOnlus({ value: totalMoneyRaised })
      await temp.wait()
    }catch(error){
      let errorSliced = JSON.stringify(error.data).slice(105,-3)
      toggleModal('modal-id', 'textError', errorSliced);
      console.log(errorSliced)
    }
  } 
  return (
    
  <div>
    <div className="hidden overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none justify-center items-center" id="modal-id">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            <div className="flex items-start justify-between p-5 border-b border-solid border-blue-200 rounded-t">
              <h3 className="text-3xl font-bold">
                Error Occured
              </h3>
            </div>
            <div className="relative p-6 flex-auto">
              <p id="textError" className="my-4 text-red-500 text-lg leading-relaxed">
              </p>
            </div>
            <div className="flex items-center justify-end p-3 border-t border-solid border-blueGray-200 rounded-b">
              <button className="text-dark-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" type="button" onClick={() => toggleModal('modal-id')}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden opacity-25 fixed inset-0 z-40 bg-black" id="modal-id-backdrop"></div>
    <div className='container'>
      <div id="buttonDiv" >
            <div className='bg-[#73ba1c] sm:mx-16 my-12'>
              <div className='p-4 text-white text-base font-bold'>
              NFTree is a project that allows any user to sell their NFTs depicting trees.
              <br></br>
              The purpose of NFTree is to restore life to the Amazon rainforest.
              <br></br>
              In addition to the commission for the list price, 5% of each transaction will 
              be completely donated to the non-profit organization that takes care of 
              protecting the Amazon.
              </div>
            </div>
            <div className='pt-56'></div>
            <div className='bg-[#73ba1c] sm:mx-16 my-0'>
              <div className='p-4 text-white text-base font-bold'>
                  This button allows you to send money to the NPO.
              </div>
              <div className='p-4 text-red-500 text-xl font-bold'>
                  ONLY OWNER CAN DO THIS.
              </div>
            </div>
            <button id="buttonSendMoney" className="font-bold text-white rounded sm:my-2 mx-16 p-20 shadow-xl bg-[#73ba1c] hover:bg-[#56a41f] text-white py-2 border-b-4 border-[#449521] hover:border-[#2d8525] hover:-translate-y-1 rounded" onClick={() => sendMoneyToNPO()}>SEND MONEY</button>
      </div>
    </div>
    <div className="header">
      <nav className="absolute pin-t w-full">
        <div className="my-4  sm:my-0 ">
            <div className="relative flex items-center justify-center sm:justify-between pt-6">
              <Link href="/">
                <a className="no-underline inline-flex items-center text-white px-20 py-2 hover:bg-[#368b24] rounded transition transform hover:-translate-y-1 uppercase font-bold text-m">
                  Home
                </a>
              </Link>
              <Link href="/create-nft">
                <a className="no-underline inline-flex items-center text-white px-20 py-2 hover:bg-[#368b24] rounded transition transform hover:-translate-y-1 uppercase font-bold text-m">
                  Sell NFTs
                </a>
              </Link>
              <Link href="/my-nfts">
                <a className=" no-underline inline-flex items-center text-white px-20 py-2 hover:bg-[#368b24] rounded transition transform hover:-translate-y-1 uppercase font-bold text-m">
                  My NFTs
                </a>
              </Link>
              <Link href="/creator-panel">
                <a className=" no-underline inline-flex items-center text-white px-20 py-2 hover:bg-[#368b24] rounded transition transform hover:-translate-y-1 uppercase font-bold text-m">
                  Creator Panel
                </a>
              </Link>
            </div>
        </div>
      </nav>
      <header className="pt-8 sm:pt-8 pb-16">
        <div className="flex sm:pt-16">
          <div className="m-auto">
            <div className="items-center m:w-2/12 px-40">
                <img src="https://i.postimg.cc/90jbXnXN/nftree-bianco.png" className="h-80 w-full" />
            </div>
            <div className="text-center">
            </div>
          </div>
        </div>
      </header>
    </div>
    
        <Component {...pageProps} />
        <div className="mt-72 pl-10">© Copyright 2022. Created by  <a href="https://www.linkedin.com/in/emanuele-barberis-a47ba9225/" className='font-bold'>Emanuele Barberis</a> </div>
        
  </div>
  )
  
}

export default Marketplace

//<h1 className="text-white font-serif font-light">Awesome trees that sustain Amazon rainforest</h1>
