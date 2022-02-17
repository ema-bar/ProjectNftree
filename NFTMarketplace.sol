pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/NFT.sol";

contract NFTMarketplace is ReentrancyGuard{
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemSold;
    uint256 private totalCommissionForOnlus;
    address private amazonOnlusAddress;
    address payable owner;
    uint256 listingPrice = 0.025 ether;
    mapping(uint256 => NFTItem) private idToNftItem;


    struct NFTItem{
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        address creator;
        uint256 price;
        uint256 originalSellingPrice;
        address[] listOfSeller;
        bool sold;
    }

    modifier onlyNFTOwner(uint itemId) {
        require(idToNftItem[itemId].owner == msg.sender,"Only NFT owner can do this operation");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner,"Only owner can do this operation");
        _;
    }

    constructor(){
        owner = payable(msg.sender);
    }

    event NFTItemCreate(
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        address creator,
        uint256 price,
        uint256 originalSellingPrice,
        address[] listOfSeller,
        bool sold
    );

    event ProductListed(
        uint indexed itemId
    );

    function totalMoney(uint256 amount) private{
        totalCommissionForOnlus += amount;
    }

    function gettotalMoney() public view onlyOwner returns(uint256){
        return totalCommissionForOnlus;
    }

    function setOnlusAddress(address payable _amazonOnlusAddress) public onlyOwner{
        amazonOnlusAddress = _amazonOnlusAddress;
    }


    function sendMoneyToOnlus() payable public onlyOwner nonReentrant{
        require(msg.value <= totalCommissionForOnlus, "Inserisci un'ammontare minore o uguale al totale ricavato.");
        require(msg.value > 0, "Minimo 1 wei per poter trasferire.");
        totalCommissionForOnlus -= msg.value;
        payable(amazonOnlusAddress).transfer(msg.value);
    }


    //funzione che ritorna il prezzo per listare (Da rivedere)
    function getListingPrice() public view returns (uint256){
        return listingPrice;
    }

    //funzione per la creazione di NFTItem
    function createNFTItem(
        address nftContract, 
        uint256 tokenId, 
        uint256 price) 
        public payable nonReentrant{
            require(price > 0, "Il prezzo deve essere di almeno 1 wei");
            require(msg.value == listingPrice, "Il prezzo di listino deve essere pari a 0.025 ehter"); //(DA RIVEDERE)

            _itemIds.increment();
            uint256 itemId = _itemIds.current();
            address[]  memory listOfSeller = new address[](1);
             

            idToNftItem[itemId] = NFTItem( 
                itemId, 
                nftContract, 
                tokenId,
                payable(msg.sender),
                payable(address(0)),
                msg.sender,
                price,
                price,
                listOfSeller,
                false
            );
            idToNftItem[itemId].listOfSeller[0] = msg.sender;
            NFT tokenContract = NFT(nftContract);
            tokenContract.transferToken(msg.sender, address(this), tokenId);

            emit NFTItemCreate(itemId, nftContract, tokenId, msg.sender, address(0), msg.sender, price, price, listOfSeller, false);
    }

    function createNFTSale(
        address nftContract,
        uint256 itemId)
        public payable nonReentrant{
            uint price = idToNftItem[itemId].price;
            uint tokenId = idToNftItem[itemId].tokenId;
            require(msg.value == price, "Inserisci il prezzo richiesto per completare l'acquisto");
            
            NFT tokenContract = NFT(nftContract);
            tokenContract.transferToken(address(this), msg.sender, tokenId);
            idToNftItem[itemId].seller.transfer(msg.value - (msg.value)/20);
            idToNftItem[itemId].owner = payable(msg.sender);
            idToNftItem[itemId].sold = true;
            _itemSold.increment();
            owner.transfer(listingPrice);
            owner.transfer((msg.value)/20);
            totalMoney(listingPrice);
            totalMoney((msg.value)/20);
    }

    function reSaleNft(
        address nftContract,
        uint256 itemId,
        uint256 newPrice)
        public payable nonReentrant onlyNFTOwner(itemId){
            uint tokenId = idToNftItem[itemId].tokenId;
            require(newPrice > 0, "Il prezzo deve essere di almeno 1 wei");
            require(msg.value == listingPrice, "Il prezzo di listino deve essere pari a 0.025 ehter"); //(DA RIVEDERE)
            address oldOwner = idToNftItem[itemId].owner;
            NFT tokenContract = NFT(nftContract);
            tokenContract.transferToken(msg.sender, address(this), tokenId);
            idToNftItem[itemId].price = newPrice;
            idToNftItem[itemId].seller = payable(oldOwner);
            idToNftItem[itemId].owner = payable(address(0));
            idToNftItem[itemId].sold = false;
            idToNftItem[itemId].listOfSeller.push(idToNftItem[itemId].seller);
            _itemSold.decrement();
            emit ProductListed(itemId);
    }

    //funzione per fetchare nft del marketplace
    function fetchNFTItems() public view returns (NFTItem[] memory){
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemSold.current();
        uint currentIndex = 0;

        NFTItem[] memory items = new NFTItem[](unsoldItemCount);
        for (uint i = 0; i < itemCount; i++){
            if(idToNftItem[i+1].owner == address(0)){
                uint currentId = idToNftItem[i+1].itemId;
                NFTItem storage currentItem = idToNftItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    //funzione per fetchare nft propri
    function fetchMyNFT() public view returns (NFTItem[] memory){
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i = 0; i < totalItemCount; i++){
            if(idToNftItem[i+1].owner == msg.sender){
                itemCount +=1;
            }
        }

        NFTItem[] memory items = new NFTItem[](itemCount);
        for(uint i = 0; i < totalItemCount; i++){
            if(idToNftItem[i+1].owner == msg.sender){
                uint currentId = idToNftItem[i+1].itemId;
                NFTItem storage currentItem = idToNftItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex +=1;
            }
        }
        return items;
    }

    //funzione per fetchare nft creati
    function fetchItemsCreated() public view returns (NFTItem[] memory){
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++){
            if(idToNftItem[i+1].creator == msg.sender){
                itemCount += 1;
            }
        }

        NFTItem[] memory items = new NFTItem[](itemCount);
        for(uint i = 0; i < totalItemCount; i++){
            if(idToNftItem[i+1].creator == msg.sender){
                uint currentId = idToNftItem[i+1].itemId;
                NFTItem storage currentItem = idToNftItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchItemsCreatedAndSold() public view returns (NFTItem[] memory){
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++){
            if(idToNftItem[i+1].creator == msg.sender){
                if(idToNftItem[i+1].listOfSeller.length > 1 || idToNftItem[i+1].sold == true){
                    itemCount += 1;
                }
            }
        }
        NFTItem[] memory items = new NFTItem[](itemCount);
        for(uint i = 0; i < totalItemCount; i++){
            if(idToNftItem[i+1].creator == msg.sender){
                if(idToNftItem[i+1].listOfSeller.length > 1 || idToNftItem[i+1].sold == true){
                    uint currentId = idToNftItem[i+1].itemId;
                    NFTItem storage currentItem = idToNftItem[currentId];
                    items[currentIndex] = currentItem;
                    currentIndex += 1;
                }
            }
        }
        return items;
    }

    function fetchItemsReselled() public view returns (NFTItem[] memory){
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        bool flag = false;
        for (uint i = 0; i < totalItemCount; i++){
            for(uint z = 0; z <idToNftItem[i+1].listOfSeller.length; z++){
                if( idToNftItem[i+1].listOfSeller[z] == msg.sender 
                && idToNftItem[i+1].creator != msg.sender
                && !flag
                && z+1 < idToNftItem[i+1].listOfSeller.length){
                            itemCount += 1;
                            flag = true;
                } else if(idToNftItem[i+1].listOfSeller[z] == msg.sender 
                        && idToNftItem[i+1].sold == true
                        && idToNftItem[i+1].creator != msg.sender
                        && !flag){
                            itemCount += 1;
                            flag = true;
                }
            }
            flag = false;
        }

        NFTItem[] memory items = new NFTItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++){
            for(uint z = 0; z <idToNftItem[i+1].listOfSeller.length; z++){
                if( idToNftItem[i+1].listOfSeller[z] == msg.sender 
                && idToNftItem[i+1].creator != msg.sender
                && !flag
                && z+1 < idToNftItem[i+1].listOfSeller.length){
                            uint currentId = idToNftItem[i+1].itemId;
                            NFTItem storage currentItem = idToNftItem[currentId];
                            items[currentIndex] = currentItem;
                            currentIndex += 1;
                            flag = true;
                } else if(idToNftItem[i+1].listOfSeller[z] == msg.sender 
                        && idToNftItem[i+1].sold == true
                        && idToNftItem[i+1].creator != msg.sender
                        && !flag){
                            uint currentId = idToNftItem[i+1].itemId;
                            NFTItem storage currentItem = idToNftItem[currentId];
                            items[currentIndex] = currentItem;
                            currentIndex += 1;
                            flag = true;
                }
            }
            flag = false;
        }


        return items;
    }

    /**function fectchItemsSold() public view returns (NFTItem[] memory){
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++){
            if(idToNftItem[i+1].sold == true){
                itemCount += 1;
            }
        }
        NFTItem[] memory items = new NFTItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++){
            if(idToNftItem[i+1].sold == true){
                uint currentId = idToNftItem[i+1].itemId;
                NFTItem storage currentItem = idToNftItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }  */

}