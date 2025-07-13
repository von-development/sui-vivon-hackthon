# https://docs.sui.io/concepts/object-ownership

[Skip to main content](https://docs.sui.io/concepts/object-ownership#__docusaurus_skipToContent_fallback)

On this page

Every object has an owner field that dictates how you can use it in transactions. Objects can have the following types of ownership:

## Address-owned [​](https://docs.sui.io/concepts/object-ownership\#address-owned "Direct link to Address-owned")

An address-owned object is owned by a specific 32-byte address that is either an account address (derived from a particular signature scheme) or an object ID. An address-owned object is accessible only to its owner and no others.

Go to [Address-Owned Objects](https://docs.sui.io/concepts/object-ownership/address-owned).

## Immutable [​](https://docs.sui.io/concepts/object-ownership\#immutable "Direct link to Immutable")

An immutable object is an object that can't be mutated, transferred, or deleted. Immutable objects have no owner, so anyone can use them.

Go to [Immutable Objects](https://docs.sui.io/concepts/object-ownership/immutable).

## Shared [​](https://docs.sui.io/concepts/object-ownership\#shared "Direct link to Shared")

A shared object is an object that is shared using the `0x2::transfer::share_object` function and is accessible to everyone. Unlike owned objects, anyone can access shared ones on the network.

Go to [Shared Objects](https://docs.sui.io/concepts/object-ownership/shared).

## Wrapped [​](https://docs.sui.io/concepts/object-ownership\#wrapped "Direct link to Wrapped")

In Move, you can organize data structures by putting a field of `struct` type in another.

Go to [Wrapped Objects](https://docs.sui.io/concepts/object-ownership/wrapped).

- [Address-owned](https://docs.sui.io/concepts/object-ownership#address-owned)
- [Immutable](https://docs.sui.io/concepts/object-ownership#immutable)
- [Shared](https://docs.sui.io/concepts/object-ownership#shared)
- [Wrapped](https://docs.sui.io/concepts/object-ownership#wrapped)