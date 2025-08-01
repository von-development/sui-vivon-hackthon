# https://docs.sui.io/concepts/object-ownership/immutable

[Skip to main content](https://docs.sui.io/concepts/object-ownership/immutable#__docusaurus_skipToContent_fallback)

On this page

Objects in Sui can have different types of ownership, with two broad categories: immutable objects and mutable objects. An immutable object is an object that can't be mutated, transferred, or deleted. Immutable objects have no owner, so anyone can use them.

## Create immutable object [​](https://docs.sui.io/concepts/object-ownership/immutable\#create-immutable-object "Direct link to Create immutable object")

To convert an object into an immutable object, call the `public_freeze_object` function from the [transfer module](https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/packages/sui-framework/sources/transfer.move):

```codeBlockLines_p187
public native fun public_freeze_object<T: key>(obj: T);

```

This call makes the specified object immutable. This is a non-reversible operation. You should freeze an object only when you are certain that you don't need to mutate it.

You can see this function's use in one of the [color\_object example module](https://github.com/MystenLabs/sui/blob/main/examples/move/color_object/sources/example.move) tests. The test creates a new (owned) `ColorObject`, then calls `public_freeze_object` to turn it into an immutable object.

```codeBlockLines_p187
{
    ts.next_tx(alice);
    // Create a new ColorObject
    let c = new(255, 0, 255, ts.ctx());
    // Make it immutable.
    transfer::public_freeze_object(c);
};

```

In the preceding test, you must already own a `ColorObject` to pass it in. At the end of this call, this object is frozen and can never be mutated. It is also no longer owned by anyone.

The `transfer::public_freeze_object` function requires that you pass the object by value. If you are allowed to pass the object by a mutable reference, you could still mutate the object after the `public_freeze_object` call. This contradicts the fact that it should have become immutable.

Alternatively, you can also provide an API that creates an immutable object at creation:

```codeBlockLines_p187
public fun create_immutable(red: u8, green: u8, blue: u8, ctx: &mut TxContext) {
    let color_object = new(red, green, blue, ctx);
    transfer::public_freeze_object(color_object)
}

```

This function creates a new `ColorObject` and immediately makes it immutable before it has an owner.

## Use immutable object [​](https://docs.sui.io/concepts/object-ownership/immutable\#use-immutable-object "Direct link to Use immutable object")

After an object becomes immutable, the rules of who can use this object in Sui Move calls change:
You can only pass an immutable object as a read-only, immutable reference to Sui Move entry functions as `&T`.

Anyone can use immutable objects.

Consider a function that copies the value of one object to another:

```codeBlockLines_p187
public fun copy_into(from: &ColorObject, into: &mut ColorObject);

```

In this function, anyone can pass an immutable object as the first argument, `from`, but not the second argument.
Because you can never mutate immutable objects, there's no data race, even when multiple transactions are using the same immutable object at the same time. Hence, the existence of immutable objects does not pose any requirement on consensus.

## Test immutable object [​](https://docs.sui.io/concepts/object-ownership/immutable\#test-immutable-object "Direct link to Test immutable object")

You can interact with immutable objects in unit tests using `test_scenario::take_immutable<T>` to take an immutable object wrapper from global storage, and `test_scenario::return_immutable` to return the wrapper back to the global storage.

The `test_scenario::take_immutable<T>` function is required because you can access immutable objects solely through read-only references. The `test_scenario` runtime keeps track of the usage of this immutable object. If the compiler does not return the object via `test_scenario::return_immutable` before the start of the next transaction, the test stops.

To see it work in action:

```codeBlockLines_p187
let sender1 = @0x1;
let scenario_val = test_scenario::begin(sender1);
let scenario = &mut scenario_val;
{
    let ctx = test_scenario::ctx(scenario);
    color_object::create_immutable(255, 0, 255, ctx);
};
scenario.next_tx(sender1);
{
    // has_most_recent_for_sender returns false for immutable objects.
    assert!(!test_scenario::has_most_recent_for_sender<ColorObject>(scenario))
};

```

This test submits a transaction as `sender1`, which tries to create an immutable object.

The `has_most_recent_for_sender<ColorObject>` function no longer returns `true`, because the object is no longer owned. To take this object:

```codeBlockLines_p187
// Any sender can work.
let sender2 = @0x2;
scenario.next_tx(sender2);
{
    let object = test_scenario::take_immutable<ColorObject>(scenario);
    let (red, green, blue) = color_object::get_color(object);
    assert!(red == 255 && green == 0 && blue == 255)
    test_scenario::return_immutable(object);
};

```

To show that this object is indeed not owned by anyone, start the next transaction with `sender2`. Note that it used `take_immutable` and succeeded. This means that any sender can take an immutable object. To return the object, call the `return_immutable` function.

To examine whether this object is immutable, add a function that tries to mutate a `ColorObject`:

```codeBlockLines_p187
public fun update(
    object: &mut ColorObject,
    red: u8, green: u8, blue: u8,
) {
    object.red = red;
    object.green = green;
    object.blue = blue;
}

```

As you have learned, the function fails when the `ColorObject` is immutable.

## On-chain interactions [​](https://docs.sui.io/concepts/object-ownership/immutable\#on-chain-interactions "Direct link to On-chain interactions")

First, view the objects you own:

```codeBlockLines_p187
$ export ADDR=`sui client active-address`

```

```codeBlockLines_p187
$ sui client objects $ADDR

```

Publish the `ColorObject` code on-chain using the Sui Client CLI:

tip

Beginning with the Sui `v1.24.1` [release](https://github.com/MystenLabs/sui/releases/tag/mainnet-v1.24.1), the `--gas-budget` option is no longer required for CLI commands.

```codeBlockLines_p187
$ sui client publish $ROOT/examples/move/color_object --gas-budget <GAS-AMOUNT>

```

Set the package object ID to the `$PACKAGE` environment variable, if you have it set. Then create a new `ColorObject`:

```codeBlockLines_p187
$ sui client call --gas-budget <GAS-AMOUNT> --package $PACKAGE --module "color_object" --function "create" --args 0 255 0

```

Set the newly created object ID to `$OBJECT`. To view the objects in the current active address:

```codeBlockLines_p187
$ sui client objects $ADDR

```

You should see an object with the ID you used for `$OBJECT`. To turn it into an immutable object:

```codeBlockLines_p187
$ sui client call --gas-budget <GAS-AMOUNT> --package $PACKAGE --module "color_object" --function "freeze_object" --args \"$OBJECT\"

```

View the list of objects again:

```codeBlockLines_p187
$ sui client objects $ADDR

```

`$OBJECT` is no longer listed. It's no longer owned by anyone. You can see that it's now immutable by querying the object information:

```codeBlockLines_p187
$ sui client object $OBJECT

```

The response includes:

```codeBlockLines_p187
Owner: Immutable

```

If you try to mutate it:

```codeBlockLines_p187
$ sui client call --gas-budget <GAS-AMOUNT> --package $PACKAGE --module "color_object" --function "update" --args \"$OBJECT\" 0 0 0

```

The response indicates that you can't pass an immutable object to a mutable argument.

- [Create immutable object](https://docs.sui.io/concepts/object-ownership/immutable#create-immutable-object)
- [Use immutable object](https://docs.sui.io/concepts/object-ownership/immutable#use-immutable-object)
- [Test immutable object](https://docs.sui.io/concepts/object-ownership/immutable#test-immutable-object)
- [On-chain interactions](https://docs.sui.io/concepts/object-ownership/immutable#on-chain-interactions)