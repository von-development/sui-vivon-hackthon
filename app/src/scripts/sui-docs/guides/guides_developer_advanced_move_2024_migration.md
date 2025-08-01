# https://docs.sui.io/guides/developer/advanced/move-2024-migration

[Skip to main content](https://docs.sui.io/guides/developer/advanced/move-2024-migration#__docusaurus_skipToContent_fallback)

On this page

New features for Move are becoming available in 2024, a part of the aptly titled "Move 2024" edition. Many of these changes are enhancements to the source language, affecting the compiler without requiring any changes to the binary representation published on chain.

The primary goal of these changes is to make Move easier to write, and hopefully easier to read. The relatively few breaking changes introduced to the source language are to better position Move to handle future advancements.

Existing code will continue to compile, even with the addition of these new features. And because these features are opt-in, you can write your packages with the new features, even if your dependencies do not. Opting to take advantage of the new features in your current modules, however, does introduce some breaking changes.

This document highlights some new features to try out and shows how to migrate your existing modules to use Move 2024.

info

Please, provide any feedback or report any issues you encounter via [GitHub](https://github.com/MystenLabs/sui/issues/new/choose), [Discord](https://discord.gg/Sui), or [Telegram](https://t.me/SuiTokenNetwork).

## How to migrate [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#how-to-migrate "Direct link to How to migrate")

To migrate a project to Move 2024 Beta:

1. Delete your existing `Move.lock` file (if one exists) to make sure you're using the newest `sui-framework` version.
2. Perform one of the following:
   - Run `sui move migrate` in the root of your Move project. See [Automatic migration](https://docs.sui.io/guides/developer/advanced/move-2024-migration#automatic-migration).
   - Alternatively, update your `Move.toml` file's `[package]` entry to include `edition = "2024.beta"`. If you do this, you might receive a number of new errors related to the [breaking changes](https://docs.sui.io/guides/developer/advanced/move-2024-migration#breaking-changes).

### Automatic migration [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#automatic-migration "Direct link to Automatic migration")

Move 2024 includes an automatic migration script that you can use by calling `sui move migrate` in the root of your Move project. Upon running, your console prompts you for which Move edition to use. If you select `2024.beta`, the script invokes the compiler and attempts to automatically update your code to avoid the [breaking changes](https://docs.sui.io/guides/developer/advanced/move-2024-migration#breaking-changes) the update introduces (including marking structs as `public`, mutable variables with the `mut` keyword, avoiding restricted keywords, swapping `friend` s for `public(package)`, and even updating paths to global paths in many cases).

After this is done, your console displays a diff of the changes the script intends to make. If you accept the changes, the script updates your code and your `Move.toml` file automatically. You are now using Move 2024 Beta.

### Update IDE support [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#update-ide-support "Direct link to Update IDE support")

Use the new [VSCode Move extension](https://marketplace.visualstudio.com/items?itemName=mysten.move) to get support for Move 2024 features. The new extension has a number of improvements over the original [move-analyzer extension](https://marketplace.visualstudio.com/items?itemName=move.move-analyzer), but if you would like to keep using the original one, be sure to rebuild and reinstall the `move-analyzer` binary to get 2024 support:

```codeBlockLines_p187
$ cargo install --git https://github.com/MystenLabs/sui.git move-analyzer

```

See the getting started guide on [Move IDEs and plugins](https://docs.sui.io/references/contribute/sui-environment#move-ides-and-plugins) for more information.

## New features [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#new-features "Direct link to New features")

Here is a brief overview of some of the new features in Move 2024.

### Method syntax [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#method-syntax "Direct link to Method syntax")

You can call certain functions now as methods using the `.` syntax. For example, the following call

```codeBlockLines_p187
vector::push_back(&mut v, coin::value(&c));

```

can now be written as

```codeBlockLines_p187
v.push_back(c.value());

```

Where the receiver of the method ( `v` and `c` in this example) is automatically borrowed if necessary (as `&mut v` and `&c` respectively).

You can call any function defined in the same module as the receiver's type as a method if it takes the receiver as its first argument.

For functions defined outside the module, you can declare methods using `public use fun` and `use fun`.

### Index syntax [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#index-syntax "Direct link to Index syntax")

With method syntax, you can annotate certain functions as being `#[syntax(index)]` methods. You then call these methods using `v[i]`-style calls.

For example,

```codeBlockLines_p187
*&mut v[i] = v[j];

```

resolves to

```codeBlockLines_p187
*vector::borrow_mut(&mut v, i) = *vector::borrow(&v, j);

```

### public(package) [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#public-package "Direct link to public(package)")

`friend` declarations, and the associated `public(friend)` visibility modifiers, are deprecated. In their place is the `public(package)` visibility modifier, which allows calling functions only within the same package where they are defined.

### Positional fields [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#positional-fields "Direct link to Positional fields")

You can now define `struct` s with positional fields, which are accessed by zero-based index. For example,

```codeBlockLines_p187
public struct Pair(u64, u64) has copy, drop, store;

```

then to access each field,

```codeBlockLines_p187
public fun sum(p: &Pair): u64 {
  p.0 + p.1
}

```

And as this example shows, you can now declare abilities after the struct field list.

### Nested `use` and standard library defaults [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#nested-use-and-standard-library-defaults "Direct link to nested-use-and-standard-library-defaults")

You can now nest `use` aliases for more conciseness.

```codeBlockLines_p187
use sui::{balance, coin::{Self, Coin}};

```

Additionally, the following `use` declarations are now automatically included in every module:

```codeBlockLines_p187
use std::vector;
use std::option::{Self, Option};
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

```

### Automatic referencing in equality [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#automatic-referencing-in-equality "Direct link to Automatic referencing in equality")

Equality operations, `==` and `!=`, now automatically borrow if one side is a reference and the other is not. For example,

```codeBlockLines_p187
fun check(x: u64, r: &u64): bool {
  x == r
}

```

is equivalent to

```codeBlockLines_p187
fun check(x: u64, r: &u64): bool {
  &x == r
}

```

This automatic borrowing can occur on either side of `==` and `!=`.

### Loop labels [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#loop-labels "Direct link to Loop labels")

When nesting loops, it can be convenient to break to the outer loop. For example,

```codeBlockLines_p187
let mut i = 0;
let mut j = 0;
let mut terminate_loop = false;
while (i < 10) {
    while (j < 10) {
        if (haystack(i, j) == needle) {
            terminate_loop = true;
            break;
        };
        j = j + 1;
    };
    if (terminate_loop) break;
    i = i + 1;
}

```

Now, you can directly name the outer loop ( `outer` in this case) and break it all at once:

```codeBlockLines_p187
let mut i = 0;
let mut j = 0;
'outer: while (i < 10) {
    while (j < 10) {
        if (haystack(i, j) == needle) break'outer;
        j = j + 1;
    };
    i = i + 1;
}

```

### `break` with value [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#break-with-value "Direct link to break-with-value")

It's now possible to `break` with a value from a `loop`. For example,

```codeBlockLines_p187
let mut i = 0;
let x: u64 = loop {
    if (v[i] > 10) break i;
    i = i + 1;
};

```

You can achieve this with labels, as well. For example,

```codeBlockLines_p187
let mut i = 0;
let mut j = 0;
let item = 'outer: loop {
    while (j < 10) {
        let item = haystack(i, j);
        if (item == needle) break'outer option::some(item);
        j = j + 1;
    };
    i = i + 1;
    if (i == 10) break option::none();
};

```

## Breaking changes [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#breaking-changes "Direct link to Breaking changes")

Breaking changes are, unfortunately, a growing pain in Move 2024. We anticipate these changes to be minimally invasive and have provided a migration script to automate them in most cases. In addition, these changes pave the way for new features still to come in Move 2024.

### Datatype visibility requirements [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#datatype-visibility-requirements "Direct link to Datatype visibility requirements")

Currently, all structs in Move are, by convention, public: any other module or package can import them and refer to them by type. To make this clearer, Move 2024 requires that all structs be declared with the `public` keyword. For example,

```codeBlockLines_p187
// legacy code
struct S { x: u64 }

// Move 2024 code
public struct S { x: u64 }

```

Any non-public struct produces an error at this time, though the Move team is working on new visibility options for future releases.

### Mutability requirements [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#mutability-requirements "Direct link to Mutability requirements")

Previously, all variables in Move were implicitly mutable. For example,

```codeBlockLines_p187
fun f(s: S, y: u64): u64 {
    let a = 0;
    let S { x } = s;
    a = 1;
    x = 10;
    y = 5;
    x + y
}

```

Now, you must declare mutable variables explicitly:

```codeBlockLines_p187
fun f(s: S, mut y: u64): u64 {
    let mut a = 0;
    let S { mut x } = 5;
    a = 1;
    x = 10;
    y = 5;
    x + y
}

```

The compiler now produces an error if you attempt to reassign or borrow a variable mutably without this explicit declaration.

### Removing friends and `public(friend)` [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#removing-friends-and-publicfriend "Direct link to removing-friends-and-publicfriend")

Friends and the `public(friend)` visibilities were introduced early in Move's development, predating even the package system. As indicated in the [public(package)](https://docs.sui.io/guides/developer/advanced/move-2024-migration#public-package) section, `public(package)` deprecates `public(friend)` in Move 2024.

The following declaration now produces an error:

```codeBlockLines_p187
module pkg::m {
    friend pkg::a;
    public(friend) fun f() { ... }
}

module pkg::a {
    fun calls_f() { ... pkg::m::f() ... }
}

```

Instead, if you want your function to be visible only in the package, write:

```codeBlockLines_p187
module pkg::m {
    public(package) fun f() { ... }
}

module pkg::a {
    // this now works directly
    fun calls_f() { ... pkg::m::f() ... }
}

```

### New keywords [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#new-keywords "Direct link to New keywords")

Looking toward the future, Move 2024 Beta adds the following keywords to the language: `enum`, `for`, `match`, `mut`, and `type`. The compiler, unfortunately, now produces parsing errors when it finds these in other positions. This is a necessary change as the language matures. If you perform automatic migration, the migration tool renames these as `enum` and so on, rewriting the code to use these escaped forms.

### Revised paths and namespaces [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#revised-paths-and-namespaces "Direct link to Revised paths and namespaces")

Move 2024 revises how paths and namespaces work compared to legacy Move, toward easing `enum` aliasing in the future. Consider the following snippet from a test annotation in the `sui_system` library:

```codeBlockLines_p187
use sui_system::sui_system;
...
#[expected_failure(abort_code = sui_system::validator_set::EInvalidCap)]

```

Legacy Move would always treat a three-part name as an address( `sui_system`), module( `validator_set`), and module member ( `EInvalidCap`). Move 2024 respects scope for `use`, so `sui_system` in the attribute resolves to the module, producing a name resolution error overall.

To avoid cases where this is the intended behavior, Move 2024 introduces a prefix operation for global qualification. To use, you can rewrite this annotation as:

```codeBlockLines_p187
use sui_system::sui_system;
...
#[expected_failure(abort_code = ::sui_system::validator_set::EInvalidCap)]
                             // ^ note `::` here

```

The migration script attempts to remediate naming errors using global qualification when possible.

## Follow along [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#follow-along "Direct link to Follow along")

The beta release of Move 2024 comes with some powerful new features in addition to the breaking changes described here. There are also more on the horizon. Join the [Sui developer newsletter](https://sui.io/developers#newsletter) to learn about new, exciting features coming to Move this year, including syntactic macros, enums with pattern matching, and other user-defined syntax extensions.

### `alpha` and `beta` guidance [​](https://docs.sui.io/guides/developer/advanced/move-2024-migration\#alpha-and-beta-guidance "Direct link to alpha-and-beta-guidance")

- `beta` (specified via `edition = "2024.beta"`) is the recommended edition. It includes all the new
features mentioned above and all breaking changes. While there is the risk of breaking changes or
bugs in `beta`, you should feel comfortable using it in your projects. As new features are added
and tested, they will be included in the `beta` edition. The `beta` edition will end after _all_
features for the year have been added and finalized.
- `alpha` (specified via `edition = "2024.alpha"`) will get new features and changes as they are
developed. Breaking changes to features in `alpha` should be expected. As such, take caution when
using `alpha` in your projects.

- [How to migrate](https://docs.sui.io/guides/developer/advanced/move-2024-migration#how-to-migrate)
  - [Automatic migration](https://docs.sui.io/guides/developer/advanced/move-2024-migration#automatic-migration)
  - [Update IDE support](https://docs.sui.io/guides/developer/advanced/move-2024-migration#update-ide-support)
- [New features](https://docs.sui.io/guides/developer/advanced/move-2024-migration#new-features)
  - [Method syntax](https://docs.sui.io/guides/developer/advanced/move-2024-migration#method-syntax)
  - [Index syntax](https://docs.sui.io/guides/developer/advanced/move-2024-migration#index-syntax)
  - [public(package)](https://docs.sui.io/guides/developer/advanced/move-2024-migration#public-package)
  - [Positional fields](https://docs.sui.io/guides/developer/advanced/move-2024-migration#positional-fields)
  - [Nested `use` and standard library defaults](https://docs.sui.io/guides/developer/advanced/move-2024-migration#nested-use-and-standard-library-defaults)
  - [Automatic referencing in equality](https://docs.sui.io/guides/developer/advanced/move-2024-migration#automatic-referencing-in-equality)
  - [Loop labels](https://docs.sui.io/guides/developer/advanced/move-2024-migration#loop-labels)
  - [`break` with value](https://docs.sui.io/guides/developer/advanced/move-2024-migration#break-with-value)
- [Breaking changes](https://docs.sui.io/guides/developer/advanced/move-2024-migration#breaking-changes)
  - [Datatype visibility requirements](https://docs.sui.io/guides/developer/advanced/move-2024-migration#datatype-visibility-requirements)
  - [Mutability requirements](https://docs.sui.io/guides/developer/advanced/move-2024-migration#mutability-requirements)
  - [Removing friends and `public(friend)`](https://docs.sui.io/guides/developer/advanced/move-2024-migration#removing-friends-and-publicfriend)
  - [New keywords](https://docs.sui.io/guides/developer/advanced/move-2024-migration#new-keywords)
  - [Revised paths and namespaces](https://docs.sui.io/guides/developer/advanced/move-2024-migration#revised-paths-and-namespaces)
- [Follow along](https://docs.sui.io/guides/developer/advanced/move-2024-migration#follow-along)
  - [`alpha` and `beta` guidance](https://docs.sui.io/guides/developer/advanced/move-2024-migration#alpha-and-beta-guidance)