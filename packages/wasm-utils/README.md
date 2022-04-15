## How to install
Wasm utils for generating zero-knowledge proof and deposit notes, it's built with [rust](https://www.rust-lang.org/) and [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen)
it's consumed by the `sdk-core`

## Install packages
```sh
yarn
```

# Build for production
```sh
yarn build
```

## How to run unit tests
Run wasm tests
```sh
yarn test
```
Run typescript tests
```
yarn test:ts
```
## What does each file do?

* `Cargo.toml` contains the standard Rust metadata. You put your Rust dependencies in here. You must change this file with your details (name, description, version, authors, categories)

* `package.json` contains the standard npm metadata. You put your JavaScript dependencies in here. You must change this file with your details (author, name, version)

* `webpack.config.js` contains the Webpack configuration. You shouldn't need to change this, unless you have very special needs.

* The `js` folder contains your JavaScript code (`index.js` is used to hook everything into Webpack, you don't need to change it).

* The `src` folder contains your Rust code.

* The `static` folder contains any files that you want copied as-is into the final build. It contains an `index.html` file which loads the `index.js` file.

* The `tests` folder contains your Rust unit tests.
