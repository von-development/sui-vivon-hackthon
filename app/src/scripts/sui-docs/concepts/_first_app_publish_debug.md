[Skip to main content](https://docs.sui.io/guides/developer/first-app/debug#__docusaurus_skipToContent_fallback)

On this page

Move does not currently have a native debugger. You can use the `std::debug` module, however, to print arbitrary values to the console. Monitoring variable values in this manner can provide insight into the logic of your modules. To do so, first declare an alias to the debug module in your source file for more concise access:

```codeBlockLines_p187
use std::debug;

```

Then in places where you want to print out a value `v`, regardless of its type, add the following code:

```codeBlockLines_p187
debug::print(&v);

```

or the following if `v` is already a reference:

```codeBlockLines_p187
debug::print(v);

```

The debug module also provides a function to print out the current stacktrace:

```codeBlockLines_p187
debug::print_stack_trace();

```

Alternatively, any call to abort or assertion failure also prints the stacktrace at the point of failure.

## Using debug in my\_module [​](https://docs.sui.io/guides/developer/first-app/debug\#using-debug-in-my_module "Direct link to Using debug in my_module")

To see the module in action, update your `my_module` code to include debug calls. Specifically, update the `new_sword` function so that you print the value of `forge` before and after updating `swords_created`. Also, include a `print_stack_trace` so that the function looks like the following:

```codeBlockLines_p187
public fun new_sword(
    forge: &mut Forge,
    magic: u64,
    strength: u64,
    ctx: &mut TxContext,
): Sword {
    debug::print(forge);
    forge.swords_created = forge.swords_created + 1;
    debug::print(forge);
    debug::print_stack_trace();
    Sword {
        id: object::new(ctx),
        magic: magic,
        strength: strength,
    }
}

```

To see the results, run the module's tests.

```codeBlockLines_p187
$ sui move test

```

The response prints out the expected results as the test calls the `new_sword` function.

```codeBlockLines_p187
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING my_first_package
Running Move unit tests
[ PASS    ] 0x0::my_module::test_module_init
[debug] 0x0::my_module::Forge {
  id: 0x2::object::UID {
    id: 0x2::object::ID {
      bytes: @0x34401905bebdf8c04f3cd5f04f442a39372c8dc321c29edfb4f9cb30b23ab96
    }
  },
  swords_created: 0
}
[debug] 0x0::my_module::Forge {
  id: 0x2::object::UID {
    id: 0x2::object::ID {
      bytes: @0x34401905bebdf8c04f3cd5f04f442a39372c8dc321c29edfb4f9cb30b23ab96
    }
  },
  swords_created: 1
}
Call Stack:
    [0] 0000000000000000000000000000000000000000000000000000000000000000::my_module::test_module_init

        Code:
            [35] LdU64(7)
            [36] MutBorrowLoc(3)
            [37] Call(15)
          > [38] Call(5)
            [39] LdConst(0)
            [40] CallGeneric(2)
            [41] ImmBorrowLoc(3)

        Locals:
            [0] -
            [1] { { { <OBJECT-ID-WITHOUT-0x> } }, 1 }
            [2] -
            [3] { 2, { 00000000000000000000000000000000000000000000000000000000000000ad, [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0, 0, 0 } }

Operand Stack:

[ PASS    ] 0x0::my_module::test_sword_transactions
Test result: OK. Total tests: 2; passed: 2; failed: 0

```

The output shows the value of the `swords_created` field of the `Forge` change after the increment. The stack trace shows the bytecode instructions that have been executed so far, and the next few instructions to execute.

info

The specific bytecode offsets and the indices of the local variables might vary depending on the version of the Sui toolchain.

## Related links [​](https://docs.sui.io/guides/developer/first-app/debug\#related-links "Direct link to Related links")

- [Publish a Package](https://docs.sui.io/guides/developer/first-app/publish): Publish the example to the Sui network.

- [Using debug in my\_module](https://docs.sui.io/guides/developer/first-app/debug#using-debug-in-my_module)
- [Related links](https://docs.sui.io/guides/developer/first-app/debug#related-links)