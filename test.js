'use strict'

const contractName = 'SimpleContract'
const solContract = `

  contract ${contractName} {
      address storedData;

      function set(address x) {
          storedData = x;
      }

      function get() constant returns (address retVal) {
          return storedData;
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

const compiled = Solidity.compile(solContract, 1).contracts[contractName]
const abi = JSON.parse(compiled.interface)

var coder = require('web3/lib/solidity/coder')

function sign(json) {
    const crypto = require('tendermint-crypto')
    const PrivKeyEd25519 = crypto.PrivKeyEd25519
    const userKey = new PrivKeyEd25519(new Buffer(accountData.privKey, "hex"))

    //gen sig
    const signed = userKey.signString(JSON.stringify(json))
    // const valid = userKey.makePubKey().verifyString(JSON.stringify(json), signed)

    return signed
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

    const tx = {
        Input: {
          Address: accountData.address,
          Amount: 100,
          Sequence: 124
        },
        // Address: accountData.address,
        Address: '',
        GasLimit: 223,
        Fee: 123,
        Data: data.data
    }
    const signed = sign(tx)
    // sign transaction
    // tx.input = TxInput
    tx.Input.Signature = signed
    // tx.input.signature[0] = 2
    // edb.blockchain().getChainId(console.log)
    // edb.accounts().getAccounts(console.log)
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

// edb.accounts().getAccounts(console.log)

createNew({
    data: compiled.bytecode
}, (err, data) => {
    // edb.txs().getUnconfirmedTxs(console.log)
    edb.accounts().getAccounts(console.log)
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
