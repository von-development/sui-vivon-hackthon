# https://docs.sui.io/guides/developer/app-examples/blackjack

[Skip to main content](https://docs.sui.io/guides/developer/app-examples/blackjack#__docusaurus_skipToContent_fallback)

On this page

The following documentation goes through an example implementation of the popular casino game blackjack on Sui. This guide walks through its components, providing a detailed look at the module's functions, structures, constants, and their significance in the overall gameplay mechanism.

A deployed version of the blackjack game is online at [Mysten Blackjack](https://blackjack-sui.vercel.app/).

Building an on-chain blackjack game shares a lot of similarities with a coin flip game. This example covers the smart contracts (Move modules), backend logic (using serverless functions), and frontend logic.

info

For more details on building a backend and deploying to Sui, check out the [Coin Flip app example](https://docs.sui.io/guides/developer/app-examples/coin-flip).

You can also find the [full repository for this example here](https://github.com/MystenLabs/blackjack-sui).

## Gameplay [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#gameplay "Direct link to Gameplay")

In this single-player version of blackjack, the player competes against a dealer, which is automated by the system. The dealer is equipped with a public BLS key that plays a central role in the game's mechanics. The dealer's actions are triggered by HTTP requests to serverless functions. Players generate randomness for the game by interacting with their mouse on the screen, after which they place their bet to start the game. Upon initiating the game, a request is made to the backend (dealer), which processes it by signing and subsequently dealing two cards to the player and one to themselves.

The player has the option to 'Hit' or 'Stand.' Selecting 'Stand' triggers the dealer to draw cards until the total reaches 17 or higher. After the dealer stops, the smart contract steps in to compare the totals and declare the winner. On the other hand, choosing 'Hit' prompts the dealer to draw an additional card for the player.

Note that more complex blackjack rules, such as splitting, are considered out of scope for this example, and are therefore not implemented.

## Smart contracts [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#smart-contracts "Direct link to Smart contracts")

### Game module [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#game-module "Direct link to Game module")

The [`single_player_blackjack.move`](https://github.com/MystenLabs/blackjack-sui/blob/main/move/blackjack/sources/single_player_blackjack.move) module includes several constants that define game statuses and help track the game's progress:

- `IN_PROGRESS`
- `PLAYER_WON_STATUS`
- `HOUSE_WON_STATUS`
- `TIE_STATUS`

There are also constants for error handling, such as `EInvalidBlsSig`, `EInsufficientBalance`, and others, ensuring robust game mechanics.

Structs like `GameCreatedEvent`, `GameOutcomeEvent`, and `HitDoneEvent` capture the various events and actions within a game. The `HitRequest` and `StandRequest` structs ensure that a move (hit/stand) can be performed by the house only if the player has already requested it. `HouseAdminCap` and `HouseData` are crucial for maintaining the house's data, including balance and public key, while the `Game` struct contains all the necessary information about each game, such as player data, cards, and the current status.

The module's functions can be broadly categorized into initialization, game management, and utility functions. The `init` function sets up the house admin capability, while `initialize_house_data` prepares the house for the game by setting up the balance and public key. `place_bet_and_create_game` is the entry point for players to start a new game, involving a bet and random input. The functions `first_deal`, `hit`, and `stand` govern the core gameplay, handling the dealing of cards and player choices.

Utility functions like `get_next_random_card` and `get_card_sum` are essential for the game's mechanics, generating random cards and calculating hand values. The module also includes accessors for retrieving various pieces of game and house data.

For testing purposes, the module provides special functions like `get_house_admin_cap_for_testing`, `player_won_post_handling_for_test` and `house_won_post_handling_for_test`, ensuring that developers can thoroughly test the game mechanics and house data handling.

### Counter module [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#counter-module "Direct link to Counter module")

The next module, [`counter_nft.move`](https://github.com/MystenLabs/blackjack-sui/blob/main/move/blackjack/sources/counter_nft.move), introduces the Counter NFT, a key component in the game's mechanics. It serves as the [verifiable random function (VRF)](https://docs.sui.io/guides/developer/cryptography/ecvrf) input, ensuring uniqueness in each game. The Counter NFT's value increases after each use, maintaining its distinctiveness for every new request. For first-time players, the creation of a Counter NFT is mandatory. To enhance user experience, the user interface can automate this process by integrating the Counter NFT's creation with the game initiation in a single transaction block. This seamless integration simplifies the process for the player, allowing them to focus on the gameplay. This counter serves the same purpose as the one in the [Coin Flip example](https://docs.sui.io/guides/developer/app-examples/coin-flip).

## Backend [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#backend "Direct link to Backend")

The backend is used for all the transactions that are executed by the dealer. The backend can be completely stateless, and for that reason serverless functions are utilized. As a result, the corresponding code lies under the [app/src/app/api/ directory](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/api).

### Directories structure [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#directories-structure "Direct link to Directories structure")

The backend code is split in the following sub directories:

- [games/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/api/games):
The main code of the backend endpoints. Each file that is named `route.ts` is served as an endpoint, in the path defined by the project structure (see [Route Segments on NextJS App Router](https://nextjs.org/docs/app/building-your-application/routing#route-segments) for details)
- [health/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/api/health): A simple healthcheck endpoint to check the API availability
- [helpers/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/api/helpers): Multiple helper functions used in various endpoints
- [services/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/api/services): The core logic of the backend, that signs and executes the transactions on the Sui blockchain
- [utils/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/api/utils): Reusable methods for signing the transactions as the dealer, and sponsoring them with Shinami, to avoid gas coins equivocation

### High-Level endpoints specification [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#high-level-endpoints-specification "Direct link to High-Level endpoints specification")

| HTTP Method | Path | Description | Request Body |
| --- | --- | --- | --- |
| GET | `/api/health` | A simple healthcheck endpoint to check the API availability | txDigest |
| POST | `/api/games/{id}/deal` | Executes the initial deal transaction after the game creation | txDigest |
| POST | `/api/games/{id}/hit` | Executes a hit move | txDigest, id of corresponding HitRequest object |
| POST | `/api/games/{id}/stand` | Executes a stand move | txDigest, id of corresponding StandRequest object |

### Need of usage of waitForTransaction [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#need-of-usage-of-waitfortransaction "Direct link to Need of usage of waitForTransaction")

An interesting aspect of developing a dApp on Sui, that is coupled to using a full node with/without a load balancer, and requires attention by the developer, is the occurrence of read-after-write and write-after-write cases.

#### Initial deal transaction [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#initial-deal-transaction "Direct link to Initial deal transaction")

As an example, in the blackjack game, just after the create-game transaction that the user executes, the dealer executes the initial-deal transaction. This one accepts an argument and modifies the game object, meaning that you are using an object that was just created.

To ensure that the game object is available in the Full node that the dealer is using, we need to call waitForTransaction after the create-game transaction.

#### Hit and stand transactions [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#hit-and-stand-transactions "Direct link to Hit and stand transactions")

In the same way, every time you re-fetch the game object in the frontend, make sure that the previous transaction that modified the game object is already available in the Full node.

This leads to the need of exchanging the `txDigest` between the frontend and the backend, and use `waitForTransaction` on each write-after-write or read-after-write case.

## Frontend [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#frontend "Direct link to Frontend")

The [`page` component](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/page.tsx), a central element of the blackjack game's frontend module, is structured to create an interactive and responsive gaming experience. Written in React, it integrates several features and functions to handle the game's logic and user interactions effectively.

### Directories structure [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#directories-structure-1 "Direct link to Directories structure")

The frontend is a NextJS project, that follows the NextJS App Router [project structure](https://nextjs.org/docs/app/building-your-application/routing).
The main code of the frontend lies under the [app/src/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/) directory.
The main sub-directories are:

- [app/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/app/): The main code of the pages and the API endpoints.
- [components/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/components): The reusable components of the app, organized in sub-directories.
- [hooks/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/hooks): The custom hooks used in the app.
- [helpers/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/helpers), [utils/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/utils), [lib/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/lib): Multiple helper functions and utilities.
- [types/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/types): The types/interfaces used in the app.
- [styles/](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/styles): The global css files to style our app.

### Components and custom hooks for state management [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#components-and-custom-hooks-for-state-management "Direct link to Components and custom hooks for state management")

- **Custom Hooks:** To keep the code as structured as possible, multiple custom hooks are utilized to manage the complex state of the game board at each step. The [useBlackjackGame](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/hooks/useBlackjackGame.ts) custom hook encapsulates the game state and logic, exposing all the required information (with fields such as `game`, `isInitialDealLoading`), and the required functionality (with methods such as `handleCreateGame` and `handleHit`) to display and play the game. Multiple additional custom hooks, such as [useCreateBlackjackGame](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/hooks/useCreateBlackjackGame.ts), and [useMakeMoveInBlackjackGame](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/hooks/useMakeMoveInBlackjackGame.ts) are encapsulating their own piece of state and logic to make the code readable and maintainable.

- **Component for Game Initialization:** The [StartGame](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/components/home/StartGame.tsx) component is implemented to facilitate the creation of a new game. It renders the [CollectMouseRandomness](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/components/home/CollectMouseRandomness.tsx) to capture the randomness and uses the `handleCreateGame` function of the [useBlackjackGame](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/hooks/useBlackjackGame.ts) hook to execute the create-game transaction.

- **Randomness Generation:** Fair game outcomes are also ensured by the [CollectMouseRandomness](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/components/home/CollectMouseRandomness.tsx) component. This component is using the [useMouseRandomness](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/hooks/useMouseRandomness.ts) custom hook, and is in charge of capturing some user's mouse movements and generating a random bytes array. This array is converted to a hexadecimal string ( `randomness`) and used in the create-game transaction.

- **Card Displaying and Management:** The [DealerCards](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/components/home/DealerCards.tsx) and the [PlayerCards](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/components/home/PlayerCards.tsx) components are used to display the total points and the cards owned by the dealer and the player respectively.

- **Game Actions:** The [GameActions](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/components/home/GameActions.tsx) component is used to display the Hit and Stand buttons, and trigger the corresponding actions, as they are exported by the [useBlackjackGame](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/hooks/useBlackjackGame.ts) hook to execute the corresponding transactions.

- **BlackjackBanner**: The [BlackjackBanner](https://github.com/MystenLabs/blackjack-sui/blob/main/app/src/components/home/BlackjackBanner.tsx) component is used as a custom view to display when the player wins with a blackjack.


## Comparison: Blackjack and Coin Flip [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#comparison-blackjack-and-coin-flip "Direct link to Comparison: Blackjack and Coin Flip")

### Similarities [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#similarities "Direct link to Similarities")

- **Blockchain-Based Logic:** Both games are built on Sui, leveraging its capabilities for decentralized applications. The core game logic for each resides in Move modules, ensuring secure and verifiable gameplay.

- **State Management:** In both games, state management is crucial. For blackjack, this involves managing the player and dealer's hands and scores using React state hooks. In Satoshi Coin Flip, the state is managed through Move structs like `HouseData`, which track the house's balance and other game-related details.

- **Randomness and Fair Play:** Both games emphasize randomness for fairness. Blackjack uses a Counter NFT and player mouse movements to generate randomness, while Satoshi Coin Flip only uses a Counter NFT as a unique input for the [Verifiable Random Function (VRF)](https://docs.sui.io/guides/developer/cryptography/ecvrf) in each game.

- **Smart Contract Interactions:** Each game involves smart contract interactions for game actions like placing bets, dealing cards (Blackjack), or making guesses (Coin Flip). These interactions are crucial for executing the game's logic on the blockchain.


### Differences [​](https://docs.sui.io/guides/developer/app-examples/blackjack\#differences "Direct link to Differences")

- **Game Mechanics and Complexity:** Blackjack is a more complex game with multiple actions (hit, stand, deal) and state updates, requiring a more dynamic frontend. In contrast, Satoshi Coin Flip has a simpler mechanic centered around a single bet and guess outcome.

- **User Interface (UI) Complexity:** The Blackjack game involves a more intricate UI to display cards, manage game states, and player interactions. Satoshi Coin Flip, being simpler in gameplay, requires a less complex UI.

- **Backend Processing:** In Blackjack, the dealer is automated (the machine), and the player's actions directly influence game outcomes. In the Coin Flip game, the house (smart contract) plays a more passive role, primarily in initializing and finalizing the game based on the player's guess.

- **Module Structure and Focus:** The Blackjack game focuses more on frontend interactions and real-time updates. The Satoshi Coin Flip game, delves into backend logic, with structures like `HouseCap` and `house_data` for initializing and managing game data securely on the blockchain.

- **Multi-Version Implementation:** The Satoshi Coin Flip game mentions two versions – one susceptible to MEV attacks and another that is resistant, indicating a focus on security and user experience variations. Such variations aren't implemented in Blackjack.


info

The complete app example can be found in [the blackjack-sui repo](https://github.com/MystenLabs/blackjack-sui).

- [Gameplay](https://docs.sui.io/guides/developer/app-examples/blackjack#gameplay)
- [Smart contracts](https://docs.sui.io/guides/developer/app-examples/blackjack#smart-contracts)
  - [Game module](https://docs.sui.io/guides/developer/app-examples/blackjack#game-module)
  - [Counter module](https://docs.sui.io/guides/developer/app-examples/blackjack#counter-module)
- [Backend](https://docs.sui.io/guides/developer/app-examples/blackjack#backend)
  - [Directories structure](https://docs.sui.io/guides/developer/app-examples/blackjack#directories-structure)
  - [High-Level endpoints specification](https://docs.sui.io/guides/developer/app-examples/blackjack#high-level-endpoints-specification)
  - [Need of usage of waitForTransaction](https://docs.sui.io/guides/developer/app-examples/blackjack#need-of-usage-of-waitfortransaction)
- [Frontend](https://docs.sui.io/guides/developer/app-examples/blackjack#frontend)
  - [Directories structure](https://docs.sui.io/guides/developer/app-examples/blackjack#directories-structure-1)
  - [Components and custom hooks for state management](https://docs.sui.io/guides/developer/app-examples/blackjack#components-and-custom-hooks-for-state-management)
- [Comparison: Blackjack and Coin Flip](https://docs.sui.io/guides/developer/app-examples/blackjack#comparison-blackjack-and-coin-flip)
  - [Similarities](https://docs.sui.io/guides/developer/app-examples/blackjack#similarities)
  - [Differences](https://docs.sui.io/guides/developer/app-examples/blackjack#differences)