# https://docs.sui.io/guides/developer/first-app/write-package

[Skip to main content](https://docs.sui.io/guides/developer/first-app/write-package#__docusaurus_skipToContent_fallback)

On this page

To begin, open a terminal or console at the location you plan to store your package. Use the `sui move new` command to create an empty Move package with the name `my_first_package`:

```codeBlockLines_p187
$ sui move new my_first_package

```

Running the previous command creates a directory with the name you provide ( `my_first_package` in this case). The command populates the new directory with a skeleton Move project that consists of a `sources` directory and a `Move.toml` manifest file. Open the manifest with a text editor to review its contents:

[examples/move/first\_package/Move.toml](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/Move.toml)

```codeBlockLines_p187
[package]
name = "my_first_package"
edition = "2024.beta" # edition = "legacy" to use legacy (pre-2024) Move
# license = ""					 # e.g., "MIT", "GPL", "Apache 2.0"
# authors = ["..."]			# e.g., ["Joe Smith (joesmith@noemail.com)", "John Snow (johnsnow@noemail.com)"]

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

# For remote import, use the `{ git = "...", subdir = "...", rev = "..." }`.
# Revision can be a branch, a tag, and a commit hash.
# MyRemotePackage = { git = "https://some.remote/host.git", subdir = "remote/path", rev = "main" }

# For local dependencies use `local = path`. Path is relative to the package root
# Local = { local = "../path/to" }

# To resolve a version conflict and force a specific version for dependency
# override use `override = true`
# Override = { local = "../conflicting/version", override = true }

[addresses]
my_first_package = "0x0"

# Named addresses will be accessible in Move as `@name`. They're also exported:
# for example, `std = "0x1"` is exported by the Standard Library.
# alice = "0xA11CE"

[dev-dependencies]
# The dev-dependencies section allows overriding dependencies for `--test` and
# `--dev` modes. You can introduce test-only dependencies here.
# Local = { local = "../path/to/dev-build" }

[dev-addresses]
# The dev-addresses section allows overwriting named addresses for the `--test`
# and `--dev` modes.
# alice = "0xB0B"

```

The manifest file contents include available sections of the manifest and comments that provide additional information. In Move, you prepend the hash mark ( `#`) to a line to denote a comment.

- **\[package\]:** Contains metadata for the package. By default, the `sui move new` command populates only the `name` value of the metadata. In this case, the example passes `my_first_package` to the command, which becomes the name of the package. You can delete the first `#` of subsequent lines of the `[package]` section to provide values for the other available metadata fields.
- **\[dependencies\]:** Lists the other packages that your package depends on to run. By default, the `sui move new` command lists the `Sui` package on GitHub (Testnet version) as the lone dependency.
- **\[addresses\]:** Declares named addresses that your package uses. By default, the section includes the package you create with the `sui move new` command and an address of `0x0`. This value can be left as-is and indicates that [package addresses are automatically managed](https://docs.sui.io/concepts/sui-move-concepts/packages/automated-address-management) when published and upgraded.
- **\[dev-dependencies\]:** Includes only comments that describe the section.
- **\[dev-addresses\]:** Includes only comments that describe the section.

### Defining the package [​](https://docs.sui.io/guides/developer/first-app/write-package\#defining-the-package "Direct link to Defining the package")

You have a package now but it doesn't do anything. To make your package useful, you must add logic contained in `.move` source files that define _modules_. The `sui move new` command creates a .move file in the `sources` directory that defaults to the same name as your project ( `my_first_package.move` in this case). For the purpose of this guide, rename the file to `example.move` and open it with a text editor.

Populate the `example.move` file with the following code:

[examples/move/first\_package/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move)

```codeBlockLines_p187
module my_first_package::example;

// Part 1: These imports are provided by default
// use sui::object::{Self, UID};
// use sui::transfer;
// use sui::tx_context::{Self, TxContext};

// Part 2: struct definitions
public struct Sword has key, store {
    id: UID,
    magic: u64,
    strength: u64,
}

public struct Forge has key {
    id: UID,
    swords_created: u64,
}

// Part 3: Module initializer to be executed when this module is published
fun init(ctx: &mut TxContext) {
    let admin = Forge {
        id: object::new(ctx),
        swords_created: 0,
    };

    // Transfer the forge object to the module/package publisher
    transfer::transfer(admin, ctx.sender());
}

// Part 4: Accessors required to read the struct fields
public fun magic(self: &Sword): u64 {
    self.magic
}

public fun strength(self: &Sword): u64 {
    self.strength
}

public fun swords_created(self: &Forge): u64 {
    self.swords_created
}

// Part 5: Public/entry functions (introduced later in the tutorial)

// Part 6: Tests

```

The comments in the preceding code highlight different parts of a typical Move source file.

- **Part 1: Imports** \- Code reuse is a necessity in modern programming. Move supports this concept with `use` aliases that allow your module to refer to types and functions declared in other modules. In this example, the module imports from `object`, `transfer`, and `tx_context` modules, but it does not need to do so explicitly, because the compiler provides these `use` statements by default. These modules are available to the package because the `Move.toml` file defines the Sui dependency (along with the `sui` named address) where they are defined.

- **Part 2: Struct declarations** \- Structs define types that a module can create or destroy. Struct definitions can include abilities provided with the `has` keyword. The structs in this example, for instance, have the `key` ability, which indicates that these structs are Sui objects that you can transfer between addresses. The `store` ability on the structs provides the ability to appear in other struct fields and be transferred freely.

- **Part 3: Module initializer** \- A special function that is invoked exactly once when the module publishes.

- **Part 4: Accessor functions** \- These functions allow the fields of the module's structs to be read from other modules.


After you save the file, you have a complete Move package.

## Related links [​](https://docs.sui.io/guides/developer/first-app/write-package\#related-links "Direct link to Related links")

- [Build and Test Packages](https://docs.sui.io/guides/developer/first-app/build-test): Continue this example to build and test your package to get it ready for publishing.
- [Sui Move CLI](https://docs.sui.io/references/cli/move): Available Move commands the CLI provides.
- [Sui Move Book](https://move-book.com/): A comprehensive guide to the Move programming language and the Sui blockchain.

- [Defining the package](https://docs.sui.io/guides/developer/first-app/write-package#defining-the-package)
- [Related links](https://docs.sui.io/guides/developer/first-app/write-package#related-links)