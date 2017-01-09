'use strict'

const contractName = 'SimpleContract'
const solContract = `

  contract ${contractName} {

    function add(int a, int b) constant returns (int sum) {
        sum = a + b;
    }
  }
`

const Solidity = require('solc')
// const erisC = require('./index')
// Create eris-db connection
const edbFactory = require('eris-db');
const edb = edbFactory.createInstance("http://127.0.0.1:1337/rpc");

// Getting priv key for user and address
const validator = require(process.env.HOME + '/.eris/chains/simplechain/priv_validator.json')
const accountData = {
    address: validator.address,
    pubKey: validator.pub_key,
    privKey: validator.priv_key
}

// Compile contract
const compiled = Solidity.compile(solContract, 1).contracts[contractName]
const abi = JSON.parse(compiled.interface)

function sign(json) {
    const crypto = require('tendermint-crypto')
    const PrivKeyEd25519 = crypto.PrivKeyEd25519
    const privKey = new PrivKeyEd25519(new Buffer(accountData.privKey[1], "hex"))

    //gen sig
    try {
      const signed = privKey.signString(JSON.stringify(json))
      // const valid = privKey.makePubKey().verifyString(JSON.stringify(json), signed)
      // console.log("Valid: ", valid)

      return signed.toJSON()
    } catch(err) {
      console.error(err)
    }
}

function createNew(data, cb) {
    // parse arguments
    var callback = cb || function () {}

    const tx = {
        // address: accountData.address,
        address: '',
        data: data.data.toUpperCase(),
        fee: 12,
        gas_limit: 223,
        input: {
            address: accountData.address,
            amount: 100,
            sequence: 1
        },
    };

    const txForSigning = {
        chain_id: "simplechain",
        tx: [
            2,
            {
                address: tx.address,
                data: tx.data,
                fee: tx.fee,
                gas_limit: tx.gas_limit,
                input: {
                    address: tx.input.address,
                    amount: tx.input.amount,
                    sequence: tx.input.sequence
                }
            }
        ]
    };

    // sign transaction
    const signed = sign(txForSigning)

    tx.input.signature = signed
    // tx.input.pub_key = [1, accountData.pubKey]
    tx.input.pub_key = accountData.pubKey

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

// const manager = erisC.newContractManagerDev('http://localhost:1337/rpc', accountData)
// const contractFactory = manager.newContractFactory(abi)
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
    // edb.accounts().getAccounts(console.log)
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
