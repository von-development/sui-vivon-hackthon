# https://docs.sui.io/guides/developer/getting-started/sui-install

[Skip to main content](https://docs.sui.io/guides/developer/getting-started/sui-install#__docusaurus_skipToContent_fallback)

On this page

The quickest way to install Sui is using the binaries delivered with every release. If you require more control over the install process, you can install from source. To take advantage of containerization, you can utilize the Docker images in the `docker` folder of the sui repository.

## Supported operating systems [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#supported-operating-systems "Direct link to Supported operating systems")

Sui supports the following operating systems:

- Linux - Ubuntu version 22.04 (Jammy Jellyfish) or later
  - The [`sui-node` binary from AWS](https://docs.sui.io/guides/developer/getting-started/sui-install#aws-sui-node) supports only version 22.04
- macOS - macOS Monterey or later
- Microsoft Windows - Windows 10 and 11

Fastest method

## Quick install using Homebrew, Chocolatey, or suiup [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#install-homebrew "Direct link to Quick install using Homebrew, Chocolatey, or suiup")

Use one of the following commands for [Homebrew](https://brew.sh/) (MacOS, Linux, or Windows Subsystem for Linux), [Chocolatey](https://chocolatey.org/) (Windows), or [suiup](https://github.com/MystenLabs/suiup) (a custom installer and version manager for Sui related tools) to install Sui.

- Homebrew
- Chocolatey
- suiup (experimental)

```codeBlockLines_p187
$ brew install sui

```

note

If you use this method to install Sui, you are all set. The quick install is suitable for most use cases. The remaining installation methods are for those wanting more control over the installation process.

## Download binaries from GitHub [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#install-binaries "Direct link to Download binaries from GitHub")

Each Sui release provides a set of binaries for several operating systems. You can download these binaries from GitHub and use them to install Sui.

- Linux
- macOS
- Windows

1. Go to [https://github.com/MystenLabs/sui](https://github.com/MystenLabs/sui).

2. In the right pane, find the **Releases** section.

![Sui releases in GitHub](https://docs.sui.io/assets/images/releases-508571c4e1b0f73222ac83d4bb30a4c2.png)

3. Click the release tagged **Latest** to open the release's page.

4. In the **Assets** section of the release, select the .tgz compressed file that corresponds to your operating system.

5. Extract all files from the .tgz file into the preferred location on your system. These instructions assume you extract the files into a `sui` folder at the user root of your system for demonstration purposes. Replace references to this location in subsequent steps if you choose a different directory.

6. Navigate to the expanded folder. You should have the following extracted files:



| Name | Description |
| --- | --- |
| `move-analyzer` | Language Server Protocol implementation. |
| `sui` | Main Sui binary. |
| `sui-bridge` | Sui native bridge. |
| `sui-data-ingestion` | Capture Full node data for indexer to store in a database. |
| `sui-faucet` | Local faucet to mint coins on local network. |
| `sui-graphql-rpc` | GraphQL service for Sui RPC. |
| `sui-node` | Run a local node. |
| `sui-test-validator` | Run test validators on a local network for development. |
| `sui-tool` | Provides utilities for Sui. |

7. Add the folder containing the extracted files to your `PATH` variable. To do so, you can update your `~/.bashrc` to include the location of the Sui binaries. If using the suggested location, you type `export PATH=$PATH:~/sui` and press Enter.

8. Start a new terminal session or type `source ~/.bashrc` to load the new `PATH` value.


info

Running binaries other than `sui` might require installing prerequisites itemized in the following section.

#### Confirm the installation [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#confirm-the-installation "Direct link to Confirm the installation")

To confirm that Sui installed correctly, type `sui --version` in your console or terminal and press Enter. The response should provide the Sui version installed. If the console or terminal responds with a command not found error, make sure the full path to your Sui binaries is included in your `PATH` variable.

## Install from Cargo [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#install-sui-binaries-from-source "Direct link to Install from Cargo")

Run the following command to install Sui binaries from the `testnet` branch:

```codeBlockLines_p187
$ cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui --features tracing

```

Enabling the `tracing` feature is important as it adds Move test coverage and debugger support in the Sui CLI. Without it these two features will not be able to be used.

The install process can take a while to complete. You can monitor installation progress in the terminal. If you encounter an error, make sure to install the latest version of all prerequisites and then try the command again.

To update to the latest stable version of Rust:

```codeBlockLines_p187
$ rustup update stable

```

The command installs Sui components in the `~/.cargo/bin` folder.

## Upgrade from Cargo [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#upgrade-from-cargo "Direct link to Upgrade from Cargo")

If you previously installed the Sui binaries, you can update them to the most recent release with the same command you used to install them (changing `testnet` to the desired branch):

```codeBlockLines_p187
$ cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui --features tracing

```

The `tracing` feature is important as it adds Move test coverage and debugger support in the Sui CLI. Unless it is enabled you will not be able to use these two features.

## Install `sui-node` for Ubuntu from AWS [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#aws-sui-node "Direct link to aws-sui-node")

The `sui-node` binaries for Ubuntu 22.04 are available for download from AWS. You can use either the commit sha or version tag in the URL to retrieve the specific version of Sui you want. Use one of these values to construct the AWS download URL.

The URL is in the form `https://sui-releases.s3-accelerate.amazonaws.com/<SHA-OR-TAG>/sui-node`, where you replace `<SHA-OR-TAG>` with the proper value. For example, the URL is `https://sui-releases.s3-accelerate.amazonaws.com/00544a588bb71c395d49d91f756e8bfe96067eca/sui-node` to download the release with the relevant commit sha. If you visit the URL using a browser, the binary downloads automatically.

After downloading, open a console to the file's location and change its permission to `755`.

```codeBlockLines_p187
$ chmod 755 sui-node

```

Add the file's location to your PATH variable if it's directory is not already included. Follow the steps in [Sui Full Node Configuration](https://docs.sui.io/guides/operator/sui-full-node) to complete the setup.

## Build from source [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#build-from-source "Direct link to Build from source")

Follow the instructions in this topic to install the Rust crates (packages) required to interact with Sui networks, including the Sui CLI.

To install Sui from source, you first need to install its [prerequisites](https://docs.sui.io/guides/developer/getting-started/sui-install#prerequisites) for your operating system. After installing the supporting technologies, you can install [Sui binaries from source](https://docs.sui.io/guides/developer/getting-started/sui-install#install-sui-binaries-from-source).

You can also download the [source code](https://docs.sui.io/references/contribute/sui-environment) to have local access to files.

#### Prerequisites [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#prerequisites "Direct link to Prerequisites")

Your system needs the following prerequisites available to successfully install Sui.

#### Rust and Cargo [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#rust-and-cargo "Direct link to Rust and Cargo")

Sui requires Rust and Cargo (Rust's package manager) on all supported operating systems. The suggested method to install Rust is with `rustup` using cURL.

Some other commands in the installation instructions also require cURL to run. If you can't run the cURL command to install Rust, see the instructions to install cURL for your operating system in the following section before you install Rust.

Use the following command to install Rust and Cargo on macOS or Linux:

```codeBlockLines_p187
$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

```

If you use Windows 11, see information about using the [Rust installer](https://www.rust-lang.org/tools/install) on the Rust website. The installer checks for C++ build tools and prompts you to install them if necessary. Select the option that best defines your environment and follow the instructions in the install wizard.

For additional installation options, see [Install Rust](https://www.rust-lang.org/tools/install).

Sui uses the latest version of Cargo to build and manage dependencies. See the [Cargo installation](https://doc.rust-lang.org/cargo/getting-started/installation.html) page on the Rust website for more information.

Use the following command to update Rust with `rustup`:

```codeBlockLines_p187
$ rustup update stable

```

#### Additional prerequisites by operating system [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#additional-prerequisites-by-operating-system "Direct link to Additional prerequisites by operating system")

Select the appropriate tab to view the requirements for your system.

- Linux
- macOS
- Windows

The prerequisites needed for the Linux operating system include:

- cURL
- Rust and Cargo
- Git CLI
- CMake
- GCC
- libssl-dev
- libclang-dev
- libpq-dev (optional)
- build-essential

info

The Linux instructions assume a distribution that uses the APT package manager. You might need to adjust the instructions to use other package managers.

Install the prerequisites listed in this section. Use the following command to update `apt-get`:

```codeBlockLines_p187
$ sudo apt-get update

```

#### All Linux prerequisites [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#all-linux-prerequisites "Direct link to All Linux prerequisites")

Reference the relevant sections that follow to install each prerequisite individually, or run the following to install them all at once:

```codeBlockLines_p187
$ sudo apt-get install curl git-all cmake gcc libssl-dev pkg-config libclang-dev libpq-dev build-essential

```

#### cURL [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#curl "Direct link to cURL")

Install cURL with the following command:

```codeBlockLines_p187
$ sudo apt-get install curl

```

Verify that cURL installed correctly with the following command:

```codeBlockLines_p187
$ curl --version

```

#### Git CLI [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#git-cli "Direct link to Git CLI")

Run the following command to install Git, including the [Git CLI](https://cli.github.com/):

```codeBlockLines_p187
$ sudo apt-get install git-all

```

For more information, see [Install Git on Linux](https://github.com/git-guides/install-git#install-git-on-linux) on the GitHub website.

#### CMake [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#cmake "Direct link to CMake")

Use the following command to install CMake.

```codeBlockLines_p187
$ sudo apt-get install cmake

```

To customize the installation, see [Installing CMake](https://cmake.org/install/) on the CMake website.

#### GCC [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#gcc "Direct link to GCC")

Use the following command to install the GNU Compiler Collection, `gcc`:

```codeBlockLines_p187
$ sudo apt-get install gcc

```

#### libssl-dev [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#libssl-dev "Direct link to libssl-dev")

Use the following command to install `libssl-dev`:

```codeBlockLines_p187
$ sudo apt-get install libssl-dev

```

If the version of Linux you use doesn't support `libssl-dev`, find an equivalent package for it on the [ROS Index](https://index.ros.org/d/libssl-dev/).

(Optional) If you have OpenSSL you might also need to also install `pkg-config`:

```codeBlockLines_p187
$ sudo apt-get install pkg-config

```

#### libclang-dev [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#libclang-dev "Direct link to libclang-dev")

Use the following command to install `libclang-dev`:

```codeBlockLines_p187
$ sudo apt-get install libclang-dev

```

If the version of Linux you use doesn't support `libclang-dev`, find an equivalent package for it on the [ROS Index](https://index.ros.org/d/libclang-dev/).

#### libpq-dev (optional) [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#libpq-dev "Direct link to libpq-dev (optional)")

info

You need `libpq-dev` only if you plan to use the `--with-indexer` and `--with-graphql` options with `sui start`. See [Local Network](https://docs.sui.io/guides/developer/getting-started/local-network#start-the-local-network) for more information.

Use the following command to install `libpq-dev`:

```codeBlockLines_p187
$ sudo apt-get install libpq-dev

```

If the version of Linux you use doesn't support `libpq-dev`, find an equivalent package for it on the [ROS Index](https://index.ros.org/d/libpq-dev/).

#### build-essential [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#build-essential "Direct link to build-essential")

Use the following command to install `build-essential`:

```codeBlockLines_p187
$ sudo apt-get install build-essential

```

## Using Sui from command line [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#using-sui-from-command-line "Direct link to Using Sui from command line")

With Sui installed, you can interact with Sui networks using the Sui CLI. For more details, see the [Sui CLI](https://docs.sui.io/references/cli) reference.

## Installing Sui developer tools [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#installing-sui-developer-tools "Direct link to Installing Sui developer tools")

If you use VSCode, you can install the [Move extension](https://marketplace.visualstudio.com/items?itemName=mysten.move) to get language server support for Move, as well as support for building, testing, and debugging Move code within the IDE.
You can install the extension either by searching the fully-qualified extension name, `Mysten.move`, in the extension view, or by pressing `Ctrl-P` or `Cmd-P` and typing `ext install mysten.move`.
Installing the Move extension also installs the appropriate `move-analyzer` binary for your operating system, as well as the [Move Trace Debugger](https://marketplace.visualstudio.com/items?itemName=mysten.move-trace-debug) extension, and [Move Syntax](https://marketplace.visualstudio.com/items?itemName=damirka.move-syntax) extension.

There are also community Move packages for [Emacs](https://github.com/amnn/move-mode), [Vim](https://github.com/yanganto/move.vim), and [Zed](https://github.com/Tzal3x/move-zed-extension).

## Next steps [​](https://docs.sui.io/guides/developer/getting-started/sui-install\#next-steps "Direct link to Next steps")

Now that you have Sui installed, it's time to start developing. Check out the following topics to start working with Sui:

- Read about the [Sui CLI](https://docs.sui.io/references/cli), the most straightforward way to start exploring Sui networks.
- [Learn about the available networks](https://docs.sui.io/guides/developer/getting-started/connect) and connect to one.
- [Get some coins](https://docs.sui.io/guides/developer/getting-started/get-coins) on a development network.
- [Build your first dApp](https://docs.sui.io/guides/developer/first-app) to start your on-chain journey.

- [Supported operating systems](https://docs.sui.io/guides/developer/getting-started/sui-install#supported-operating-systems)
- [Quick install using Homebrew, Chocolatey, or suiup](https://docs.sui.io/guides/developer/getting-started/sui-install#install-homebrew)
- [Download binaries from GitHub](https://docs.sui.io/guides/developer/getting-started/sui-install#install-binaries)
- [Install from Cargo](https://docs.sui.io/guides/developer/getting-started/sui-install#install-sui-binaries-from-source)
- [Upgrade from Cargo](https://docs.sui.io/guides/developer/getting-started/sui-install#upgrade-from-cargo)
- [Install `sui-node` for Ubuntu from AWS](https://docs.sui.io/guides/developer/getting-started/sui-install#aws-sui-node)
- [Build from source](https://docs.sui.io/guides/developer/getting-started/sui-install#build-from-source)
- [Using Sui from command line](https://docs.sui.io/guides/developer/getting-started/sui-install#using-sui-from-command-line)
- [Installing Sui developer tools](https://docs.sui.io/guides/developer/getting-started/sui-install#installing-sui-developer-tools)
- [Next steps](https://docs.sui.io/guides/developer/getting-started/sui-install#next-steps)