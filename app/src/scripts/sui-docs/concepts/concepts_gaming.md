# https://docs.sui.io/concepts/gaming

[Skip to main content](https://docs.sui.io/concepts/gaming#__docusaurus_skipToContent_fallback)

On this page

Gaming on Sui leverages blockchain technology to enhance in-game economies, ownership, and interactions. With features like dynamic NFTs, kiosks, soulbound assets, and on-chain randomness, Sui provides builders with the tools to create immersive, transparent, and fair gaming experiences. Players benefit from true asset ownership, decentralized marketplaces, and seamless Web3 integration without compromising usability.

This topic explores the key features of Sui for gaming, real-world use cases, and essential tools for builders. Whether you're building an RPG, a racing game, or a digital card game, Sui provides the Web3 infrastructure to power your next-generation gaming projects.

## Representing in-game objects on chain [​](https://docs.sui.io/concepts/gaming\#representing-in-game-objects-on-chain "Direct link to Representing in-game objects on chain")

One of the aspects that defines a Web3 game is having objects within the game reside on a blockchain. Whether it's in-game currency, battle passes, skins, or any number of other objects, knowing how to create and integrate these items is the first step in building the desired user experience on Sui.

### In-game currencies [​](https://docs.sui.io/concepts/gaming\#in-game-currencies "Direct link to In-game currencies")

In-game currencies allow users to purchase game features like items, upgrades, and premium content. Before Web3, these currencies remained only in the game and their values were set by the game developers.

Using Sui, players can now have true ownership of their in-game currency. The currency exists as a token on the Sui blockchain, where players can conceivably buy, sell, or swap that currency for anything else that also lives on chain. If you create an ecosystem of games, players can purchase currency in one of your games but spend it in another one that also uses that same currency. The possibilities are vast, but you must first learn how to create the currency. The following topics can get you started.

- [Coin Standard](https://docs.sui.io/standards/coin)
- [In-Game Currency](https://docs.sui.io/guides/developer/coin/in-game-token)

### Tokens [​](https://docs.sui.io/concepts/gaming\#tokens "Direct link to Tokens")

Similar to in-game currencies, tokens provide a level of engagement and control integrated into the game experience that isn't possible without Web3. For example, you can create tokens associated with your game that reward loyalty amongst your user base. You can also produce regulated tokens that allow the bearer of a specific capability to control the addresses that have access to the token, facilitating gated access to special events, leagues, or other game features. The following topics provide more insight into tokens on Sui.

- [Regulated Coin and Deny List](https://docs.sui.io/guides/developer/coin/regulated)
- [Loyalty Tokens](https://docs.sui.io/guides/developer/coin/loyalty)
- [Closed-Loop Token](https://docs.sui.io/standards/closed-loop-token)

### Game features [​](https://docs.sui.io/concepts/gaming\#game-features "Direct link to Game features")

NFTs are able to represent many traditional game features. For example, in-game objects, battle passes, rewards, skins, game cards or keys, and loot boxes are just a few of the features that you can create using NFTs on Sui. The following topics and sections provide more details.

- [Create a Non-Fungible Token](https://docs.sui.io/guides/developer/nft)
- [Soulbound assets](https://docs.sui.io/concepts/gaming#soulbound-assets)
- [Game economies](https://docs.sui.io/concepts/gaming#game-economies)
- [Sui Object Display](https://docs.sui.io/concepts/gaming#sui-object-display)

### Dynamic assets [​](https://docs.sui.io/concepts/gaming\#dynamic-assets "Direct link to Dynamic assets")

On Sui, everything is an object and all objects are NFTs. For the purpose of the gaming discussion, you can also think of these NFTs as game assets.

You can view an object on Sui as a key-value pair data structure. In Move, the smart contract language of Sui, objects are defined as a `struct`. As an example, consider the game board of a tic-tac-toe game:

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

The first key-value pair for any object is `id: address`, which is a unique value of type `UID`. Every object has a different address, which is why every object is an NFT because this mandatory key-value pair sets each object apart and makes it unique.

#### Creating assets [​](https://docs.sui.io/concepts/gaming\#creating-assets "Direct link to Creating assets")

Smart contracts contain the functions that create objects. Using the previous example, the function ( `new`) that creates the object represented (a digital tic-tac-toe gameboard) provides the values for each attribute. The Sui framework creates the UID that uniquely identifies this particular game.

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

This is an on-chain action, or transaction. In this case, the transaction is a request to the chain to create an object. You provide the necessary data to the function and pay the gas fee for the computation effort of the network validators. The result is the creation of a new NFT that exists on the Sui blockchain at the address ( `id`).

#### Updating assets [​](https://docs.sui.io/concepts/gaming\#updating-assets "Direct link to Updating assets")

On Sui, you can update an NFT asset using a separate transaction, provided the smart contract that defines the NFT allows it. Similar to creation, you provide data to the relevant update function and pay the gas fee, and the smart contract updates the object at the correct address with the new information.

Using the tic-tac-toe example, you might instruct the smart contract to update the gameboard object to place an `x` on an available square. Because the computation effort required for most updates is less than the effort to create the original object, the resulting gas fees are typically less, as well.

For more information on the computation of gas fees, see [Sui Gas Pricing](https://docs.sui.io/concepts/tokenomics/gas-pricing).

#### Composing assets [​](https://docs.sui.io/concepts/gaming\#composing-assets "Direct link to Composing assets")

On Sui, you can include one object inside of another (dynamic fields). For example, an object named `Parent` might contain objects of type `Child`. The smart contract can provide the necessary functions to add and remove the child objects from their parents.

[examples/move/dynamic\_fields/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/dynamic_fields/sources/example.move)

```codeBlockLines_p187
public struct Parent has key {
    id: UID,
}

public struct Child has key, store {
    id: UID,
    count: u64,
}

```

The function to add child objects to a parent might resemble the following. In this case, `ofield` is an alias for the `sui::dynamic_object_field` package.

[examples/move/dynamic\_fields/sources/example.move](https://github.com/MystenLabs/sui/tree/main/examples/move/dynamic_fields/sources/example.move)

```codeBlockLines_p187
public fun add_child(parent: &mut Parent, child: Child) {
    ofield::add(&mut parent.id, b"child", child);
}

```

You can apply dynamic fields to many use cases. An object named `TicketBooth`, for example, could contain objects of type `ConcertTicket`. An object of type `Car` might have a field named `is_functioning` that is `false` until all necessary objects ( `Engine`, `Tires`, `Body`, `Wheel`) are present, at which point it can automatically update its `is_functioning` field to `true`.

Composability is a really important feature of Sui. While it provides many options when developing an idea on Sui, it also allows building on top of existing projects, using third-party assets in your project. This can range from “ _Only users who own a particular NFT are eligible for a discount_” to full collaboration between two distinct projects and everything in between on the smart contract level.

#### Transfer to object [​](https://docs.sui.io/concepts/gaming\#transfer-to-object "Direct link to Transfer to object")

Sui enables more use cases with the transfer to object feature, which allows an owned object to be sent to another object (shared or owned). In this case, the sent object appears as owned by the parent object. In the above examples, the objects are wrapped inside other objects and this can be seen in the parent object's metadata when inspecting the parent object.

When an object is sent to another object, the metadata of the parent object remain the same, but its `id` has a new object. This feature can enable use cases such as on-chain wallets where a `Wallet` object is used to deposit other objects. Combining this with transfer to object can lead to complex and exciting use cases.

See [Transfer to Object](https://docs.sui.io/concepts/transfers/transfer-to-object) for more details on how to effectively transfer objects to other objects on Sui.

#### Deleting assets [​](https://docs.sui.io/concepts/gaming\#deleting-assets "Direct link to Deleting assets")

On Sui, you can delete an object if the smart contract allows the operation. If the correct smart contract function is present, then you can delete the object in a single transaction. This results in a gas-fee rebate, which happens whenever bytes are freed on chain. The transaction's gas payer receives a rebate to account for the future storage of the object no longer being necessary but having already been paid for. See the [Storage fund](https://docs.sui.io/concepts/tokenomics#storage-fund) section in Tokenomics to learn more about rebates.

### Soulbound assets [​](https://docs.sui.io/concepts/gaming\#soulbound-assets "Direct link to Soulbound assets")

A soulbound asset is an NFT that belongs to an address and cannot be transferred or deleted. On Sui, assets are usually freely transferable between addresses, but this is undesirable behavior in some cases.

Assets such as game season passes, loyalty accrual assets, avatars, identification assets for a product, and assets that grant certain privileges at the smart contract level are well-suited to be bound to an address without the option of transfer or deletion.

On Sui, it is straightforward to implement such an asset, and the infrastructure guarantees that the desired behavior always holds.

You define an NFT asset as soulbound at the contract level. After designated as soulbound, it cannot be converted to a normal transferable asset. Changing it would require creating a new asset with the same name and a migration strategy, such as deleting the soulbound asset and creating a normal one to take its place.

Soulbound assets are created by omitting the `store` ability. Without this ability, you cannot store soulbound assets inside other objects. Keep this behavior in mind when deciding the asset type. This means that Soulbound assets are not fully composable; they can store other assets but cannot be stored inside other assets.

The same pattern can be used to implement NFT assets that are transferable/burnable only under certain circumstances. You can define these circumstances at the smart contract level by making the asset soulbound and defining custom transfer and burn functions.

### Sui Object Display [​](https://docs.sui.io/concepts/gaming\#sui-object-display "Direct link to Sui Object Display")

The Sui Object Display standard is a tool that helps define how objects appear in apps and interfaces. It works like a template where you can insert data from an object to control how it's displayed. Use it to manage how different types of data are shown, even if the data itself is stored on chain while the display happens off chain (in apps or websites).

The Sui Object Display standard provides several key benefits and components:

- Controlled representation: Manages how assets are displayed online without directly interacting with the underlying asset. You can make updates to the display independent of the assets and affect how all assets of type `<T>` are displayed.
- Flexibility: No limits on the fields you can customize.
- Enhancing asset information: Similar to enhancing ERC721 or ERC1155 NFTs with extra details, the Sui Object Display allows you to add specific details to your digital items, such as names, descriptions, images, and more.
- Stored data and off-chain representation: Manages stored data based on metadata standards and controls how it's represented off chain.
- Dynamic display: Ensures a uniform presentation of shared attributes across all NFTs of type `<T>`, maintaining a consistent representation of common fields (such as image URLs derived from unique IDs) and a cohesive display format across the asset collection.

There are a few limitations to be aware of. First, the current structure of Sui Object Display is per type, limiting its scope. Secondly, its structure does not allow for nested attributes or enums.

#### Implementation overview [​](https://docs.sui.io/concepts/gaming\#implementation-overview "Direct link to Implementation overview")

At a high level, you implement this feature using the following steps:

1. Use a `Publisher` object you own to set `sui::display` for a specific type.
2. Sui Move's `Display<T>` defines how different types look. For example, `Display<0x2::capy::Capy>` shapes the appearance of a type.
3. Sui Full nodes use Display definitions to organize data when requested with `{ showDisplay: true }` in queries.

A display is a map of keys and values, both strings. Values allow for string interpolation, meaning the value changes dynamically depending on the NFT being viewed.

A basic example is to create a `Display` for `Asset` objects:

```codeBlockLines_p187
public struct Asset has key, store {
  id: "0x3301",
  expiration: 123456789
}

public struct Display has store {
  "random_field": "The id is {id} and it expires at {expiration}"
}

```

The above `Display` as is defined, for the example `Asset` will become:

```codeBlockLines_p187
Display
{
  "random_field": "The id is 0x3301 and it expires at 123456789"
}

```

For another Asset, the `id` and `expiration` values change according to the new `Asset` s values.

An app can use the `Display` object, where any custom keys can be understood. By default, most third-party apps like explorers or wallets recognize the attributes described below.

- `name`: A name for the object, displayed when users view the object.
- `description`: A description for the object, displayed when users view the object.
- `link`: A link to the object for use in an application.
- `image_url`: A URL or a blob with the image for the object.
- `thumbnail_url`: A URL to a smaller image for use in wallets, explorers, and other products as a preview.
- `project_url`: A link to a website associated with the object or creator.
- `creator`: A string indicating the object creator.

See [Sui Object Display](https://docs.sui.io/standards/display) for more details on the standard.

## Game economies [​](https://docs.sui.io/concepts/gaming\#game-economies "Direct link to Game economies")

Designing and managing tokens and coins on the Sui blockchain is crucial to creating a viable game economy.

### GameFi [​](https://docs.sui.io/concepts/gaming\#gamefi "Direct link to GameFi")

GameFi (Gaming Finance) combines gaming with blockchain-based financial incentives. It provides players with economic benefits through token rewards for in-game achievements. The recent rise of GameFi has led to significant growth in token launches to support gaming ecosystems.

The terms that follow are frequently used when discussing GameFi, so it's important to make sure your definition of the terms match the documentation.

- Token generation event (TGE): The first creation and distribution of tokens.
- Initial coin offering (ICO): An early fundraising model using token sales.
- Vesting: The gradual release of tokens over time.
- Staking: Locking tokens to participate in network operations and earn rewards.
- Cliff: An initial waiting period before token vesting begins.
- Annual percentage yield (APY): The effective return on a staked asset over a year.
- Decentralized autonomous organization (DAO): A governance model where decisions are made using smart contracts and tokens.
- Governance token: A token granting voting power in decentralized networks.

### Token economics (Tokenomics) [​](https://docs.sui.io/concepts/gaming\#token-economics-tokenomics "Direct link to Token economics (Tokenomics)")

Tokenomics refers to the model and design of the rules that govern tokens for a Web3 ecosystem. In the case of GameFi, it defines how a token is created, distributed, utilized, and maintained within your gaming platform. Some of the features that comprise a token's economics include supply details, distribution mechanisms, staking and vesting.

There are several types of token supply that are considered when discussing tokenomics for an on-chain ecosystem.

| Supply type | Description |
| --- | --- |
| Total supply | Maximum number of tokens that will ever exist. |
| Circulating supply | Tokens currently in use and available for trading. |
| Adjusted supply | Tokens adjusted after burning or minting events. |
| Fixed supply | A predetermined number of tokens with no future changes. |

There is more than one type of distribution mechanics, but they are not necessarily all used.

| Distribution mechanisms | Description |
| --- | --- |
| Initial distribution | Through ICO, TGE, airdrops, or private sales. |
| Ongoing distribution | Through staking, liquidity mining, or incentive programs. |

Ongoing distribution refers to staking and vesting of GameFi tokens. Not all game economies include staking or vesting models. When deciding whether yours should, consider the benefits:

- Encourages long-term participation.
- Reduces circulating supply, potentially stabilizing token prices.
- Rewards active participants in the ecosystem.
- Rewards team members over the course of their involvement.

To learn more about token vesting strategies, see [Token Vesting Strategies](https://docs.sui.io/concepts/tokenomics/vesting-strategies).

When deciding how best to launch your tokens, it's important to consider some key points:

- Should you go with a fixed or adjusted supply of coins? A fixed supply means all tokens mint at the TGE. Adjusted supply requires careful control over minting and burning functions.
- Does your token need to be regulated? A regulated coin provides greater control over who has access to your token but comes at the cost of additional maintenance of a deny list. You can learn more about regulated tokens at [Regulated Coin and Deny List](https://docs.sui.io/guides/developer/coin/regulated).
- Consider your metadata requirements, as well.
  - Decimal places: Predefine precision of the token.
  - Metadata management: Determine if metadata should be immutable.
  - Burning mechanisms: Define rules for token burning.

### Kiosk [​](https://docs.sui.io/concepts/gaming\#kiosk "Direct link to Kiosk")

On Sui, owned objects are either freely transferable or non-transferable. To ensure royalties, Sui provides a standard called Kiosk. A kiosk is a shared object that restricts access to a single address or user. See [Sui Kiosk](https://docs.sui.io/standards/kiosk) for an in-depth look at the Kiosk standard.

The kiosk "owner" (although a shared object has no owner from the perspective of Sui, the smart contract ensures that only one address is permitted to access it) is allowed to:

- Place Assets from their address inside the Kiosk.
- Take Assets from the Kiosk back to their address.
- Lock Assets from their address or already placed inside the Kiosk, making the “take” operation impossible.
- Destroy a Kiosk that has no Assets inside.
- List an Asset for sale with a price denoted in SUI.
- List an Asset for sale only to a specific address, with the price denoted in SUI.

Any other address is allowed to:

- Buy an item that has undergone the “list” operation.
- Buy an item meant for a specific address if the asset was “listed” in such a way.

The adoption of Kiosks implies that marketplaces become aggregators of “listed” items inside different Kiosks.

An Asset that has undergone the “lock” operation cannot undergo the “take” operation anymore; it can only undergo the “list” operation.

### Transfer Policy [​](https://docs.sui.io/concepts/gaming\#transfer-policy "Direct link to Transfer Policy")

The “buy” operation requires the use of another Object called Transfer Policy. This is usually a Shared Object and contains Rules that govern the “buy” operation, the most common Rule being “Royalties.”

A “buy” operation cannot be completed for an Asset without a defined Transfer Policy.

An empty Transfer Policy, one that does not have Rules, means that the Asset is freely tradable. Since Kiosk only allows the “list” and “buy” pair of operations, a transfer is possible by setting the price to 0 SUI.

Rules can be anything programmable with Move. To use marketplaces, an Asset creator should use Rules defined in [https://github.com/MystenLabs/apps/tree/main/kiosk/sources/rules](https://github.com/MystenLabs/apps/tree/main/kiosk/sources/rules)

Common Rules include:

- **Royalty Rule:** A percentage of the price that goes to the Asset creator (practically it goes inside the Transfer Policy and the creator may transfer it at any point in time).
- **Floor Price Rule:** A minimum price that an Asset may be “listed” for.
- **Lock Rule:** Enforce the Asset to be locked inside a Kiosk after a “buy” operation.

The combination of the Lock Rule and the Royalty Rule enforces royalties to be paid to the creator. The Lock Rule ensures an Asset cannot be “taken” out of a Kiosk (to be freely traded), while the Royalty Rule ensures that any Asset traded through Kiosk will have royalties deducted from the transaction.

Adding the Lock Rule is recommended when royalties are a strict requirement. As long as marketplaces support only Kiosk on Sui, even without the Lock Rule, users may not have other options. It is safe to assume that peer-to-peer trading is unsafe, and most, if not all, users will avoid it since there is no way to ensure the transaction will take place smoothly. In peer-to-peer transactions, someone has to initiate either the Asset transfer or the payment transfer, and there are no guarantees that the follow-up will take place.

The most important thing is during the initial airdrop or minting of the asset to ensure the Asset is put inside a Kiosk and not sent to an address directly.

## Tools [​](https://docs.sui.io/concepts/gaming\#tools "Direct link to Tools")

There are a number of tools available in the Sui ecosystem to help you realize your Sui game vision.

- Playtron GameOS
- E4C: Ludus
- Sui Coins
- Beamable
- Forge.gg
- Snag Solutions
- Venly

Playtron GameOS is a Linux-based operating system that seeks to turn PCs, handhelds, and desktops into dedicated gaming consoles. It supports multiple game stores like Steam and Epic Games, offering a seamless gaming experience across devices such as Steam Deck, ROG Ally, and Lenovo Legion Go.

[https://www.playtron.one/playtron-os](https://www.playtron.one/playtron-os)

## Videos [​](https://docs.sui.io/concepts/gaming\#videos "Direct link to Videos")

Cycle through the available videos using the thumbnails, then tap or click the video to play.

![carousel-thumb-0](https://img.youtube.com/vi/qnnXCO5cXu4/maxresdefault.jpg)![carousel-thumb-1](https://img.youtube.com/vi/h-csO8Z9g3o/maxresdefault.jpg)![carousel-thumb-2](https://img.youtube.com/vi/uwtF8jFXX1U/maxresdefault.jpg)![carousel-thumb-3](https://img.youtube.com/vi/OBNbxqoLPiw/maxresdefault.jpg)![carousel-thumb-4](https://img.youtube.com/vi/udzx0vXEpjc/maxresdefault.jpg)![carousel-thumb-5](https://img.youtube.com/vi/6mjj3isfrs0/maxresdefault.jpg)![carousel-thumb-6](https://img.youtube.com/vi/K2ufEN6zzpM/maxresdefault.jpg)![carousel-thumb-7](https://img.youtube.com/vi/P70R_p0xQEg/maxresdefault.jpg)![carousel-thumb-8](https://img.youtube.com/vi/e4FWIupRehA/maxresdefault.jpg)

## Example integrations [​](https://docs.sui.io/concepts/gaming\#example-integrations "Direct link to Example integrations")

There aren't real-world implementations for the integrations described in this section. These examples are meant to be a thought exercise to showcase the possibilities for viable game integration on the Sui network.

- ShadowQuest
- Sui for Speed
- ArcaneBattles

ShadowQuest is a multiplayer game that combines fantasy with RPG battle mechanics. To enhance the gaming experience with Web3 technologies, ShadowQuest is integrating with Sui offering seamless blockchain interactions to players without compromising the overall gaming experience.

**Seamless player onboarding and wallet integration**

ShadowQuest wants to onboard players without adding complexity, especially those unfamiliar with Web3. By using [zkLogin](https://docs.sui.io/concepts/cryptography/zklogin), users can sign in using social platforms like Google, Facebook, Twitch, and Apple. This automatically creates a Sui wallet linked to their ShadowQuest account, making blockchain interactions seamless.

**Simplified transaction handling**

Players in ShadowQuest earn or use in-game assets such as NFTs or $SHADOW tokens. To attract users unfamiliar with Web3, ShadowQuest manages game transactions to avoid Web3 friction, like wallets popping up for signing transactions. By sponsoring user transactions, the friction is minimized because ShadowQuest users do not directly pay for transaction costs and gas fees.

Enoki transactions can be signed without requiring confirmation from the user to approve the transaction.

ShadowQuest uses Enoki Gas Pool to sponsor transactions, covering gas fees for players. This ensures all in-game transactions are seamless and cost-free for players, providing a better user experience.

**NFT marketplace and royalty enforcement**

ShadowQuest allows players to buy, sell, or trade in-game items, such as weapons, armor, and cosmetics. The items should respect royalties to ensure that creators benefit from each transaction.

Kiosk provides a decentralized marketplace solution, ensuring royalties are enforced on all NFT trades. This helps both the game developers and creators maintain control over secondary sales, ensuring revenue generation throughout the asset's lifecycle.

**NFT usage for game access**

ShadowQuest uses NFTs as entry tickets for different game modes and events. Players can acquire or earn various Runes, which grant access to specific game challenges or seasonal competitions. These NFTs cannot be traded or transferred to other players.

Soulbound NFTs represent different Runes that are either earned through gameplay or purchased. These NFTs grant exclusive access to matches and seasonal challenges but cannot be traded after bound to a player.

## Related links [​](https://docs.sui.io/concepts/gaming\#related-links "Direct link to Related links")

- [Coin Standard](https://docs.sui.io/standards/coin): The Sui Coin standard enables you to create a broad range of fungible tokens on the Sui network to satisfy a number of use cases. The Coin standed on Sui is equivalent to the ERC-20 technical standard on Ethereum.
- [Create Coins and Tokens](https://docs.sui.io/guides/developer/coin): Learn how to mint coins and tokens on the Sui network.
- [Create a Non-Fungible Token](https://docs.sui.io/guides/developer/nft): On Sui, everything is an object. Moreover, everything is a non-fungible token (NFT) as its objects are unique, non-fungible, and owned.
- [Asset Tokenization](https://docs.sui.io/guides/developer/nft/asset-tokenization): Learn how to tokenize assets on the Sui blockchain. Asset tokenization refers to the process of representing real-world assets, such as real estate, art, commodities, stocks, or other valuable assets, as digital tokens on the blockchain network.
- [NFT Rental Example](https://docs.sui.io/guides/developer/nft/nft-rental): An example using the Kiosk Apps standard that provides the ability for users to rent NFTs according to the rules of a provided policy instead of outright owning them. This approach closely aligns with the ERC-4907 renting standard, making it a suitable choice for Solidity-based use cases intended for implementation on Sui.
- [Kiosk](https://docs.sui.io/standards/kiosk): Kiosk is a decentralized system for commerce applications on Sui. Kiosk is a part of the Sui framework, native to the system, and available to everyone.
- [Kiosk Apps](https://docs.sui.io/standards/kiosk-apps): Kiosk apps are a way to extend the functionality of Sui Kiosk while keeping the core functionality intact. You can develop apps to add new features to a kiosk without having to modify the core code or move the assets elsewhere.
- [zkLogin](https://docs.sui.io/concepts/cryptography/zklogin): zkLogin is a Sui primitive that enables you to send transactions from a Sui address using an OAuth credential, without publicly linking the two.
- [Sui Foundation blog](https://blog.sui.io/tag/gaming/): Blog posts from the Sui Foundation with the `gaming` tag.
- Guides for example games
  - [Coin Flip](https://docs.sui.io/guides/developer/app-examples/coin-flip): Learn Sui through a coin flip dApp that covers the full end-to-end flow of building a Sui Move module and connecting it to a React Sui dApp.
  - [Blackjack](https://docs.sui.io/guides/developer/app-examples/blackjack): Learn Sui using an example implementation of the popular casino game blackjack.
  - [Plinko](https://docs.sui.io/guides/developer/app-examples/plinko): Learn Sui through an example implementation of the popular casino game, Plinko.
- [Mysticon Legends](https://github.com/MystenLabs/mysticon-legends) repo on GitHub: A blockchain-based game where players collect, train, and battle with mythical creatures called Mysticons.
- [Web3 Mini Games built on Sui](https://mini-games.sui.io/): A collection of mini games, to inspire the community of Sui.

- [Representing in-game objects on chain](https://docs.sui.io/concepts/gaming#representing-in-game-objects-on-chain)
  - [In-game currencies](https://docs.sui.io/concepts/gaming#in-game-currencies)
  - [Tokens](https://docs.sui.io/concepts/gaming#tokens)
  - [Game features](https://docs.sui.io/concepts/gaming#game-features)
  - [Dynamic assets](https://docs.sui.io/concepts/gaming#dynamic-assets)
  - [Soulbound assets](https://docs.sui.io/concepts/gaming#soulbound-assets)
  - [Sui Object Display](https://docs.sui.io/concepts/gaming#sui-object-display)
- [Game economies](https://docs.sui.io/concepts/gaming#game-economies)
  - [GameFi](https://docs.sui.io/concepts/gaming#gamefi)
  - [Token economics (Tokenomics)](https://docs.sui.io/concepts/gaming#token-economics-tokenomics)
  - [Kiosk](https://docs.sui.io/concepts/gaming#kiosk)
  - [Transfer Policy](https://docs.sui.io/concepts/gaming#transfer-policy)
- [Tools](https://docs.sui.io/concepts/gaming#tools)
- [Videos](https://docs.sui.io/concepts/gaming#videos)
- [Example integrations](https://docs.sui.io/concepts/gaming#example-integrations)
- [Related links](https://docs.sui.io/concepts/gaming#related-links)