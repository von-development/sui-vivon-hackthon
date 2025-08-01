[Skip to main content](https://docs.sui.io/guides/developer/first-app/client-tssdk#__docusaurus_skipToContent_fallback)

On this page

This exercise diverges from the example built in the previous topics in this section. Rather than adding a frontend to the running example, the instruction walks you through setting up dApp Kit in a React App, allowing you to connect to wallets, and query data from Sui RPC nodes to display in your app. You can use it to create your own frontend for the example used previously, but if you want to get a fully functional app up and running quickly, run the following command in a terminal or console to scaffold a new app with all steps in this exercise already implemented:

info

You must use the pnpm or yarn package managers to create Sui project scaffolds. Follow the [pnpm install](https://pnpm.io/installation) or [yarn install](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable) instructions, if needed.

```codeBlockLines_p187
$ pnpm create @mysten/dapp --template react-client-dapp

```

or

```codeBlockLines_p187
$ yarn create @mysten/dapp --template react-client-dapp

```

## What is the Sui TypeScript SDK? [​](https://docs.sui.io/guides/developer/first-app/client-tssdk\#what-is-the-sui-typescript-sdk "Direct link to What is the Sui TypeScript SDK?")

The Sui TypeScript SDK (@mysten/sui) provides all the low-level functionality needed to interact with Sui ecosystem from TypeScript. You can use it in any TypeScript or JavaScript project, including web apps, Node.js apps, or mobile apps written with tools like React Native that support TypeScript.

For more information on the Sui TypeScript SDK, see the [Sui TypeScript SDK documentation](https://sdk.mystenlabs.com/typescript).

## What is dApp Kit? [​](https://docs.sui.io/guides/developer/first-app/client-tssdk\#what-is-dapp-kit "Direct link to What is dApp Kit?")

dApp Kit (@mysten/dapp-kit) is a collection of React hooks, components, and utilities that make building dApps on Sui straightforward. For more information on dApp Kit, see the [dApp Kit documentation](https://sdk.mystenlabs.com/dapp-kit).

## Installing dependencies [​](https://docs.sui.io/guides/developer/first-app/client-tssdk\#installing-dependencies "Direct link to Installing dependencies")

To get started, you need a React app. The following steps apply to any React, so you can follow the same steps to add dApp Kit to an existing React app. If you are starting a new project, you can use Vite to scaffold a new React app.

Run the following command in your terminal or console, and select React as the framework, and then select one of the TypeScript templates:

- npm
- Yarn
- pnpm

```codeBlockLines_p187
$ npm init vite

```

Now that you have a React app, you can install the necessary dependencies to use dApp Kit:

- npm
- Yarn
- pnpm

```codeBlockLines_p187
$ npm install @mysten/sui @mysten/dapp-kit @tanstack/react-query

```

## Setting up Provider components [​](https://docs.sui.io/guides/developer/first-app/client-tssdk\#setting-up-provider-components "Direct link to Setting up Provider components")

To use all the features of dApp Kit, wrap your app with a couple of `Provider` components.

Open the root component that renders your app (the default location the Vite template uses is `src/main.tsx`) and integrate or replace the current code with the following.

The first `Provider` to set up is the `QueryClientProvider` from `@tanstack/react-query`. This `Provider` manages request state for various hooks in dApp kit. If you're already using `@tanstack/react-query`, dApp Kit can share the same `QueryClient` instance.

```codeBlockLines_p187
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</React.StrictMode>,
);

```

Next, set up the `SuiClientProvider`. This `Provider` delivers a `SuiClient` instance from `@mysten/sui` to all the hooks in dApp Kit. This provider manages which network dApp Kit connects to, and can accept configuration for multiple networks. This exercise connects to `devnet`.

```codeBlockLines_p187
import { SuiClientProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const networks = {
	devnet: { url: getFullnodeUrl('devnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networks} defaultNetwork="devnet">
				<App />
			</SuiClientProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);

```

Finally, set up the `WalletProvider` from `@mysten/dapp-kit`, and import styles for the `dapp-kit` components.

```codeBlockLines_p187
import '@mysten/dapp-kit/dist/index.css';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const networks = {
	devnet: { url: getFullnodeUrl('devnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networks} defaultNetwork="devnet">
				<WalletProvider>
					<App />
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);

```

## Connecting to a wallet [​](https://docs.sui.io/guides/developer/first-app/client-tssdk\#connecting-to-a-wallet "Direct link to Connecting to a wallet")

With all `Providers` set up, you can use dApp Kit hooks and components. To allow users to connect their wallets to your dApp, add a `ConnectButton`.

```codeBlockLines_p187
import { ConnectButton } from '@mysten/dapp-kit';

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<ConnectButton />
			</header>
		</div>
	);
}

```

The `ConnectButton` component displays a button that opens a modal on click, enabling the user to connect their wallet. Upon connection, it displays their address, and provides the option to disconnect.

## Getting the connected wallet address [​](https://docs.sui.io/guides/developer/first-app/client-tssdk\#getting-the-connected-wallet-address "Direct link to Getting the connected wallet address")

Now that you have a way for users to connect their wallets, you can start using the `useCurrentAccount` hook to get details about the connected wallet account.

```codeBlockLines_p187
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<ConnectButton />
			</header>

			<ConnectedAccount />
		</div>
	);
}

function ConnectedAccount() {
	const account = useCurrentAccount();

	if (!account) {
		return null;
	}

	return <div>Connected to {account.address}</div>;
}

```

## Querying data from Sui RPC nodes [​](https://docs.sui.io/guides/developer/first-app/client-tssdk\#querying-data-from-sui-rpc-nodes "Direct link to Querying data from Sui RPC nodes")

Now that you have the account to connect to, you can query for objects the connected account owns:

```codeBlockLines_p187
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';

function ConnectedAccount() {
	const account = useCurrentAccount();

	if (!account) {
		return null;
	}

	return (
		<div>
			<div>Connected to {account.address}</div>;
			<OwnedObjects address={account.address} />
		</div>
	);
}

function OwnedObjects({ address }: { address: string }) {
	const { data } = useSuiClientQuery('getOwnedObjects', {
		owner: address,
	});
	if (!data) {
		return null;
	}

	return (
		<ul>
			{data.data.map((object) => (
				<li key={object.data?.objectId}>
					<a href={`https://example-explorer.com/object/${object.data?.objectId}`}>
						{object.data?.objectId}
					</a>
				</li>
			))}
		</ul>
	);
}

```

You now have a dApp connected to wallets and can query data from RPC nodes.

## Related links [​](https://docs.sui.io/guides/developer/first-app/client-tssdk\#related-links "Direct link to Related links")

The next step from here is to start interacting with Move modules, constructing transaction blocks, and making Move calls. This exercise continues in the Counter end-to-end example.

- [End-to-End Example](https://docs.sui.io/guides/developer/app-examples/e2e-counter): Continue this exercise by creating an app.
- [Sui 101](https://docs.sui.io/guides/developer/sui-101): Learn the basics of the Sui network and how to interact with on-chain objects using Move.
- [Sui Move CLI](https://docs.sui.io/references/cli/move): The `move` commands in the Sui CLI provide console or terminal interaction with the Move VM.

- [What is the Sui TypeScript SDK?](https://docs.sui.io/guides/developer/first-app/client-tssdk#what-is-the-sui-typescript-sdk)
- [What is dApp Kit?](https://docs.sui.io/guides/developer/first-app/client-tssdk#what-is-dapp-kit)
- [Installing dependencies](https://docs.sui.io/guides/developer/first-app/client-tssdk#installing-dependencies)
- [Setting up Provider components](https://docs.sui.io/guides/developer/first-app/client-tssdk#setting-up-provider-components)
- [Connecting to a wallet](https://docs.sui.io/guides/developer/first-app/client-tssdk#connecting-to-a-wallet)
- [Getting the connected wallet address](https://docs.sui.io/guides/developer/first-app/client-tssdk#getting-the-connected-wallet-address)
- [Querying data from Sui RPC nodes](https://docs.sui.io/guides/developer/first-app/client-tssdk#querying-data-from-sui-rpc-nodes)
- [Related links](https://docs.sui.io/guides/developer/first-app/client-tssdk#related-links)