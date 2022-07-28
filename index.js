const express = require('express');
const ipfsClient = require('ipfs-http-client');
const bodyparser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const ejs = require('ejs');

//redis setting
const redis = require('redis');
const client = redis.createClient();

const ipfs = ipfsClient({host : 'localhost',port: '5001',protocol:'http'});
const app = express();

app.set('view engine','ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(fileUpload());

app.use(express.json());

app.get('/',async (req,res)=>{

    var jobs = [];
    await client.keys('*', function (err, keys) {
        if (err) return console.log(err);
        if(keys){
                for(var i=0; i<keys.length; i++){
                        let tmpKey = keys[i]
                        let job = {};
                        client.get(keys[i], async(err, data) =>{
                                if (err) console.error(err)
                                else {
                                    job['파일명']=tmpKey;
                                    job['CID']=data;
                                    jobs.push(job);
                                }
                        })
                }
        }
    });


    setTimeout( function(){
        console.log(jobs)
        res.render('home', {jobs:jobs});
    }, 2000);

});


// ethereum setting
let Web3 = require('web3');
const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;
const Eth = require('ethjs-query');
const privateKeyToAddress = require('ethereum-private-key-to-address')


let ABI = [
        {
                "inputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "constructor"
        },
        {
                "anonymous": false,
                "inputs": [
                        {
                                "indexed": true,
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                        },
                        {
                                "indexed": true,
                                "internalType": "address",
                                "name": "spender",
                                "type": "address"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "value",
                                "type": "uint256"
                        }
                ],
                "name": "Approval",
                "type": "event"
        },
        {
                "anonymous": false,
                "inputs": [
                        {
                                "indexed": true,
                                "internalType": "address",
                                "name": "from",
                                "type": "address"
                        },
                        {
                                "indexed": true,
                                "internalType": "address",
                                "name": "to",
                                "type": "address"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "value",
                                "type": "uint256"
                        }
                ],
                "name": "Transfer",
                "type": "event"
        },
        {
                "constant": true,
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                        },
                        {
                                "internalType": "address",
                                "name": "spender",
                                "type": "address"
                        }
                ],
                "name": "allowance",
                "outputs": [
                        {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                        }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
        },
        {
                "constant": false,
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "spender",
                                "type": "address"
                        },
                        {
                                "internalType": "uint256",
                                "name": "amount",
                                "type": "uint256"
                        }
                ],
                "name": "approve",
                "outputs": [
                        {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                        }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
        },
        {
                "constant": true,
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "account",
                                "type": "address"
                        }
                ],
                "name": "balanceOf",
                "outputs": [
                        {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                        }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
        },
        {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [
                        {
                                "internalType": "uint8",
                                "name": "",
                                "type": "uint8"
                        }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
        },
        {
                "constant": false,
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "spender",
                                "type": "address"
                        },
                        {
                                "internalType": "uint256",
                                "name": "subtractedValue",
                                "type": "uint256"
                        }
                ],
                "name": "decreaseAllowance",
                "outputs": [
                        {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                        }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
        },
        {
                "constant": false,
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "spender",
                                "type": "address"
                        },
                        {
                                "internalType": "uint256",
                                "name": "addedValue",
                                "type": "uint256"
                        }
                ],
                "name": "increaseAllowance",
                "outputs": [
                        {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                        }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
        },
        {
                "constant": true,
                "inputs": [],
                "name": "name",
                "outputs": [
                        {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                        }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
        },
        {
                "constant": true,
                "inputs": [],
                "name": "symbol",
                "outputs": [
                        {
                                "internalType": "string",
                                "name": "",
                                "type": "string"
                        }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
        },
        {
                "constant": true,
                "inputs": [],
                "name": "totalSupply",
                "outputs": [
                        {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                        }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
        },
        {
                "constant": false,
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "recipient",
                                "type": "address"
                        },
                        {
                                "internalType": "uint256",
                                "name": "amount",
                                "type": "uint256"
                        }
                ],
                "name": "transfer",
                "outputs": [
                        {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                        }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
        },
        {
                "constant": false,
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "sender",
                                "type": "address"
                        },
                        {
                                "internalType": "address",
                                "name": "recipient",
                                "type": "address"
                        },
                        {
                                "internalType": "uint256",
                                "name": "amount",
                                "type": "uint256"
                        }
                ],
                "name": "transferFrom",
                "outputs": [
                        {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                        }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
        }
]


const CA = "0x65951E0EC16e55f82f61D6b856d48Ed4bd02AFF5";


app.post('/uploadFile',(req,res)=>{
    const file = req.files.file;
    const fileName = req.body.fileName;
    const filePath = 'files/'+fileName;

    file.mv(filePath,async(err)=>{
        if(err){
            console.log("error : while uploading file");
            return res.status(500).send(err);
        }
        const fileHash = await addIpfsFile (fileName,filePath);

//파일삭제시작
//        fs.unlink(filePath,(err)=>{
//            if(err) console.log(err);
//        })
//파일삭제 끝

        client.set(fileName.toString(), fileHash.toString(), async (err, data) => {
                if (err) console.error(err)
        });

        res.render('upload',{fileName,fileHash});
    })
});

const addIpfsFile = async (fileName,filePath)=>{
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({path: fileName,content:file});
    const {cid} = fileAdded;
    return cid;
}


app.post('/sendToken',async (req, res)=>{

        let privatekey = req.body.privatekey
        let address = ''
        let amount = 0
        let toAddress = ''

        if(privatekey == 'feucet'){
                privatekey = 'contract owner address privatekey'
                address = '0x86d0C5108857d63E63EA51493aAA97B15bC26cDA'
                toAddress = req.body.address
                amount = 3000000000000000000

        } else {
                address = privateKeyToAddress(Buffer.from(privatekey.toString(), 'hex'))
                amount = 1500000000000000
                toAddress = '0x86d0C5108857d63E63EA51493aAA97B15bC26cDA'
        }

        console.log('privatekey: '+privatekey.toString() +',  address: '+address.toString());

        let provider = await new SignerProvider('https://ropsten.infura.io/v3/your auth_key', {
                 signTransaction: (rawTx, cb) => cb(null, sign(rawTx, '0x'+privatekey.toString())),
                 accounts: (cb) => cb(null, [address.toString()]),
        });

        let web3 = new Web3(provider);

        var ContractInstance = new web3.eth.Contract(ABI, CA);

        ContractInstance.methods.balanceOf(address.toString()).call().then(data => {
                console.log('HSToken Balance: ' + web3.utils.fromWei(data, "ether"))
        })

        ContractInstance.methods.transfer(toAddress.toString(), BigInt(amount))
        .send({
                from: address.toString(),
                gasPrice: 1499934388,
                gas: 10000000
        },function (err, txhash) {
            try {
                console.log(txhash)
                res.send(txhash);
            } catch (err) {
                console.log("Send Token Error ==>>>>" + err.toString());
                res.send('sendTransaction fail');
            }
        });

});



app.post('/downloadIPFS',async (req, res)=>{

        let cid = req.body.CID
        console.log(cid)
        console.log(ipfs.get)

        /*
        ipfs.files.get(cid, (err,files)=>{
            files.forEach((file) =>{
            console.log(file.path);
            console.log(file.content.toString('utf8'))
            downloadFile = file.content.toString('utf8')

            //download file save
            fs.writeFileSync('ipfs_download_testfile.txt', downloadFile, 'utf8', (err)=>{
                if(err) {
                    console.log(err);
                }
                console.log('write end');
            })

            })
        })
        */

      res.send('success');
})


app.post('/getBalance',async (req, res)=>{

        let address = req.body.address
        console.log(address)

        let provider = await new SignerProvider('https://ropsten.infura.io/v3/your authkey', {
                 signTransaction: (rawTx, cb) => cb(null, sign(rawTx, 'your privateKey')),
                 accounts: (cb) => cb(null, ["0x86d0C5108857d63E63EA51493aAA97B15bC26cDA"]),
        });

        let web3 = new Web3(provider);

        var ContractInstance = new web3.eth.Contract(ABI, CA);

        ContractInstance.methods.balanceOf(address.toString()).call().then(data => {
                console.log('HSToken Balance: ' + web3.utils.fromWei(data, "ether"))
                res.send( web3.utils.fromWei(data, "ether"));
        })

})





app.listen(3000,()=>{
    console.log('Server listening on port 3000');
});

