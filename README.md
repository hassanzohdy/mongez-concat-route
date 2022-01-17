# Concat Route

A lightweight function to concat multiple routes and generate proper one.

## Installation

`yarn add @mongez/concat-route`

Or

`npm i @mongez/concat-route`

## Usage

```ts
import concatRoute from '@mongez/concat-route'

console.log(concatRoute('')); // /
console.log(concatRoute('/')); // /
console.log(concatRoute('/', 'home')); // /home
console.log(concatRoute('/', 'home', '', null, undefined, '/')); // /home
console.log(concatRoute('/', 'home', '/welcome/')); // /home/welcome
console.log(concatRoute('/', 'home', '/welcome/', '////')); // /home/welcome
console.log(concatRoute('/', 'home', '///welcome///', '////', 'again')); // /home/welcome/again
```

Hope you enjoy the function :)
