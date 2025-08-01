[Skip to main content](https://docs.sui.io/guides/developer/first-app/build-test#__docusaurus_skipToContent_fallback)

On this page

If you followed [Write a Move Package](https://docs.sui.io/guides/developer/first-app/write-package), you have a basic module that you need to build. If you didn't, then either start with that topic or use your package, substituting that information where appropriate.

## Building your package [​](https://docs.sui.io/guides/developer/first-app/build-test\#building-your-package "Direct link to Building your package")

Make sure your terminal or console is in the directory that contains your package ( `my_first_package` if you're following along). Use the following command to build your package:

```codeBlockLines_p187
$ sui move build

```

A successful build returns a response similar to the following:

```codeBlockLines_p187
UPDATING GIT DEPENDENCY https://github.com/MystenLabs/sui.git
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING my_first_package

```

If the build fails, you can use the verbose error messaging in output to troubleshoot and resolve root issues.

Now that you have designed your asset and its accessor functions, it's time to test the package code before publishing.

## Testing a package [​](https://docs.sui.io/guides/developer/first-app/build-test\#testing-a-package "Direct link to Testing a package")

Sui includes support for the Move testing framework. Using the framework, you can write unit tests that analyze Move code much like test frameworks for other languages, such as the built-in Rust testing framework or the JUnit framework for Java.

An individual Move unit test is encapsulated in a public function that has no parameters, no return values, and has the `#[test]` annotation. The testing framework executes such functions when you call the `sui move test` command from the package root ( `my_move_package` directory as per the current running example):

```codeBlockLines_p187
$ sui move test

```

If you execute this command for the package created in [Write a Package](https://docs.sui.io/guides/developer/first-app/write-package), you see the following output. Unsurprisingly, the test result has an `OK` status because there are no tests written yet to fail.

```codeBlockLines_p187
BUILDING Sui
BUILDING MoveStdlib
BUILDING my_first_package
Running Move unit tests
Test result: OK. Total tests: 0; passed: 0; failed: 0

```

To actually test your code, you need to add test functions. Start with adding a basic test function to the `example.move` file, inside the module definition:

[examples/move/first\_package/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move)

```codeBlockLines_p187
#[test]
fun test_sword_create() {
    // Create a dummy TxContext for testing
    let mut ctx = tx_context::dummy();

    // Create a sword
    let sword = Sword {
        id: object::new(&mut ctx),
        magic: 42,
        strength: 7,
    };

    // Check if accessor functions return correct values
    assert!(sword.magic() == 42 && sword.strength() == 7, 1);

}

```

As the code shows, the unit test function ( `test_sword_create()`) creates a dummy instance of the `TxContext` struct and assigns it to `ctx`. The function then creates a sword object using `ctx` to create a unique identifier and assigns `42` to the `magic` parameter and `7` to `strength`. Finally, the test calls the `magic` and `strength` accessor functions to verify that they return correct values.

The function passes the dummy context, `ctx`, to the `object::new` function as a mutable reference argument ( `&mut`), but passes `sword` to its accessor functions as a read-only reference argument, `&sword`.

Now that you have a test function, run the test command again:

```codeBlockLines_p187
$ sui move test

```

After running the `test` command, however, you get a compilation error instead of a test result:

```codeBlockLines_p187
error[E06001]: unused value without 'drop'
   ┌─ ./sources/example.move:59:65
   │
 9 │       public struct Sword has key, store {
   │                     ----- To satisfy the constraint, the 'drop' ability would need to be added here
   ·
52 │           let sword = Sword {
   │               ----- The local variable 'sword' still contains a value. The value does not have the 'drop' ability and must be consumed before the function returns
   │ ╭─────────────────────'
53 │ │             id: object::new(&mut ctx),
54 │ │             magic: 42,
55 │ │             strength: 7,
56 │ │         };
   │ ╰─────────' The type 'my_first_package::example::Sword' does not have the ability 'drop'
   · │
59 │           assert!(sword.magic() == 42 && sword.strength() == 7, 1);
   │                                                                   ^ Invalid return

```

The error message contains all the necessary information to debug the code. The faulty code is meant to highlight one of the Move language's safety features.

The `Sword` struct represents a game asset that digitally mimics a real-world item. Obviously, a real sword cannot simply disappear (though it can be explicitly destroyed), but there is no such restriction on a digital one. In fact, this is exactly what's happening in the `test` function - you create an instance of a `Sword` struct that simply disappears at the end of the function call. If you saw something disappear before your eyes, you'd be dumbfounded, too.

One of the solutions (as suggested in the error message), is to add the `drop` ability to the definition of the `Sword` struct, which would allow instances of this struct to disappear (be dropped). The ability to drop a valuable asset is not a desirable asset property in this case, so another solution is needed. Another way to solve this problem is to transfer ownership of the `sword`.

To get the test to work, we will need to use the `transfer` module, which is imported by default. Add the following lines to the end of the test function (after the `assert!` call) to transfer ownership of the `sword` to a freshly created dummy address:

[examples/move/first\_package/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move)

```codeBlockLines_p187
let dummy_address = @0xCAFE;
transfer::public_transfer(sword, dummy_address);

```

Run the test command again. Now the output shows a single successful test has run:

```codeBlockLines_p187
BUILDING MoveStdlib
BUILDING Sui
BUILDING my_first_package
Running Move unit tests
[ PASS    ] 0x0::example::test_sword_create
Test result: OK. Total tests: 1; passed: 1; failed: 0

```

tip

Use a filter string to run only a matching subset of the unit tests. With a filter string provided, the `sui move test` checks the fully qualified ( `<address>::<module_name>::<fn_name>`) name for a match.

Example:

```codeBlockLines_p187
$ sui move test sword

```

The previous command runs all tests whose name contains `sword`.

You can discover more testing options through:

```codeBlockLines_p187
$ sui move test -h

```

## Sui-specific testing [​](https://docs.sui.io/guides/developer/first-app/build-test\#sui-specific-testing "Direct link to Sui-specific testing")

The previous testing example uses Move but isn't specific to Sui beyond using some Sui packages, such as `sui::tx_context` and `sui::transfer`. While this style of testing is already useful for writing Move code for Sui, you might also want to test additional Sui-specific features. In particular, a Move call in Sui is encapsulated in a Sui transaction, and you might want to test interactions between different transactions within a single test (for example, one transaction creating an object and the other one transferring it).

Sui-specific testing is supported through the `test_scenario` module that provides Sui-related testing functionality otherwise unavailable in pure Move and its testing framework.

The `test_scenario` module provides a scenario that emulates a series of Sui transactions, each with a potentially different user executing them. A test using this module typically starts the first transaction using the `test_scenario::begin` function. This function takes an address of the user executing the transaction as its argument and returns an instance of the `Scenario` struct representing a scenario.

An instance of the `Scenario` struct contains a per-address object pool emulating Sui object storage, with helper functions provided to manipulate objects in the pool. After the first transaction finishes, subsequent test transactions start with the `test_scenario::next_tx` function. This function takes an instance of the `Scenario` struct representing the current scenario and an address of a user as arguments.

Update your `example.move` file to include a function callable from Sui that implements `sword` creation. With this in place, you can then add a multi-transaction test that uses the `test_scenario` module to test these new capabilities. Put this functions after the accessors (Part 5 in comments).

[examples/move/first\_package/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move)

```codeBlockLines_p187
public fun sword_create(magic: u64, strength: u64, ctx: &mut TxContext): Sword {
    Sword {
        id: object::new(ctx),
        magic: magic,
        strength: strength,
    }
}

```

The code of the new functions uses struct creation and Sui-internal modules ( `tx_context`) in a way similar to what you have seen in the previous sections. The important part is for the function to have correct signatures.

With the new function included, add another test function to make sure it behaves as expected.

[examples/move/first\_package/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move)

```codeBlockLines_p187
#[test]
fun test_sword_transactions() {
    use sui::test_scenario;

    // Create test addresses representing users
    let initial_owner = @0xCAFE;
    let final_owner = @0xFACE;

    // First transaction executed by initial owner to create the sword
    let mut scenario = test_scenario::begin(initial_owner);
    {
        // Create the sword and transfer it to the initial owner
        let sword = sword_create(42, 7, scenario.ctx());
        transfer::public_transfer(sword, initial_owner);
    };

    // Second transaction executed by the initial sword owner
    scenario.next_tx(initial_owner);
    {
        // Extract the sword owned by the initial owner
        let sword = scenario.take_from_sender<Sword>();
        // Transfer the sword to the final owner
        transfer::public_transfer(sword, final_owner);
    };

    // Third transaction executed by the final sword owner
    scenario.next_tx(final_owner);
    {
        // Extract the sword owned by the final owner
        let sword = scenario.take_from_sender<Sword>();
        // Verify that the sword has expected properties
        assert!(sword.magic() == 42 && sword.strength() == 7, 1);
        // Return the sword to the object pool (it cannot be simply "dropped")
        scenario.return_to_sender(sword)
    };
    scenario.end();
}

```

There are some details of the new testing function to pay attention to. The first thing the code does is create some addresses that represent users participating in the testing scenario. The test then creates a scenario by starting the first transaction on behalf of the initial sword owner.

The initial owner then executes the second transaction (passed as an argument to the `test_scenario::next_tx` function), who then transfers the `sword` they now own to the final owner. In pure Move there is no notion of Sui storage; consequently, there is no easy way for the emulated Sui transaction to retrieve it from storage. This is where the `test_scenario` module helps - its `take_from_sender` function allows an address-owned object of a given type ( `Sword`) executing the current transaction to be available for Move code manipulation. For now, assume that there is only one such object. In this case, the test transfers the object it retrieves from storage to another address.

tip

Transaction effects, such as object creation and transfer become visible only after a given transaction completes. For example, if the second transaction in the running example created a `sword` and transferred it to the administrator's address, it would only become available for retrieval from the administrator's address (via `test_scenario`, `take_from_sender`, or `take_from_address` functions) in the third transaction.

The final owner executes the third and final transaction that retrieves the `sword` object from storage and checks if it has the expected properties. Remember, as described in [Testing a package](https://docs.sui.io/guides/developer/first-app/build-test#testing-a-package), in the pure Move testing scenario, after an object is available in Move code (after creation or retrieval from emulated storage), it cannot simply disappear.

In the pure Move testing function, the function transfers the `sword` object to the fake address to handle the disappearing problem. The `test_scenario` package provides a more elegant solution, however, which is closer to what happens when Move code actually executes in the context of Sui - the package simply returns the `sword` to the object pool using the `test_scenario::return_to_sender` function. For scenarios where returning to the sender is not desirable or if you would like to simply destroy the object, the `test_utils` module also provides the generic `destroy<T>` function, that can be used on any type `T` regardless of its ability. It is advisable to check out other useful functions in the [`test_scenario`](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/packages/sui-framework/sources/test/test_scenario.move) and [`test_utils`](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/packages/sui-framework/sources/test/test_utils.move) modules as well.

Run the test command again to see two successful tests for our module:

```codeBlockLines_p187
BUILDING Sui
BUILDING MoveStdlib
BUILDING my_first_package
Running Move unit tests
[ PASS    ] 0x0::example::test_sword_create
[ PASS    ] 0x0::example::test_sword_transactions
Test result: OK. Total tests: 2; passed: 2; failed: 0

```

### Module initializers [​](https://docs.sui.io/guides/developer/first-app/build-test\#module-initializers "Direct link to Module initializers")

Each module in a package can include a special initializer function that runs at publication time. The goal of an initializer function is to pre-initialize module-specific data (for example, to create singleton objects). The initializer function must have the following properties for it to execute at publication:

- Function name must be `init`.
- The parameter list must end with either a `&mut TxContext` or a `&TxContext` type.
- No return values.
- Private visibility.
- Optionally, the parameter list starts by accepting the module's one-time witness by value. See [One Time Witness](https://move-book.com/programmability/one-time-witness.html) in The Move Book for more information.

For example, the following `init` functions are all valid:

- `fun init(ctx: &TxContext)`
- `fun init(ctx: &mut TxContext)`
- `fun init(otw: EXAMPLE, ctx: &TxContext)`
- `fun init(otw: EXAMPLE, ctx: &mut TxContext)`

While the `sui move` command does not support publishing explicitly, you can still test module initializers using the testing framework by dedicating the first transaction to executing the initializer function.

The `init` function for the module in the running example creates a `Forge` object.

[examples/move/first\_package/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move)

```codeBlockLines_p187
fun init(ctx: &mut TxContext) {
    let admin = Forge {
        id: object::new(ctx),
        swords_created: 0,
    };

    transfer::transfer(admin, ctx.sender());
}

```

The tests you have so far call the `init` function, but the initializer function itself isn't tested to ensure it properly creates a `Forge` object. To test this functionality, add a `new_sword` function to take the forge as a parameter and to update the number of created swords at the end of the function. If this were an actual module, you'd replace the `sword_create` function with `new_sword`. To keep the existing tests from failing, however, we will keep both functions.

[examples/move/first\_package/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move)

```codeBlockLines_p187
public fun new_sword(forge: &mut Forge, magic: u64, strength: u64, ctx: &mut TxContext): Sword {
    forge.swords_created = forge.swords_created + 1;
    Sword {
        id: object::new(ctx),
        magic: magic,
        strength: strength,
    }
}

```

Now, create a function to test the module initialization:

[examples/move/first\_package/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move)

```codeBlockLines_p187
#[test]
fun test_module_init() {
    use sui::test_scenario;

    // Create test addresses representing users
    let admin = @0xAD;
    let initial_owner = @0xCAFE;

    // First transaction to emulate module initialization
    let mut scenario = test_scenario::begin(admin);
    {
        init(scenario.ctx());
    };

    // Second transaction to check if the forge has been created
    // and has initial value of zero swords created
    scenario.next_tx(admin);
    {
        // Extract the Forge object
        let forge = scenario.take_from_sender<Forge>();
        // Verify number of created swords
        assert!(forge.swords_created() == 0, 1);
        // Return the Forge object to the object pool
        scenario.return_to_sender(forge);
    };

    // Third transaction executed by admin to create the sword
    scenario.next_tx(admin);
    {
        let mut forge = scenario.take_from_sender<Forge>();
        // Create the sword and transfer it to the initial owner
        let sword = forge.new_sword(42, 7, scenario.ctx());
        transfer::public_transfer(sword, initial_owner);
        scenario.return_to_sender(forge);
    };
    scenario.end();
}

```

As the new test function shows, the first transaction (explicitly) calls the initializer. The next transaction checks if the `Forge` object has been created and properly initialized. Finally, the admin uses the `Forge` to create a sword and transfer it to the initial owner.

You can refer to the source code for the package (with all the tests and functions properly adjusted) in the [first\_package](https://github.com/MystenLabs/sui/tree/main/examples/move/first_package/sources/example.move) module in the `sui/examples` directory. You can also use the following toggle to review the complete code.

Click to open

`example.move`

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
public fun sword_create(magic: u64, strength: u64, ctx: &mut TxContext): Sword {
		// Create a sword
		Sword {
				id: object::new(ctx),
				magic: magic,
				strength: strength,
		}
}

/// Constructor for creating swords
public fun new_sword(forge: &mut Forge, magic: u64, strength: u64, ctx: &mut TxContext): Sword {
		forge.swords_created = forge.swords_created + 1;
		Sword {
				id: object::new(ctx),
				magic: magic,
				strength: strength,
		}
}
// Part 6: Tests
#[test]
fun test_sword_create() {
		// Create a dummy TxContext for testing
		let mut ctx = tx_context::dummy();

		// Create a sword
		let sword = Sword {
				id: object::new(&mut ctx),
				magic: 42,
				strength: 7,
		};

		// Check if accessor functions return correct values
		assert!(sword.magic() == 42 && sword.strength() == 7, 1);
		// Create a dummy address and transfer the sword
		let dummy_address = @0xCAFE;
		transfer::public_transfer(sword, dummy_address);
}

#[test]
fun test_sword_transactions() {
		use sui::test_scenario;

		// Create test addresses representing users
		let initial_owner = @0xCAFE;
		let final_owner = @0xFACE;

		// First transaction executed by initial owner to create the sword
		let mut scenario = test_scenario::begin(initial_owner);
		{
				// Create the sword and transfer it to the initial owner
				let sword = sword_create(42, 7, scenario.ctx());
				transfer::public_transfer(sword, initial_owner);
		};

		// Second transaction executed by the initial sword owner
		scenario.next_tx(initial_owner);
		{
				// Extract the sword owned by the initial owner
				let sword = scenario.take_from_sender<Sword>();
				// Transfer the sword to the final owner
				transfer::public_transfer(sword, final_owner);
		};

		// Third transaction executed by the final sword owner
		scenario.next_tx(final_owner);
		{
				// Extract the sword owned by the final owner
				let sword = scenario.take_from_sender<Sword>();
				// Verify that the sword has expected properties
				assert!(sword.magic() == 42 && sword.strength() == 7, 1);
				// Return the sword to the object pool (it cannot be simply "dropped")
				scenario.return_to_sender(sword)
		};
		scenario.end();
}

#[test]
fun test_module_init() {
		use sui::test_scenario;

		// Create test addresses representing users
		let admin = @0xAD;
		let initial_owner = @0xCAFE;

		// First transaction to emulate module initialization
		let mut scenario = test_scenario::begin(admin);
		{
				init(scenario.ctx());
		};

		// Second transaction to check if the forge has been created
		// and has initial value of zero swords created
		scenario.next_tx(admin);
		{
				// Extract the Forge object
				let forge = scenario.take_from_sender<Forge>();
				// Verify number of created swords
				assert!(forge.swords_created() == 0, 1);
				// Return the Forge object to the object pool
				scenario.return_to_sender(forge);
		};

		// Third transaction executed by admin to create the sword
		scenario.next_tx(admin);
		{
				let mut forge = scenario.take_from_sender<Forge>();
				// Create the sword and transfer it to the initial owner
				let sword = forge.new_sword(42, 7, scenario.ctx());
				transfer::public_transfer(sword, initial_owner);
				scenario.return_to_sender(forge);
		};
		scenario.end();
}

```

## Related links [​](https://docs.sui.io/guides/developer/first-app/build-test\#related-links "Direct link to Related links")

- [Publish a Package](https://docs.sui.io/guides/developer/first-app/publish): Continue the example by publishing your package to the Sui network.
- [Package Upgrades](https://docs.sui.io/concepts/sui-move-concepts/packages): Upgrading packages published on the Sui network.

- [Building your package](https://docs.sui.io/guides/developer/first-app/build-test#building-your-package)
- [Testing a package](https://docs.sui.io/guides/developer/first-app/build-test#testing-a-package)
- [Sui-specific testing](https://docs.sui.io/guides/developer/first-app/build-test#sui-specific-testing)
  - [Module initializers](https://docs.sui.io/guides/developer/first-app/build-test#module-initializers)
- [Related links](https://docs.sui.io/guides/developer/first-app/build-test#related-links)