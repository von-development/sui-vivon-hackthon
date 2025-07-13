# https://docs.sui.io/guides/developer/app-examples/tic-tac-toe

[Skip to main content](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#__docusaurus_skipToContent_fallback)

On this page

🧠Expected effort

This guide is rated as basic.

You can expect basic guides to take30-45 minutes of dedicated time. The length of time necessary to fully understand some of the concepts raised in this guide might increase this estimate.

info

You can view the [complete source code for this app example](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe) in the Sui repository.

This guide covers three different implementations of the game tic-tac-toe on Sui. The first example utilizes a centralized admin that owns the board object and marks it on the users’ behalf. The second example utilizes a shared object that both users can mutate. And the third example utilizes a [multisig](https://docs.sui.io/guides/developer/cryptography/multisig), where instead of sharing the game board, it's in a 1-of-2 multisig of both users’ accounts.

The guide is divided into three parts that each cover a different implementation of the tic-tac-toe game board:

1. [Centralized game board](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#owned.move): An admin service that tracks player moves and updates the game board.
2. [Shared game board](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#shared.move): A shared object that allows players to directly update the game board.
3. [Multisig operated game board](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#multisig): A multisig account that acts as the game admin, allowing either player to update the game board directly.

## What the guide teaches [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#what-the-guide-teaches "Direct link to What the guide teaches")

- **Owned objects:** The guide teaches you how to use [owned objects](https://docs.sui.io/concepts/object-ownership/address-owned), in this case to act as the game board in the centralized and multisig version of tic-tac-toe. Owned objects are objects that are owned by a single account and can only be modified by that account. In this case, the game board is owned by a game admin, who is responsible for updating the board with each player's move.
- **Shared objects:** The guide teaches you how to use [shared objects](https://docs.sui.io/concepts/object-ownership/shared), in this case to act as the game board in the more decentralized version of tic-tac-toe. Shared objects are objects that can be modified by multiple accounts. In this case, the game board is shared between the two players, allowing them to update the board directly.
- **Multisig accounts:** The guide teaches you how to use [multisig accounts](https://sdk.mystenlabs.com/typescript/cryptography/multisig) to share ownership of the game board between two players. Multisig accounts are accounts that require a certain threshold of signatures to authorize a transaction. In this case, the game board is owned by a 1-of-2 multisig account.
- **Dynamic object fields:** The guide teaches you how to use dynamic object fields, in this case to transfer the actions of the players to the game board, which will be retrieved by the game admin. See [The Move Book](https://move-book.com/programmability/dynamic-object-fields.html) to learn more about dynamic object fields.

## What you need [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#what-you-need "Direct link to What you need")

Before getting started, make sure you have:

- [Installed the latest version of Sui](https://docs.sui.io/guides/developer/getting-started/sui-install).
- Read the basics of [shared versus owned objects](https://docs.sui.io/guides/developer/sui-101/shared-owned).

## Directory structure [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#directory-structure "Direct link to Directory structure")

To begin, create a new folder on your system titled `tic-tac-toe` that holds all your files.

In this folder, create the following subfolders:

- `move` to hold the Move code for the game board.
  - `sources` to hold the Move source files.

Click to open

Add `Move.toml` to `tic-tac-toe/move/`

[examples/tic-tac-toe/move/Move.toml](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/Move.toml)

```codeBlockLines_p187
[package]
name = "tic_tac_toe"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
tic_tac_toe = "0x0"

```

CHECKPOINT

- You have the latest version of Sui installed. If you run `sui --version` in your terminal or console, it responds with the currently installed version.
- You have a directory to place the files you create in.
- You have created a `Move.toml` file in the `tic-tac-toe/move/` directory.

## owned.move [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#owned.move "Direct link to owned.move")

Create a new file in `tic-tac-toe/move/sources` titled `owned.move`. Later, you will update this file to contain the Move code for the game board in the centralized (and multisig) version of tic-tac-toe.

In this first example of tic-tac-toe, the `Game` object, including the game board, is controlled by a game admin.

[examples/tic-tac-toe/move/sources/owned.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/owned.move)

```codeBlockLines_p187
public struct Game has key, store {
    id: UID,
    board: vector<u8>,
    turn: u8,
    x: address,
    o: address,
    admin: vector<u8>,
}

```

Ignore the `admin` field for now, as it is only relevant for the multisig approach.

Games are created with the `new` function:

[examples/tic-tac-toe/move/sources/owned.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/owned.move)

```codeBlockLines_p187
public fun new(x: address, o: address, admin: vector<u8>, ctx: &mut TxContext): Game {
    let game = Game {
        id: object::new(ctx),
        board: vector[MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__],
        turn: 0,
        x,
        o,
        admin,
    };

    let turn = TurnCap {
        id: object::new(ctx),
        game: object::id(&game),
    };

    transfer::transfer(turn, x);
    game
}

```

Some things to note:

- `MARK__` is a constant that represents an empty cell on the game board. `MARK_X` and `MARK_O` represent the two players' markers.
- The first player is sent a `TurnCap`, which gives them permission to take the next turn.
- This function creates and returns the `Game` object, it is up to its creator to send it to the game admin to own.

Because the players don’t own the game board object, they cannot directly mutate it. Instead, they indicate their move by creating a `Mark` object with their intended placement and send it to the game object using transfer to object:

[examples/tic-tac-toe/move/sources/owned.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/owned.move)

```codeBlockLines_p187
public struct Mark has key, store {
    id: UID,
    player: address,
    row: u8,
    col: u8,
}

```

When playing the game, the admin operates a service that keeps track of marks using events. When a request is received ( `send_mark`), the admin tries to place the marker on the board ( `place_mark`). Each move requires two steps (thus two transactions): one from the player and one from the admin. This setup relies on the admin's service to keep the game moving.

[examples/tic-tac-toe/move/sources/owned.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/owned.move)

```codeBlockLines_p187
public fun send_mark(cap: TurnCap, row: u8, col: u8, ctx: &mut TxContext) {
    assert!(row < 3 && col < 3, EInvalidLocation);

    let TurnCap { id, game } = cap;
    id.delete();

    let mark = Mark {
        id: object::new(ctx),
        player: ctx.sender(),
        row,
        col,
    };

    event::emit(MarkSent { game, mark: object::id(&mark) });
    transfer::transfer(mark, game.to_address());
}

public fun place_mark(game: &mut Game, mark: Receiving<Mark>, ctx: &mut TxContext) {
    assert!(game.ended() == TROPHY_NONE, EAlreadyFinished);

    let Mark { id, row, col, player } = transfer::receive(&mut game.id, mark);
    id.delete();

    let (me, them, sentinel) = game.next_player();
    assert!(me == player, EWrongPlayer);

    if (game[row, col] == MARK__) {
        *(&mut game[row, col]) = sentinel;
        game.turn = game.turn + 1;
    };

    let end = game.ended();
    if (end == TROPHY_WIN) {
        transfer::transfer(game.mint_trophy(end, them, ctx), me);
        event::emit(GameEnd { game: object::id(game) });
    } else if (end == TROPHY_DRAW) {
        transfer::transfer(game.mint_trophy(end, them, ctx), me);
        transfer::transfer(game.mint_trophy(end, me, ctx), them);
        event::emit(GameEnd { game: object::id(game) });
    } else if (end == TROPHY_NONE) {
        let cap = TurnCap { id: object::new(ctx), game: object::id(game) };
        let (to, _, _) = game.next_player();
        transfer::transfer(cap, to);
    } else {
        abort EInvalidEndState
    }
}

```

When a player sends a mark, a `Mark` object is created and is sent to the `Game` object. The admin then receives the mark and places it on the board. This is a use of dynamic object fields, where an object, `Game`, can hold other objects, `Mark`.

To view the entire source code, see the [owned.move source file](https://github.com/MystenLabs/sui/blob/main/examples/tic-tac-toe/move/sources/owned.move). You can find the rest of the logic, including how to check for a winner, as well as deleting the game board after the game concludes there.

Click to open

`owned.move`

[examples/tic-tac-toe/move/sources/owned.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/owned.move)

```codeBlockLines_p187
/// An implementation of Tic Tac Toe, using owned objects.
///
/// The `Game` object is owned by an admin, so players cannot mutate the game
/// board directly. Instead, they convey their intention to place a mark by
/// transferring a `Mark` object to the `Game`.
///
/// This means that every move takes two owned object fast path operations --
/// one by the player, and one by the admin. The admin could be a third party
/// running a centralized service that monitors marker placement events and
/// responds to them, or it could be a 1-of-2 multisig address shared between
/// the two players, as demonstrated in the demo app.
///
/// The `shared` module shows a variant of this game implemented using shared
/// objects, which provides different trade-offs: Using shared objects is more
/// expensive, however the implementation is more straightforward and each move
/// only requires one transaction.
module tic_tac_toe::owned;

use sui::event;
use sui::transfer::Receiving;

// === Object Types ===

/// The state of an active game of tic-tac-toe.
public struct Game has key, store {
		id: UID,
		/// Marks on the board.
		board: vector<u8>,
		/// The next turn to be played.
		turn: u8,
		/// The address expected to send moves on behalf of X.
		x: address,
		/// The address expected to send moves on behalf of O.
		o: address,
		/// Public key of the admin address.
		admin: vector<u8>,
}

/// The player that the next turn is expected from is given a `TurnCap`.
public struct TurnCap has key {
		id: UID,
		game: ID,
}

/// A request to make a play -- only the player with the `TurnCap` can
/// create and send `Mark`s.
public struct Mark has key, store {
		id: UID,
		player: address,
		row: u8,
		col: u8,
}

/// An NFT representing a finished game. Sent to the winning player if there
/// is one, or to both players in the case of a draw.
public struct Trophy has key {
		id: UID,
		/// Whether the game was won or drawn.
		status: u8,
		/// The state of the board at the end of the game.
		board: vector<u8>,
		/// The number of turns played
		turn: u8,
		/// The other player (relative to the player who owns this Trophy).
		other: address,
}

// === Event Types ===

public struct MarkSent has copy, drop {
		game: ID,
		mark: ID,
}

public struct GameEnd has copy, drop {
		game: ID,
}

// === Constants ===

// Marks
const MARK__: u8 = 0;
const MARK_X: u8 = 1;
const MARK_O: u8 = 2;

// Trophy status
const TROPHY_NONE: u8 = 0;
const TROPHY_DRAW: u8 = 1;
const TROPHY_WIN: u8 = 2;

// === Errors ===

#[error]
const EInvalidLocation: vector<u8> = b"Move was for a position that doesn't exist on the board";

#[error]
const EWrongPlayer: vector<u8> = b"Game expected a move from another player";

#[error]
const ENotFinished: vector<u8> = b"Game has not reached an end condition";

#[error]
const EAlreadyFinished: vector<u8> = b"Can't place a mark on a finished game";

#[error]
const EInvalidEndState: vector<u8> = b"Game reached an end state that wasn't expected";

// === Public Functions ===

/// Create a new game, played by `x` and `o`. The game should be
/// transfered to the address that will administrate the game. If
/// that address is a multi-sig of the two players, its public key
/// should be passed as `admin`.
public fun new(x: address, o: address, admin: vector<u8>, ctx: &mut TxContext): Game {
		let game = Game {
				id: object::new(ctx),
				board: vector[MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__],
				turn: 0,
				x,
				o,
				admin,
		};

		let turn = TurnCap {
				id: object::new(ctx),
				game: object::id(&game),
		};

		// X is the first player, so send the capability to them.
		transfer::transfer(turn, x);
		game
}

/// Called by the active player to express their intention to make a move.
/// This consumes the `TurnCap` to prevent a player from making more than
/// one move on their turn.
public fun send_mark(cap: TurnCap, row: u8, col: u8, ctx: &mut TxContext) {
		assert!(row < 3 && col < 3, EInvalidLocation);

		let TurnCap { id, game } = cap;
		id.delete();

		let mark = Mark {
				id: object::new(ctx),
				player: ctx.sender(),
				row,
				col,
		};

		event::emit(MarkSent { game, mark: object::id(&mark) });
		transfer::transfer(mark, game.to_address());
}

/// Called by the admin (who owns the `Game`), to commit a player's
/// intention to make a move. If the game should end, `Trophy`s are sent to
/// the appropriate players, if the game should continue, a new `TurnCap` is
/// sent to the player who should make the next move.
public fun place_mark(game: &mut Game, mark: Receiving<Mark>, ctx: &mut TxContext) {
		assert!(game.ended() == TROPHY_NONE, EAlreadyFinished);

		// Fetch the mark on behalf of the game -- only works if the mark in
		// question was sent to this game.
		let Mark { id, row, col, player } = transfer::receive(&mut game.id, mark);
		id.delete();

		// Confirm that the mark is from the player we expect -- it should not
		// be possible to hit this assertion, because the `Mark`s can only be
		// created by the address that owns the `TurnCap` which cannot be
		// transferred, and is always held by `game.next_player()`.
		let (me, them, sentinel) = game.next_player();
		assert!(me == player, EWrongPlayer);

		if (game[row, col] == MARK__) {
				*(&mut game[row, col]) = sentinel;
				game.turn = game.turn + 1;
		};

		// Check win condition -- if there is a winner, send them the trophy,
		// otherwise, create a new turn cap and send that to the next player.
		let end = game.ended();
		if (end == TROPHY_WIN) {
				transfer::transfer(game.mint_trophy(end, them, ctx), me);
				event::emit(GameEnd { game: object::id(game) });
		} else if (end == TROPHY_DRAW) {
				transfer::transfer(game.mint_trophy(end, them, ctx), me);
				transfer::transfer(game.mint_trophy(end, me, ctx), them);
				event::emit(GameEnd { game: object::id(game) });
		} else if (end == TROPHY_NONE) {
				let cap = TurnCap { id: object::new(ctx), game: object::id(game) };
				let (to, _, _) = game.next_player();
				transfer::transfer(cap, to);
		} else {
				abort EInvalidEndState
		}
}

public fun burn(game: Game) {
		assert!(game.ended() != TROPHY_NONE, ENotFinished);
		let Game { id, .. } = game;
		id.delete();
}

/// Test whether the game has reached an end condition or not.
public fun ended(game: &Game): u8 {
		if (// Test rows
				test_triple(game, 0, 1, 2) ||
						test_triple(game, 3, 4, 5) ||
						test_triple(game, 6, 7, 8) ||
						// Test columns
						test_triple(game, 0, 3, 6) ||
						test_triple(game, 1, 4, 7) ||
						test_triple(game, 2, 5, 8) ||
						// Test diagonals
						test_triple(game, 0, 4, 8) ||
						test_triple(game, 2, 4, 6)) {
				TROPHY_WIN
		} else if (game.turn == 9) {
				TROPHY_DRAW
		} else {
				TROPHY_NONE
		}
}

#[syntax(index)]
public fun mark(game: &Game, row: u8, col: u8): &u8 {
		&game.board[(row * 3 + col) as u64]
}

#[syntax(index)]
fun mark_mut(game: &mut Game, row: u8, col: u8): &mut u8 {
		&mut game.board[(row * 3 + col) as u64]
}

// === Private Helpers ===

/// Address of the player the move is expected from, the address of the
/// other player, and the mark to use for the upcoming move.
fun next_player(game: &Game): (address, address, u8) {
		if (game.turn % 2 == 0) {
				(game.x, game.o, MARK_X)
		} else {
				(game.o, game.x, MARK_O)
		}
}

/// Test whether the values at the triple of positions all match each other
/// (and are not all EMPTY).
fun test_triple(game: &Game, x: u8, y: u8, z: u8): bool {
		let x = game.board[x as u64];
		let y = game.board[y as u64];
		let z = game.board[z as u64];

		MARK__ != x && x == y && y == z
}

/// Create a trophy from the current state of the `game`, that indicates
/// that a player won or drew against `other` player.
fun mint_trophy(game: &Game, status: u8, other: address, ctx: &mut TxContext): Trophy {
		Trophy {
				id: object::new(ctx),
				status,
				board: game.board,
				turn: game.turn,
				other,
		}
}

// === Test Helpers ===
#[test_only]
public use fun game_board as Game.board;
#[test_only]
public use fun trophy_status as Trophy.status;
#[test_only]
public use fun trophy_board as Trophy.board;
#[test_only]
public use fun trophy_turn as Trophy.turn;
#[test_only]
public use fun trophy_other as Trophy.other;

#[test_only]
public fun game_board(game: &Game): vector<u8> {
		game.board
}

#[test_only]
public fun trophy_status(trophy: &Trophy): u8 {
		trophy.status
}

#[test_only]
public fun trophy_board(trophy: &Trophy): vector<u8> {
		trophy.board
}

#[test_only]
public fun trophy_turn(trophy: &Trophy): u8 {
		trophy.turn
}

#[test_only]
public fun trophy_other(trophy: &Trophy): address {
		trophy.other
}

```

An alternative version of this game, shared tic-tac-toe, uses shared objects for a more straightforward implementation that doesn't use a centralized service. This comes at a slightly increased cost, as using shared objects is more expensive than transactions involving wholly owned objects.

## shared.move [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#shared.move "Direct link to shared.move")

In the previous version, the admin owned the game object, preventing players from directly changing the gameboard, as well as requiring two transactions for each marker placement. In this version, the game object is a shared object, allowing both players to access and modify it directly, enabling them to place markers in just one transaction. However, using a shared object generally incurs extra costs because Sui needs to sequence the operations from different transactions. In the context of this game, where players are expected to take turns, this shouldn't significantly impact performance. Overall, this shared object approach simplifies the implementation compared to the previous method.

As the following code demonstrates, the `Game` object in this example is almost identical to the one before it. The only differences are that it does not include an `admin` field, which is only relevant for the multisig version of the game, and it does not have `store`, because it only ever exists as a shared object (so it cannot be transferred or wrapped).

[examples/tic-tac-toe/move/sources/shared.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/shared.move)

```codeBlockLines_p187
public struct Game has key {
    id: UID,
    board: vector<u8>,
    turn: u8,
    x: address,
    o: address,
}

```

Take a look at the `new` function:

[examples/tic-tac-toe/move/sources/shared.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/shared.move)

```codeBlockLines_p187
public fun new(x: address, o: address, ctx: &mut TxContext) {
    transfer::share_object(Game {
        id: object::new(ctx),
        board: vector[MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__],
        turn: 0,
        x,
        o,
    });
}

```

Instead of the game being sent to the game admin, it is instantiated as a shared object. The other notable difference is that there is no need to mint a `TurnCap` because the only two addresses that can play this game are `x` and `o`, and this is checked in the next function, `place_mark`:

[examples/tic-tac-toe/move/sources/shared.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/shared.move)

```codeBlockLines_p187
public fun place_mark(game: &mut Game, row: u8, col: u8, ctx: &mut TxContext) {
    assert!(game.ended() == TROPHY_NONE, EAlreadyFinished);
    assert!(row < 3 && col < 3, EInvalidLocation);

    let (me, them, sentinel) = game.next_player();
    assert!(me == ctx.sender(), EWrongPlayer);

    if (game[row, col] != MARK__) {
        abort EAlreadyFilled
    };

    *(&mut game[row, col]) = sentinel;
    game.turn = game.turn + 1;

    let end = game.ended();
    if (end == TROPHY_WIN) {
        transfer::transfer(game.mint_trophy(end, them, ctx), me);
    } else if (end == TROPHY_DRAW) {
        transfer::transfer(game.mint_trophy(end, them, ctx), me);
        transfer::transfer(game.mint_trophy(end, me, ctx), them);
    } else if (end != TROPHY_NONE) {
        abort EInvalidEndState
    }
}

```

Click to open

`shared.move`

[examples/tic-tac-toe/move/sources/shared.move](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/move/sources/shared.move)

```codeBlockLines_p187
/// An implementation of Tic Tac Toe, using shared objects.
///
/// The `Game` object is shared so both players can mutate it, and
/// contains authorization logic to only accept a move from the
/// correct player.
///
/// The `owned` module shows a variant of this game implemented using
/// only fast path transactions, which should be cheaper and lower
/// latency, but either requires a centralized service or a multi-sig
/// set-up to own the game.
module tic_tac_toe::shared;

/// The state of an active game of tic-tac-toe.
public struct Game has key {
		id: UID,
		/// Marks on the board.
		board: vector<u8>,
		/// The next turn to be played.
		turn: u8,
		/// The address expected to send moves on behalf of X.
		x: address,
		/// The address expected to send moves on behalf of O.
		o: address,
}

/// An NFT representing a finished game. Sent to the winning player if there
/// is one, or to both players in the case of a draw.
public struct Trophy has key {
		id: UID,
		/// Whether the game was won or drawn.
		status: u8,
		/// The state of the board at the end of the game.
		board: vector<u8>,
		/// The number of turns played
		turn: u8,
		/// The other player (relative to the player who owns this Trophy).
		other: address,
}

// === Constants ===

// Marks
const MARK__: u8 = 0;
const MARK_X: u8 = 1;
const MARK_O: u8 = 2;

// Trophy status
const TROPHY_NONE: u8 = 0;
const TROPHY_DRAW: u8 = 1;
const TROPHY_WIN: u8 = 2;

// === Errors ===

#[error]
const EInvalidLocation: vector<u8> = b"Move was for a position that doesn't exist on the board.";

#[error]
const EWrongPlayer: vector<u8> = b"Game expected a move from another player";

#[error]
const EAlreadyFilled: vector<u8> = b"Attempted to place a mark on a filled slot.";

#[error]
const ENotFinished: vector<u8> = b"Game has not reached an end condition.";

#[error]
const EAlreadyFinished: vector<u8> = b"Can't place a mark on a finished game.";

#[error]
const EInvalidEndState: vector<u8> = b"Game reached an end state that wasn't expected.";

// === Public Functions ===

/// Create a new game, played by `x` and `o`. This function should be called
/// by the address responsible for administrating the game.
public fun new(x: address, o: address, ctx: &mut TxContext) {
		transfer::share_object(Game {
				id: object::new(ctx),
				board: vector[MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__, MARK__],
				turn: 0,
				x,
				o,
		});
}

/// Called by the next player to add a new mark.
public fun place_mark(game: &mut Game, row: u8, col: u8, ctx: &mut TxContext) {
		assert!(game.ended() == TROPHY_NONE, EAlreadyFinished);
		assert!(row < 3 && col < 3, EInvalidLocation);

		// Confirm that the mark is from the player we expect.
		let (me, them, sentinel) = game.next_player();
		assert!(me == ctx.sender(), EWrongPlayer);

		if (game[row, col] != MARK__) {
				abort EAlreadyFilled
		};

		*(&mut game[row, col]) = sentinel;
		game.turn = game.turn + 1;

		// Check win condition -- if there is a winner, send them the trophy.
		let end = game.ended();
		if (end == TROPHY_WIN) {
				transfer::transfer(game.mint_trophy(end, them, ctx), me);
		} else if (end == TROPHY_DRAW) {
				transfer::transfer(game.mint_trophy(end, them, ctx), me);
				transfer::transfer(game.mint_trophy(end, me, ctx), them);
		} else if (end != TROPHY_NONE) {
				abort EInvalidEndState
		}
}

// === Private Helpers ===

/// Address of the player the move is expected from, the address of the
/// other player, and the mark to use for the upcoming move.
fun next_player(game: &Game): (address, address, u8) {
		if (game.turn % 2 == 0) {
				(game.x, game.o, MARK_X)
		} else {
				(game.o, game.x, MARK_O)
		}
}

/// Test whether the values at the triple of positions all match each other
/// (and are not all EMPTY).
fun test_triple(game: &Game, x: u8, y: u8, z: u8): bool {
		let x = game.board[x as u64];
		let y = game.board[y as u64];
		let z = game.board[z as u64];

		MARK__ != x && x == y && y == z
}

/// Create a trophy from the current state of the `game`, that indicates
/// that a player won or drew against `other` player.
fun mint_trophy(game: &Game, status: u8, other: address, ctx: &mut TxContext): Trophy {
		Trophy {
				id: object::new(ctx),
				status,
				board: game.board,
				turn: game.turn,
				other,
		}
}

public fun burn(game: Game) {
		assert!(game.ended() != TROPHY_NONE, ENotFinished);
		let Game { id, .. } = game;
		id.delete();
}

/// Test whether the game has reached an end condition or not.
public fun ended(game: &Game): u8 {
		if (// Test rows
				test_triple(game, 0, 1, 2) ||
						test_triple(game, 3, 4, 5) ||
						test_triple(game, 6, 7, 8) ||
						// Test columns
						test_triple(game, 0, 3, 6) ||
						test_triple(game, 1, 4, 7) ||
						test_triple(game, 2, 5, 8) ||
						// Test diagonals
						test_triple(game, 0, 4, 8) ||
						test_triple(game, 2, 4, 6)) {
				TROPHY_WIN
		} else if (game.turn == 9) {
				TROPHY_DRAW
		} else {
				TROPHY_NONE
		}
}

#[syntax(index)]
public fun mark(game: &Game, row: u8, col: u8): &u8 {
		&game.board[(row * 3 + col) as u64]
}

#[syntax(index)]
fun mark_mut(game: &mut Game, row: u8, col: u8): &mut u8 {
		&mut game.board[(row * 3 + col) as u64]
}

// === Test Helpers ===
#[test_only]
public use fun game_board as Game.board;
#[test_only]
public use fun trophy_status as Trophy.status;
#[test_only]
public use fun trophy_board as Trophy.board;
#[test_only]
public use fun trophy_turn as Trophy.turn;
#[test_only]
public use fun trophy_other as Trophy.other;

#[test_only]
public fun game_board(game: &Game): vector<u8> {
		game.board
}

#[test_only]
public fun trophy_status(trophy: &Trophy): u8 {
		trophy.status
}

#[test_only]
public fun trophy_board(trophy: &Trophy): vector<u8> {
		trophy.board
}

#[test_only]
public fun trophy_turn(trophy: &Trophy): u8 {
		trophy.turn
}

#[test_only]
public fun trophy_other(trophy: &Trophy): address {
		trophy.other
}

```

## Multisig [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#multisig "Direct link to Multisig")

Multisig tic-tac-toe uses the same Move code as the owned version of the game, but interacts with it differently. Instead of transferring the game to a third party admin account, the players create a 1-of-2 multisig account to act as the game admin, so that either player can sign on behalf of the "admin". This pattern offers a way to share a resource between up to ten accounts without relying on consensus.

In this implementation of the game, the game is in a 1-of-2 multisig account that acts as the game admin. In this particular case, because there are only two players, the previous example is a more convenient use case. However, this example illustrates that in some cases, a multisig can replace shared objects, thus allowing transactions to bypass consensus when using such an implementation.

### Creating a multisig account [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#creating-a-multisig-account "Direct link to Creating a multisig account")

A multisig account is defined by the public keys of its constituent keypairs, their relative weights, and the threshold -- a signature is valid if the sum of weights of constituent keys having signed the signature exceeds the threshold. In our case, there are at most two constituent keypairs, they each have a weight of 1 and the threshold is also 1. A multisig cannot mention the same public key twice, so keys are deduplicated before the multisig is formed to deal with the case where a player is playing themselves:

[examples/tic-tac-toe/ui/src/MultiSig.ts](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/ui/src/MultiSig.ts)

```codeBlockLines_p187
export function multiSigPublicKey(keys: PublicKey[]): MultiSigPublicKey {
  const deduplicated: { [key: string]: PublicKey } = {};
  for (const key of keys) {
    deduplicated[key.toSuiAddress()] = key;
  }

  return MultiSigPublicKey.fromPublicKeys({
    threshold: 1,
    publicKeys: Object.values(deduplicated).map((publicKey) => {
      return { publicKey, weight: 1 };
    }),
  });
}

```

Click to open

`MultiSig.ts`

[examples/tic-tac-toe/ui/src/MultiSig.ts](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/ui/src/MultiSig.ts)

```codeBlockLines_p187
import { PublicKey } from "@mysten/sui/cryptography";
import { MultiSigPublicKey } from "@mysten/sui/multisig";

/**
 * Generate the public key corresponding to a 1-of-N multi-sig
 * composed of `keys` (all with equal weighting).
 */
export function multiSigPublicKey(keys: PublicKey[]): MultiSigPublicKey {
		// Multi-sig addresses cannot contain the same public keys multiple
		// times. In our case, it's fine to de-duplicate them because all
		// keys get equal weight and the threshold is 1.
		const deduplicated: { [key: string]: PublicKey } = {};
		for (const key of keys) {
				deduplicated[key.toSuiAddress()] = key;
		}

		return MultiSigPublicKey.fromPublicKeys({
				threshold: 1,
				publicKeys: Object.values(deduplicated).map((publicKey) => {
						return { publicKey, weight: 1 };
				}),
		});
}

```

Note that an address on Sui can be derived from a public key (this fact is used in the previous example to deduplicate public keys based on their accompanying address), but the opposite is not true. This means that to start a game of multisig tic-tac-toe, players must exchange public keys, instead of addresses.

### Building a multisig transaction [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#building-a-multisig-transaction "Direct link to Building a multisig transaction")

When creating a multisig game, we make use of `owned::Game`'s `admin` field to store the multisig public key for the admin account. Later, it will be used to form the signature for the second transaction in the move. This does not need to be stored on-chain, but we are doing so for convenience so that when we fetch the `Game`'s contents, we get the public key as well:

[examples/tic-tac-toe/ui/src/hooks/useTransactions.ts](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/ui/src/hooks/useTransactions.ts)

```codeBlockLines_p187
newMultiSigGame(player: PublicKey, opponent: PublicKey): Transaction {
  const admin = multiSigPublicKey([player, opponent]);
  const tx = new Transaction();

  const game = tx.moveCall({
    target: `${this.packageId}::owned::new`,
    arguments: [\
      tx.pure.address(player.toSuiAddress()),\
      tx.pure.address(opponent.toSuiAddress()),\
      tx.pure(bcs.vector(bcs.u8()).serialize(admin.toRawBytes()).toBytes()),\
    ],
  });

  tx.transferObjects([game], admin.toSuiAddress());

  return tx;
}

```

`useTransactions.ts` also contains functions to place, send, and receive marks, end the game, and burn completed games. These functions all return a `Transaction` object, which is used in the React frontend to execute the transaction with the appropriate signer.

Click to open

`useTransactions.ts`

[examples/tic-tac-toe/ui/src/hooks/useTransactions.ts](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/ui/src/hooks/useTransactions.ts)

```codeBlockLines_p187
import { bcs } from "@mysten/sui/bcs";
import { PublicKey } from "@mysten/sui/cryptography";
import { ObjectRef, Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "config";
import { Game } from "hooks/useGameQuery";
import { TurnCap } from "hooks/useTurnCapQuery";
import { multiSigPublicKey } from "MultiSig";

/** Hook to provide an instance of the Transactions builder. */
export function useTransactions(): Transactions | null {
		const packageId = useNetworkVariable("packageId");
		return packageId ? new Transactions(packageId) : null;
}

/**
 * Builds on-chain transactions for the Tic-Tac-Toe game.
 */
export class Transactions {
		readonly packageId: string;

		constructor(packageId: string) {
				this.packageId = packageId;
		}

		newSharedGame(player: string, opponent: string): Transaction {
				const tx = new Transaction();

				tx.moveCall({
						target: `${this.packageId}::shared::new`,
						arguments: [tx.pure.address(player), tx.pure.address(opponent)],
				});

				return tx;
		}

		newMultiSigGame(player: PublicKey, opponent: PublicKey): Transaction {
				const admin = multiSigPublicKey([player, opponent]);
				const tx = new Transaction();

				const game = tx.moveCall({
						target: `${this.packageId}::owned::new`,
						arguments: [\
								tx.pure.address(player.toSuiAddress()),\
								tx.pure.address(opponent.toSuiAddress()),\
								tx.pure(bcs.vector(bcs.u8()).serialize(admin.toRawBytes()).toBytes()),\
						],
				});

				tx.transferObjects([game], admin.toSuiAddress());

				return tx;
		}

		placeMark(game: Game, row: number, col: number): Transaction {
				if (game.kind !== "shared") {
						throw new Error("Cannot place mark directly on owned game");
				}

				const tx = new Transaction();

				tx.moveCall({
						target: `${this.packageId}::shared::place_mark`,
						arguments: [tx.object(game.id), tx.pure.u8(row), tx.pure.u8(col)],
				});

				return tx;
		}

		sendMark(cap: TurnCap, row: number, col: number): Transaction {
				const tx = new Transaction();

				tx.moveCall({
						target: `${this.packageId}::owned::send_mark`,
						arguments: [tx.object(cap.id.id), tx.pure.u8(row), tx.pure.u8(col)],
				});

				return tx;
		}

		receiveMark(game: Game, mark: ObjectRef): Transaction {
				if (game.kind !== "owned") {
						throw new Error("Cannot receive mark on shared game");
				}

				const tx = new Transaction();

				tx.moveCall({
						target: `${this.packageId}::owned::place_mark`,
						arguments: [tx.object(game.id), tx.receivingRef(mark)],
				});

				return tx;
		}

		ended(game: Game): Transaction {
				const tx = new Transaction();

				tx.moveCall({
						target: `${this.packageId}::${game.kind}::ended`,
						arguments: [tx.object(game.id)],
				});

				return tx;
		}

		burn(game: Game): Transaction {
				const tx = new Transaction();

				tx.moveCall({
						target: `${this.packageId}::${game.kind}::burn`,
						arguments: [tx.object(game.id)],
				});

				return tx;
		}
}

```

### Placing a mark [​](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe\#placing-a-mark "Direct link to Placing a mark")

Placing a mark requires two transactions, just like the owned example, but they are both driven by one of the players. The first transaction is executed by the player as themselves, to send the mark to the game, and the second is executed by the player acting as the admin to place the mark they just sent. In the React frontend, this is performed as follows:

[examples/tic-tac-toe/ui/src/pages/Game.tsx](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/ui/src/pages/Game.tsx)

```codeBlockLines_p187
function OwnedGame({
  game,
  trophy,
  invalidateGame,
  invalidateTrophy,
}: {
  game: GameData;
  trophy: Trophy;
  invalidateGame: InvalidateGameQuery;
  invalidateTrophy: InvalidateTrophyQuery;
}): ReactElement {
  const adminKey = game.admin ? new MultiSigPublicKey(new Uint8Array(game.admin)) : null;

  const client = useSuiClient();
  const signAndExecute = useExecutor();
  const multiSignAndExecute = useExecutor({
    execute: ({ bytes, signature }) => {
      const multiSig = adminKey!!.combinePartialSignatures([signature]);
      return client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: [multiSig, signature],
        options: {
          showRawEffects: true,
        },
      });
    },
  });

  const [turnCap, invalidateTurnCap] = useTurnCapQuery(game.id);
  const account = useCurrentAccount();
  const tx = useTransactions()!!;

  // ...

  const onMove = (row: number, col: number) => {
    signAndExecute(
      {
        tx: tx.sendMark(turnCap?.data!!, row, col),
        options: { showObjectChanges: true },
      },
      ({ objectChanges }) => {
        const mark = objectChanges?.find(
          (c) => c.type === 'created' && c.objectType.endsWith('::Mark'),
        );

        if (mark && mark.type === 'created') {
          const recv = tx.receiveMark(game, mark);
          recv.setSender(adminKey!!.toSuiAddress());
          recv.setGasOwner(account?.address!!);

          multiSignAndExecute({ tx: recv }, () => {
            invalidateGame();
            invalidateTrophy();
            invalidateTurnCap();
          });
        }
      },
    );
  };

  // ...
}

```

Click to open

`Game.tsx`

[examples/tic-tac-toe/ui/src/pages/Game.tsx](https://github.com/MystenLabs/sui/tree/main/examples/tic-tac-toe/ui/src/pages/Game.tsx)

```codeBlockLines_p187
import "./Game.css";

import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { MultiSigPublicKey } from "@mysten/sui/multisig";
import { TrashIcon } from "@radix-ui/react-icons";
import { AlertDialog, Badge, Button, Flex } from "@radix-ui/themes";
import { Board } from "components/Board";
import { Error } from "components/Error";
import { IDLink } from "components/IDLink";
import { Loading } from "components/Loading";
import { Game as GameData, InvalidateGameQuery, Mark, useGameQuery } from "hooks/useGameQuery";
import { useTransactions } from "hooks/useTransactions";
import { InvalidateTrophyQuery, Trophy, useTrophyQuery } from "hooks/useTrophyQuery";
import { useTurnCapQuery } from "hooks/useTurnCapQuery";
import { useExecutor } from "mutations/useExecutor";
import { ReactElement } from "react";

type Props = {
		id: string;
};

enum Turn {
		Spectating,
		Yours,
		Theirs,
}

enum Winner {
		/** Nobody has won yet */
		None,

		/** X has won, and you are not a player */
		X,

		/** O has won, and you are not a player */
		O,

		/** You won */
		You,

		/** The other player won */
		Them,

		/** Game ended in a draw */
		Draw,
}

/**
 * Render the game at the given ID.
 *
 * Displays the noughts and crosses board, as well as a toolbar with:
 *
 * - An indicator of whose turn it is.
 * - A button to delete the game.
 * - The ID of the game being played.
 */
export default function Game({ id }: Props): ReactElement {
		const [game, invalidateGame] = useGameQuery(id);
		const [trophy, invalidateTrophy] = useTrophyQuery(game?.data);

		if (game.status === "pending") {
				return <Loading />;
		} else if (game.status === "error") {
				return (
						<Error title="Error loading game">
								Could not load game at <IDLink id={id} size="2" display="inline-flex" />.
								<br />
								{game.error.message}
						</Error>
				);
		}

		if (trophy.status === "pending") {
				return <Loading />;
		} else if (trophy.status === "error") {
				return (
						<Error title="Error loading game">
								Could not check win for <IDLink id={id} size="2" display="inline-flex" />:
								<br />
								{trophy.error.message}
						</Error>
				);
		}

		return game.data.kind === "shared" ? (
				<SharedGame
						game={game.data}
						trophy={trophy.data}
						invalidateGame={invalidateGame}
						invalidateTrophy={invalidateTrophy}
				/>
		) : (
				<OwnedGame
						game={game.data}
						trophy={trophy.data}
						invalidateGame={invalidateGame}
						invalidateTrophy={invalidateTrophy}
				/>
		);
}

function SharedGame({
		game,
		trophy,
		invalidateGame,
		invalidateTrophy,
}: {
		game: GameData;
		trophy: Trophy;
		invalidateGame: InvalidateGameQuery;
		invalidateTrophy: InvalidateTrophyQuery;
}): ReactElement {
		const account = useCurrentAccount();
		const { mutate: signAndExecute } = useExecutor();
		const tx = useTransactions()!!;

		const { id, board, turn, x, o } = game;
		const [mark, curr, next] = turn % 2 === 0 ? [Mark.X, x, o] : [Mark.O, o, x];

		// If it's the current account's turn, then empty cells should show
		// the current player's mark on hover. Otherwise show nothing, and
		// disable interactivity.
		const player = whoseTurn({ curr, next, addr: account?.address });
		const winner = whoWon({ curr, next, addr: account?.address, turn, trophy });
		const empty = Turn.Yours === player && trophy === Trophy.None ? mark : Mark._;

		const onMove = (row: number, col: number) => {
				signAndExecute({ tx: tx.placeMark(game, row, col) }, () => {
						invalidateGame();
						invalidateTrophy();
				});
		};

		const onDelete = (andThen: () => void) => {
				signAndExecute({ tx: tx.burn(game) }, andThen);
		};

		return (
				<>
						<Board marks={board} empty={empty} onMove={onMove} />
						<Flex direction="row" gap="2" mx="2" my="6" justify="between">
								{trophy !== Trophy.None ? (
										<WinIndicator winner={winner} />
								) : (
										<MoveIndicator turn={player} />
								)}
								{trophy !== Trophy.None && account ? <DeleteButton onDelete={onDelete} /> : null}
								<IDLink id={id} />
						</Flex>
				</>
		);
}

function OwnedGame({
		game,
		trophy,
		invalidateGame,
		invalidateTrophy,
}: {
		game: GameData;
		trophy: Trophy;
		invalidateGame: InvalidateGameQuery;
		invalidateTrophy: InvalidateTrophyQuery;
}): ReactElement {
		const adminKey = game.admin ? new MultiSigPublicKey(new Uint8Array(game.admin)) : null;

		const client = useSuiClient();
		const { mutate: signAndExecute } = useExecutor();
		const { mutate: multiSignAndExecute } = useExecutor({
				execute: ({ bytes, signature }) => {
						// SAFETY: We check below whether the admin key is available,
						// and only allow moves to be submitted when it is.
						const multiSig = adminKey!!.combinePartialSignatures([signature]);
						return client.executeTransactionBlock({
								transactionBlock: bytes,
								// The multi-sig authorizes access to the game object, while
								// the original signature authorizes access to the player's
								// gas object, because the player is sponsoring the
								// transaction.
								signature: [multiSig, signature],
								options: {
										showRawEffects: true,
								},
						});
				},
		});

		const [turnCap, invalidateTurnCap] = useTurnCapQuery(game.id);
		const account = useCurrentAccount();
		const tx = useTransactions()!!;

		if (adminKey == null) {
				return (
						<Error title="Error loading game">
								Could not load game at <IDLink id={game.id} size="2" display="inline-flex" />.
								<br />
								Game has no admin.
						</Error>
				);
		}

		if (turnCap.status === "pending") {
				return <Loading />;
		} else if (turnCap.status === "error") {
				return (
						<Error title="Error loading game">
								Could not load turn capability.
								<br />
								{turnCap.error?.message}
						</Error>
				);
		}

		const { id, board, turn, x, o } = game;
		const [mark, curr, next] = turn % 2 === 0 ? [Mark.X, x, o] : [Mark.O, o, x];

		// If it's the current account's turn, then empty cells should show
		// the current player's mark on hover. Otherwise show nothing, and
		// disable interactivity.
		const player = whoseTurn({ curr, next, addr: account?.address });
		const winner = whoWon({ curr, next, addr: account?.address, turn, trophy });
		const empty = Turn.Yours === player && trophy === Trophy.None ? mark : Mark._;

		const onMove = (row: number, col: number) => {
				signAndExecute(
						{
								// SAFETY: TurnCap should only be unavailable if the game is over.
								tx: tx.sendMark(turnCap?.data!!, row, col),
								options: { showObjectChanges: true },
						},
						({ objectChanges }) => {
								const mark = objectChanges?.find(
										(c) => c.type === "created" && c.objectType.endsWith("::Mark"),
								);

								if (mark && mark.type === "created") {
										// SAFETY: UI displays error if the admin key is not
										// available, and interactivity is disabled if there is not a
										// valid account.
										//
										// The transaction to make the actual move is made by the
										// multi-sig account (which owns the game), and is sponsored
										// by the player (as the multi-sig account doesn't have coins
										// of its own).
										const recv = tx.receiveMark(game, mark);
										recv.setSender(adminKey!!.toSuiAddress());
										recv.setGasOwner(account?.address!!);

										multiSignAndExecute({ tx: recv }, () => {
												invalidateGame();
												invalidateTrophy();
												invalidateTurnCap();
										});
								}
						},
				);
		};

		const onDelete = (andThen: () => void) => {
				// Just like with making a move, deletion has to be implemented as
				// a sponsored multi-sig transaction. This means only one of the
				// two players can clean up a finished game.
				const burn = tx.burn(game);
				burn.setSender(adminKey!!.toSuiAddress());
				burn.setGasOwner(account?.address!!);

				multiSignAndExecute({ tx: burn }, andThen);
		};

		return (
				<>
						<Board marks={board} empty={empty} onMove={onMove} />
						<Flex direction="row" gap="2" mx="2" my="6" justify="between">
								{trophy !== Trophy.None ? (
										<WinIndicator winner={winner} />
								) : (
										<MoveIndicator turn={player} />
								)}
								{trophy !== Trophy.None && player !== Turn.Spectating ? (
										<DeleteButton onDelete={onDelete} />
								) : null}
								<IDLink id={id} />
						</Flex>
				</>
		);
}

/**
 * Figure out whose turn it should be based on who the `curr`ent
 * player is, who the `next` player is, and what the `addr`ess of the
 * current account is.
 */
function whoseTurn({ curr, next, addr }: { curr: string; next: string; addr?: string }): Turn {
		if (addr === curr) {
				return Turn.Yours;
		} else if (addr === next) {
				return Turn.Theirs;
		} else {
				return Turn.Spectating;
		}
}

/**
 * Figure out who won the game, out of the `curr`ent, and `next`
 * players, relative to whose asking (`addr`). `turns` indicates the
 * number of turns we've seen so far, which is used to determine which
 * address corresponds to player X and player O.
 */
function whoWon({
		curr,
		next,
		addr,
		turn,
		trophy,
}: {
		curr: string;
		next: string;
		addr?: string;
		turn: number;
		trophy: Trophy;
}): Winner {
		switch (trophy) {
				case Trophy.None:
						return Winner.None;
				case Trophy.Draw:
						return Winner.Draw;
				case Trophy.Win:
						// These tests are "backwards" because the game advances to the
						// next turn after the win has happened. Nevertheless, make sure
						// to test for the "you" case before the "them" case to handle a
						// situation where a player is playing themselves.
						if (addr === next) {
								return Winner.You;
						} else if (addr === curr) {
								return Winner.Them;
						} else if (turn % 2 === 0) {
								return Winner.O;
						} else {
								return Winner.X;
						}
		}
}

function MoveIndicator({ turn }: { turn: Turn }): ReactElement {
		switch (turn) {
				case Turn.Yours:
						return <Badge color="green">Your turn</Badge>;
				case Turn.Theirs:
						return <Badge color="orange">Their turn</Badge>;
				case Turn.Spectating:
						return <Badge color="blue">Spectating</Badge>;
		}
}

function WinIndicator({ winner }: { winner: Winner }): ReactElement | null {
		switch (winner) {
				case Winner.None:
						return null;
				case Winner.Draw:
						return <Badge color="orange">Draw!</Badge>;
				case Winner.You:
						return <Badge color="green">You Win!</Badge>;
				case Winner.Them:
						return <Badge color="red">You Lose!</Badge>;
				case Winner.X:
						return <Badge color="blue">X Wins!</Badge>;
				case Winner.O:
						return <Badge color="blue">O Wins!</Badge>;
		}
}

/**
 * "Delete" button with a confirmation dialog. On confirmation, the
 * button calls `onDelete`, passing in an action to perform after
 * deletion has completed (returning to the homepage).
 */
function DeleteButton({ onDelete }: { onDelete: (andThen: () => void) => void }): ReactElement {
		const redirect = () => {
				// Navigate back to homepage, because the game is gone now.
				window.location.href = "/";
		};

		return (
				<AlertDialog.Root>
						<AlertDialog.Trigger>
								<Button color="red" size="1" variant="outline">
										<TrashIcon /> Delete Game
								</Button>
						</AlertDialog.Trigger>
						<AlertDialog.Content>
								<AlertDialog.Title>Delete Game</AlertDialog.Title>
								<AlertDialog.Description>
										Are you sure you want to delete this game? This will delete the object from the
										blockchain and cannot be undone.
								</AlertDialog.Description>
								<Flex gap="3" mt="3" justify="end">
										<AlertDialog.Cancel>
												<Button variant="soft" color="gray">
														Cancel
												</Button>
										</AlertDialog.Cancel>
										<AlertDialog.Action onClick={() => onDelete(redirect)}>
												<Button variant="solid" color="red">
														Delete
												</Button>
										</AlertDialog.Action>
								</Flex>
						</AlertDialog.Content>
				</AlertDialog.Root>
		);
}

```

The first step is to get the multisig public key, which was written to `Game.admin` earlier. Then two executor hooks are created: The first is to sign and execute as the current player, and the second is to sign and execute as the multisig/admin account. After the wallet has serialized and signed the transaction the second executor creates a multisig from the wallet signature and executes the transaction with two signatures: Authorizing on behalf of the multisig and the wallet.

The reason for the two signatures is clearer when looking at the construction of the `recv` transaction: The multisig authorizes access to the `Game`, and the wallet authorizes access to the gas object. This is because the multisig account does not hold any coins of its own, so it relies on the player account to sponsor the transaction.

You can find an example React front-end supporting both the multi-sig and shared variants of the game in the [ui directory](https://github.com/MystenLabs/sui/blob/main/examples/tic-tac-toe/ui), and a CLI written in Rust in the [cli directory](https://github.com/MystenLabs/sui/blob/main/examples/tic-tac-toe/cli).

- [What the guide teaches](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#what-the-guide-teaches)
- [What you need](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#what-you-need)
- [Directory structure](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#directory-structure)
- [owned.move](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#owned.move)
- [shared.move](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#shared.move)
- [Multisig](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#multisig)
  - [Creating a multisig account](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#creating-a-multisig-account)
  - [Building a multisig transaction](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#building-a-multisig-transaction)
  - [Placing a mark](https://docs.sui.io/guides/developer/app-examples/tic-tac-toe#placing-a-mark)