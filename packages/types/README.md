# @webb-tools/types

This package is intended to decorate the @polkadot/api with 
webb's types before generating the api object and returning to the client.

## Updating chain types
In order to update the types for the runtimes we're interested in, you'll need to run a chain with the latest runtime. Currently, this is the egg standalone network.
```
yarn update-metadata
yarn build:interfaces
```
