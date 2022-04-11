# Running node tests

Install [node v16](https://nodejs.org/en/) , the tests is written in typescript and it uses the experimental module loader

To run example script
from project root
```sh
NODE_OPTIONS="--loader ./loader.js" node ./examples/node/sdk-core/anchor.ts
```
