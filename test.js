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
    pub_key: [1, accountData.pubKey]
}

const TxOutput = {
    address: '0000000000000000000000000000000000000000',
    amount: 100
}

function sign(json) {
    const crypto = require('tendermint-crypto')
    const PrivKeyEd25519 = crypto.PrivKeyEd25519
    const userKey = new PrivKeyEd25519(new Buffer(accountData.privKey, "hex"))

    //gen sig
    return userKey.signString(JSON.stringify(json))
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
    const tx = {
        input: TxInput,
        address: accountData.address,
        gas_limit: 10000,
        fee: 100,
        data: data.data
    }
    // sign transaction
    tx.input.signature = sign(tx)
    // tx.input.signature[0] = 2

    // Try to send signed transaction into eris-db
    try {
        edb.txs().broadcastTx(tx, function(error, address) {
            if (error)
                return callback(error);

            // else
            //     that.at(address, callback);
            // }
            return callback(error, address)
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
