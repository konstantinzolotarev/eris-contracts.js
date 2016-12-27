'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const Solidity = require('solc')
const test = require('../../lib/test')

const source = `
  contract SimpleStorage {
      address storedData;

      function SimpleStorage(address x) {
          storedData = x;
      }

      function get() constant returns (address retVal) {
          return storedData;
      }
  }
`

const compile = (contractManager, source, name) => {
  const compiled = Solidity.compile(source, 1).contracts[name]
  const abi = JSON.parse(compiled.interface)
  const contractFactory = contractManager.newContractFactory(abi)

  return Promise.fromCallback((callback) =>
    contractFactory.new(
      '88977A37D05A4FE86D09E88C88A49C2FCF7D6D8F',
      {data: compiled.bytecode},
      callback
    )
  )
}

it('#61', function () {
  this.timeout(60 * 1000)

  return test.newContractManager('blockchain', {protocol: 'http:'})
    .then((manager) =>
      compile(manager, source, 'SimpleStorage').then((contract) =>
        Promise.fromCallback((callback) =>
          contract.get(callback)
        )
      ).then((value) => {
        assert.equal(value, '88977A37D05A4FE86D09E88C88A49C2FCF7D6D8F')
      })
    )
})
