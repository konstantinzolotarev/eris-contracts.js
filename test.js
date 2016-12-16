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

const validator = require(process.env.HOME + '/.eris/chains/simplechain/priv_validator.json')
const data = {
  address: validator.address,
  pubKey: validator.pub_key,
  privKey: validator.priv_key
}
const manager = erisC.newContractManagerDev('http://localhost:1337/rpc', data)

const compiled = Solidity.compile(solContract, 1).contracts['Test']
const abi = JSON.parse(compiled.interface)
const contractFactory = manager.newContractFactory(abi)

contractFactory.new({ data: compiled.bytecode }, (err, data) => {
  console.log('==========================')
  console.log(err, data)
  console.log('==========================')
})
