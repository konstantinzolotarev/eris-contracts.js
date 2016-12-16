'use strict'

const solContract = `

  contract Test {

    function add(int a, int b) constant returns (int sum) {
        sum = a + b;
    }
  }
`

const Solidity = require('solc')
const _ = require('lodash')
const erisC = require('./index')
var edbFactory = require('eris-db');
var edb = edbFactory.createInstance("http://127.0.0.1:1337/rpc");

const nacl = require('tweetnacl')

const validator = require(process.env.HOME + '/.eris/chains/simplechain/priv_validator.json')
const accountData = {
    address: validator.address,
    pubKey: validator.pub_key,
    privKey: validator.priv_key
}
const manager = erisC.newContractManagerDev('http://localhost:1337/rpc', accountData)

const compiled = Solidity.compile(solContract, 1).contracts['Test']
const abi = JSON.parse(compiled.interface)

var coder = require('web3/lib/solidity/coder')

var txParams = {
    nonce: '0',
    // gasPrice: '0x09184e72a000',
    // gasLimit: '0x2710',
    to: '0000000000000000000000000000000000000000',
    value: '0',
    data: ''
}

const TxInput = {
    address: accountData.address,
    amount: 100,
    sequence: 0,
    signature: '',
    pub_key: accountData.pubKey
}

const TxOutput = {
    address: '0000000000000000000000000000000000000000',
    amount: 100
}

function sign(json) {
    var keccak_256 = require('js-sha3').keccak_256;
    var crypto = require('crypto');
    var secp256k1 = require('secp256k1');

    //gen sig
    var privKey1 = new Buffer(accountData.privKey, "hex");
    var msg_hash = keccak_256(JSON.stringify(json));
    var msg_hash_buffer = new Buffer(msg_hash, "hex");
    var signature1 = nacl.sign(msg_hash_buffer, privKey1)
    var signBuffer = new Buffer(signature1)
    return signBuffer.toString("hex");
    // return signBuffer;

    // console.log(signature1)
    // console.log(typeof(signature1))

    // json.sig = signature1;
    // json.msg = msg_hash_buffer.toString("hex");
    // return signature1
}

function createNew(data, cb) {
    // parse arguments
    var callback = cb || _.noop;

    txParams.data = data.data
    TxInput.signature = sign(txParams)

    const tx = {
        input: TxInput,
        address: accountData.address,
        gas_limit: 10000,
        fee: 100,
        data: txParams.data
    }
    try {
        edb.txs().broadcastTx(tx, function(error, address) {
            if (error)
                callback(error);

            // else
            //     that.at(address, callback);
            // }
            callback(error, address)
        });
    } catch (error) {
        callback(error);
    }
}


const contractFactory = manager.newContractFactory(abi)
// contractFactory.new({ data: compiled.bytecode }, (err, data) => {
//   console.log('==========================')
//   console.log(err, data)
//   console.log('==========================')
// })

createNew({
    data: compiled.bytecode
}, (err, data) => {
    edb.txs().getUnconfirmedTxs(console.log)
    console.log('==========================')
    console.log(err, data)
    console.log('==========================')
})

// const tr = contractFactory.at('0000000000000000000000000000000000000000')
// tr.add(1, 2, (err, num) => {
//   console.log('==========================')
//   console.log(num.toNumber())
//   console.log('==========================')
// })
