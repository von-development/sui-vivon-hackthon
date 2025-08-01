# https://docs.sui.io/guides/developer/app-examples/weather-oracle

[Skip to main content](https://docs.sui.io/guides/developer/app-examples/weather-oracle#__docusaurus_skipToContent_fallback)

On this page

This guide demonstrates writing a module (smart contract) in Move, deploying it on Devnet, and adding a backend, which fetches the weather data from the OpenWeather API every 10 minutes and updates the weather conditions for each city. The dApp created in this guide is called Sui Weather Oracle and it provides real-time weather data for over 1,000 locations around the world.

You can access and use the weather data from the OpenWeather API for various applications, such as randomness, betting, gaming, insurance, travel, education, or research. You can also mint a weather NFT based on the weather data of a city, using the `mint` function of the SUI Weather Oracle smart contract.

This guide assumes you have [installed Sui](https://docs.sui.io/guides/developer/getting-started/sui-install) and understand Sui fundamentals.

## Move smart contract [​](https://docs.sui.io/guides/developer/app-examples/weather-oracle\#move-smart-contract "Direct link to Move smart contract")

As with all Sui dApps, a Move package on chain powers the logic of Sui Weather Oracle. The following instruction walks you through creating and publishing the module.

### Weather Oracle module [​](https://docs.sui.io/guides/developer/app-examples/weather-oracle\#weather-oracle-module "Direct link to Weather Oracle module")

Before you get started, you must initialize a Move package. Open a terminal or console in the directory you want to store the example and run the following command to create an empty package with the name `weather_oracle`:

```codeBlockLines_p187
$ sui move new weather_oracle

```

With that done, it's time to jump into some code. Create a new file in the `sources` directory with the name `weather.move` and populate the file with the following code:

[weather.move](https://github.com/MystenLabs/sui/tree/main/weather.move)

```codeBlockLines_p187
// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module oracle::weather {
    use std::string::String;
    use sui::dynamic_object_field as dof;
    use sui::package;
}

```

There are few details to take note of in this code:

1. The fourth line declares the module name as `weather` within the package `oracle`.
2. Seven lines begin with the `use` keyword, which enables this module to use types and functions declared in other modules.

Next, add some more code to this module:

[weather.move](https://github.com/MystenLabs/sui/tree/main/weather.move)

```codeBlockLines_p187
/// Define a capability for the admin of the oracle.
public struct AdminCap has key, store { id: UID }

/// // Define a one-time witness to create the `Publisher` of the oracle.
public struct WEATHER has drop {}

// Define a struct for the weather oracle
public struct WeatherOracle has key {
    id: UID,
    /// The address of the oracle.
    address: address,
    /// The name of the oracle.
    name: String,
    /// The description of the oracle.
    description: String,
}

public struct CityWeatherOracle has key, store {
    id: UID,
    geoname_id: u32, // The unique identifier of the city
    name: String, // The name of the city
    country: String, // The country of the city
    latitude: u32, // The latitude of the city in degrees
    positive_latitude: bool, // Whether the latitude is positive (north) or negative (south)
    longitude: u32, // The longitude of the city in degrees
    positive_longitude: bool, // Whether the longitude is positive (east) or negative (west)
    weather_id: u16, // The weather condition code
    temp: u32, // The temperature in kelvin
    pressure: u32, // The atmospheric pressure in hPa
    humidity: u8, // The humidity percentage
    visibility: u16, // The visibility in meters
    wind_speed: u16, // The wind speed in meters per second
    wind_deg: u16, // The wind direction in degrees
    wind_gust: Option<u16>, // The wind gust in meters per second (optional)
    clouds: u8, // The cloudiness percentage
    dt: u32 // The timestamp of the weather update in seconds since epoch
}

fun init(otw: WEATHER, ctx: &mut TxContext) {
    package::claim_and_keep(otw, ctx); // Claim ownership of the one-time witness and keep it

    let cap = AdminCap { id: object::new(ctx) }; // Create a new admin capability object
    transfer::share_object(WeatherOracle {
        id: object::new(ctx),
        address: ctx.sender(),
        name: b"SuiMeteo".to_string(),
        description: b"A weather oracle.".to_string(),
    });
    transfer::public_transfer(cap, ctx.sender()); // Transfer the admin capability to the sender.
}

```

- The first struct, `AdminCap`, is a capability.
- The second struct, `WEATHER`, is a one-time witness that ensures only a single instance of this `Weather` ever exists. See [One Time Witness](https://move-book.com/programmability/one-time-witness.html) in The Move Book for more information.
- The `WeatherOracle` struct works as a registry and stores the `geoname_id` s of the `CityWeatherOracle` s as dynamic fields. See [The Move Book](https://move-book.com/programmability/dynamic-fields.html) to learn more about dynamic fields.
- The `init` function creates and sends the `Publisher` and `AdminCap` objects to the sender. Also, it creates a [shared object](https://docs.sui.io/concepts/object-ownership/shared) for all the `CityWeatherOracle` s. See [Module Initializer](https://move-book.com/programmability/module-initializer.html) in The Move Book for more information.

So far, you've set up the data structures within the module.
Now, create a function that initializes a `CityWeatherOracle` and adds it as dynamic fields to the `WeatherOracle` object:

[weather.move](https://github.com/MystenLabs/sui/tree/main/weather.move)

```codeBlockLines_p187
public fun add_city(
    _: &AdminCap, // The admin capability
    oracle: &mut WeatherOracle, // A mutable reference to the oracle object
    geoname_id: u32, // The unique identifier of the city
    name: String, // The name of the city
    country: String, // The country of the city
    latitude: u32, // The latitude of the city in degrees
    positive_latitude: bool, // The whether the latitude is positive (north) or negative (south)
    longitude: u32, // The longitude of the city in degrees
    positive_longitude: bool, // The whether the longitude is positive (east) or negative (west)
    ctx: &mut TxContext // A mutable reference to the transaction context
) {
    dof::add(&mut oracle.id, geoname_id, // Add a new dynamic object field to the oracle object with the geoname ID as the key and a new city weather oracle object as the value.
        CityWeatherOracle {
            id: object::new(ctx), // Assign a unique ID to the city weather oracle object
            geoname_id, // Set the geoname ID of the city weather oracle object
            name,  // Set the name of the city weather oracle object
            country,  // Set the country of the city weather oracle object
            latitude,  // Set the latitude of the city weather oracle object
            positive_latitude,  // Set whether the latitude is positive (north) or negative (south)
            longitude,  // Set the longitude of the city weather oracle object
            positive_longitude,  // Set whether the longitude is positive (east) or negative (west)
            weather_id: 0, // Initialize the weather condition code to be zero
            temp: 0, // Initialize the temperature to be zero
            pressure: 0, // Initialize the pressure to be zero
            humidity: 0, // Initialize the humidity to be zero
            visibility: 0, // Initialize the visibility to be zero
            wind_speed: 0, // Initialize the wind speed to be zero
            wind_deg: 0, // Initialize the wind direction to be zero
            wind_gust: option::none(), // Initialize the wind gust to be none
            clouds: 0, // Initialize the cloudiness to be zero
            dt: 0 // Initialize the timestamp to be zero
        }
    );
}

```

The `add_city` function is a public function that allows the owner of the `AdminCap` of the Sui Weather Oracle smart contract to add a new `CityWeatherOracle`. The function requires the admin to provide a capability object that proves their permission to add a city. The function also requires a mutable reference to the oracle object, which is the main object that stores the weather data on the blockchain. The function takes several parameters that describe the city, such as the geoname ID, name, country, latitude, longitude, and positive latitude and longitude. The function then creates a new city weather oracle object, which is a sub-object that stores and updates the weather data for a specific city. The function initializes the city weather oracle object with the parameters provided by the admin, and sets the weather data to be zero or none. The function then adds a new dynamic object field to the oracle object, using the geoname ID as the key and the city weather oracle object as the value. This way, the function adds a new city to the oracle, and makes it ready to receive and update the weather data from the backend service.

If you want to delete a city from the Sui Weather Oracle, call the `remove_city` function of the smart contract. The `remove_city` function allows the admin of the smart contract to remove a city from the oracle. The function requires the admin to provide a capability object that proves their permission to remove a city. The function also requires a mutable reference to the oracle object, which is the main object that stores and updates the weather data on the blockchain. The function takes the geoname ID of the city as a parameter, and deletes the city weather oracle object for the city. The function also removes the dynamic object field for the city from the oracle object. This way, the function deletes a city from the oracle, and frees up some storage space on the blockchain.

[weather.move](https://github.com/MystenLabs/sui/tree/main/weather.move)

```codeBlockLines_p187
public fun remove_city(
    _: &AdminCap,
    oracle: &mut WeatherOracle,
    geoname_id: u32
    ) {
        let CityWeatherOracle {
            id,
            geoname_id: _,
            name: _,
            country: _,
            latitude: _,
            positive_latitude: _,
            longitude: _,
            positive_longitude: _,
            weather_id: _,
            temp: _,
            pressure: _,
            humidity: _,
            visibility: _,
            wind_speed: _,
            wind_deg: _,
            wind_gust: _,
            clouds: _,
            dt: _ } = dof::remove(&mut oracle.id, geoname_id);
        object::delete(id);
}

```

Now that you have implemented the `add_city` and `remove_city` functions, you can move on to the next step, which is to see how you can update the weather data for each city. The backend service fetches the weather data from the OpenWeather API every 10 minutes, and then passes the data to the `update` function of the Sui Weather Oracle smart contract. The `update` function takes the geoname ID and the new weather data of the city as parameters, and updates the city weather oracle object with the new data. This way, the weather data on the blockchain is always up to date and accurate.

[weather.move](https://github.com/MystenLabs/sui/tree/main/weather.move)

```codeBlockLines_p187
public fun update(
    _: &AdminCap,
    oracle: &mut WeatherOracle,
    geoname_id: u32,
    weather_id: u16,
    temp: u32,
    pressure: u32,
    humidity: u8,
    visibility: u16,
    wind_speed: u16,
    wind_deg: u16,
    wind_gust: Option<u16>,
    clouds: u8,
    dt: u32
) {
    let city_weather_oracle_mut = dof::borrow_mut<u32, CityWeatherOracle>(&mut oracle.id, geoname_id); // Borrow a mutable reference to the city weather oracle object with the geoname ID as the key
    city_weather_oracle_mut.weather_id = weather_id;
    city_weather_oracle_mut.temp = temp;
    city_weather_oracle_mut.pressure = pressure;
    city_weather_oracle_mut.humidity = humidity;
    city_weather_oracle_mut.visibility = visibility;
    city_weather_oracle_mut.wind_speed = wind_speed;
    city_weather_oracle_mut.wind_deg = wind_deg;
    city_weather_oracle_mut.wind_gust = wind_gust;
    city_weather_oracle_mut.clouds = clouds;
    city_weather_oracle_mut.dt = dt;
}

```

You have defined the data structure of the Sui Weather Oracle smart contract, but you need some functions to access and manipulate the data. Now, add some helper functions that read and return the weather data for a `WeatherOracle` object. These functions allow you to get the weather data for a specific city in the oracle. These functions also allow you to format and display the weather data in a user-friendly way.

[weather.move](https://github.com/MystenLabs/sui/tree/main/weather.move)

```codeBlockLines_p187
// --------------- Read-only References ---------------

/// Returns the `name` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_name(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): String {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.name
}
/// Returns the `country` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_country(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): String {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.country
}
/// Returns the `latitude` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_latitude(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u32 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.latitude
}
/// Returns the `positive_latitude` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_positive_latitude(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): bool {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.positive_latitude
}
/// Returns the `longitude` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_longitude(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u32 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.longitude
}
/// Returns the `positive_longitude` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_positive_longitude(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): bool {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.positive_longitude
}
/// Returns the `weather_id` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_weather_id(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u16 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.weather_id
}
/// Returns the `temp` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_temp(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u32 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.temp
}
/// Returns the `pressure` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_pressure(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u32 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.pressure
}
/// Returns the `humidity` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_humidity(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u8 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.humidity
}
/// Returns the `visibility` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_visibility(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u16 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.visibility
}
/// Returns the `wind_speed` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_wind_speed(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u16 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.wind_speed
}
/// Returns the `wind_deg` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_wind_deg(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u16 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.wind_deg
}
/// Returns the `wind_gust` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_wind_gust(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): Option<u16> {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.wind_gust
}
/// Returns the `clouds` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_clouds(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u8 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.clouds
}
/// Returns the `dt` of the `CityWeatherOracle` with the given `geoname_id`.
public fun city_weather_oracle_dt(
    weather_oracle: &WeatherOracle,
    geoname_id: u32
): u32 {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&weather_oracle.id, geoname_id);
    city_weather_oracle.dt
}

```

Finally, add an extra feature that allows anyone to mint a `WeatherNFT` with the current conditions of a city by passing the geoname ID. The `mint` function is a public function that allows anyone to mint a weather NFT based on the weather data of a city. The function takes the `WeatherOracle` shared object and the geoname ID of the city as parameters, and returns a new `WeatherNFT` object for the city. The `WeatherNFT` object is a unique and non-fungible token that represents the weather of the city at the time of minting. The `WeatherNFT` object has the same data as the `CityWeatherOracle` object, such as the `geonameID`, `name`, `country`, `latitude`, `longitude`, `positive latitude` and `longitude`, `weather ID`, `temperature`, `pressure`, `humidity`, `visibility`, `wind speed`, `wind degree`, `wind gust`, `clouds`, and `timestamp`. The function creates the `WeatherNFT` object by borrowing a reference to the `CityWeatherOracle` object with the geoname ID as the key, and assigning a unique ID ( `UID`) to the `WeatherNFT` object. The function then transfers the ownership of the `WeatherNFT` object to the sender of the transaction. This way, the function allows anyone to mint a weather NFT and own a digital representation of the weather of a city. You can use this feature to create your own collection of weather NFTs, or to use them for other applications that require verifiable and immutable weather data.

[weather.move](https://github.com/MystenLabs/sui/tree/main/weather.move)

```codeBlockLines_p187
public struct WeatherNFT has key, store {
    id: UID,
    geoname_id: u32,
    name: String,
    country: String,
    latitude: u32,
    positive_latitude: bool,
    longitude: u32,
    positive_longitude: bool,
    weather_id: u16,
    temp: u32,
    pressure: u32,
    humidity: u8,
    visibility: u16,
    wind_speed: u16,
    wind_deg: u16,
    wind_gust: Option<u16>,
    clouds: u8,
    dt: u32
}

public fun mint(
    oracle: &WeatherOracle,
    geoname_id: u32,
    ctx: &mut TxContext
): WeatherNFT {
    let city_weather_oracle = dof::borrow<u32, CityWeatherOracle>(&oracle.id, geoname_id);
    WeatherNFT {
        id: object::new(ctx),
        geoname_id: city_weather_oracle.geoname_id,
        name: city_weather_oracle.name,
        country: city_weather_oracle.country,
        latitude: city_weather_oracle.latitude,
        positive_latitude: city_weather_oracle.positive_latitude,
        longitude: city_weather_oracle.longitude,
        positive_longitude: city_weather_oracle.positive_longitude,
        weather_id: city_weather_oracle.weather_id,
        temp: city_weather_oracle.temp,
        pressure: city_weather_oracle.pressure,
        humidity: city_weather_oracle.humidity,
        visibility: city_weather_oracle.visibility,
        wind_speed: city_weather_oracle.wind_speed,
        wind_deg: city_weather_oracle.wind_deg,
        wind_gust: city_weather_oracle.wind_gust,
        clouds: city_weather_oracle.clouds,
        dt: city_weather_oracle.dt
    }
}

```

And with that, your `weather.move` code is complete.

## Deployment [​](https://docs.sui.io/guides/developer/app-examples/weather-oracle\#deployment "Direct link to Deployment")

info

See [Publish a Package](https://docs.sui.io/guides/developer/first-app/publish) for a more detailed guide on publishing packages or [Sui Client CLI](https://docs.sui.io/references/cli/client) for a complete reference of `client` commands in the Sui CLI.

Before publishing your code, you must first initialize the Sui Client CLI, if you haven't already. To do so, in a terminal or console at the root directory of the project enter `sui client`. If you receive the following response, complete the remaining instructions:

```codeBlockLines_p187
Config file ["<FILE-PATH>/.sui/sui_config/client.yaml"] doesn't exist, do you want to connect to a Sui Full node server [y/N]?

```

Enter `y` to proceed. You receive the following response:

```codeBlockLines_p187
Sui Full node server URL (Defaults to Sui Testnet if not specified) :

```

Leave this blank (press Enter). You receive the following response:

```codeBlockLines_p187
Select key scheme to generate keypair (0 for ed25519, 1 for secp256k1, 2: for secp256r1):

```

Select `0`. Now you should have a Sui address set up.

Before being able to publish your package to Testnet, you need Testnet SUI tokens. To get some, visit the online faucet at [https://faucet.sui.io/](https://faucet.sui.io/). For other ways to get SUI in your Testnet account, see [Get SUI Tokens](https://docs.sui.io/guides/developer/getting-started/get-coins).

Now that you have an account with some Testnet SUI, you can deploy your contracts. To publish your package, use the following command in the same terminal or console:

```codeBlockLines_p187
sui client publish --gas-budget <GAS-BUDGET>

```

For the gas budget, use a standard value such as `20000000`.

## Backend [​](https://docs.sui.io/guides/developer/app-examples/weather-oracle\#backend "Direct link to Backend")

You have successfully deployed the Sui Weather Oracle smart contract on the blockchain. Now, it's time to create an Express backend that can interact with it. The Express backend performs the following tasks:

- Initialize the smart contract with 1,000 cities using the `add_city` function of the smart contract. The backend passes the geoname ID, name, country, latitude, longitude, and positive latitude and longitude of each city as parameters to the function.
- Fetch the weather data for each city from the OpenWeather API every 10 minutes, using the API key that you obtained from the website. The backend parses the JSON response and extracts the weather data for each city, such as the weather ID, temperature, pressure, humidity, visibility, wind speed, wind degree, wind gust, clouds, and timestamp.
- Update the weather data for each city on the blockchain, using the `update` function of the smart contract. The backend passes the geoname ID and the new weather data of each city as parameters to the function.

The Express backend uses the [Sui Typescript SDK](https://sdk.mystenlabs.com/typescript), a TypeScript library that enables you to interact with the Sui blockchain and smart contracts. With the Sui Typescript SDK, you can connect to the Sui network, sign and submit transactions, and query the state of the smart contract. You also use the OpenWeather API to fetch the weather data for each city and update the smart contract every 10 minutes. Additionally, you can mint weather NFTs, if you want to explore that feature of the smart contract.

### Initialize the project [​](https://docs.sui.io/guides/developer/app-examples/weather-oracle\#initialize-the-project "Direct link to Initialize the project")

First, initialize your backend project. To do this, you need to follow these steps:

- Create a new folder named `weather-oracle-backend` and navigate to it in your terminal.
- Run `npm init -y` to create a package.json file with default values.
- Run `npm install express --save` to install Express as a dependency and save it to your package.json file.
- Run `npm install @mysten/bcs @mysten/sui axios csv-parse csv-parser dotenv pino retry-axios --save` to install the other dependencies and save them to your package.json file. These dependencies are:
  - **@mysten/bcs**: a library for blockchain services.
  - **@mysten/sui**: a library for smart user interfaces.
  - **axios**: a library for making HTTP requests.
  - **csv-parse**: a library for parsing CSV data.
  - **csv-parser**: a library for transforming CSV data into JSON objects.
  - **dotenv**: a library for loading environment variables from a .env file.
  - **pino**: a library for fast and low-overhead logging.
  - **retry-axios**: a library for retrying failed axios requests.
- Create a new file named `init.ts`

[init.ts](https://github.com/MystenLabs/sui/tree/main/init.ts)

```codeBlockLines_p187
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';

import { City } from './city';
import { get1000Geonameids } from './filter-cities';
import { latitudeMultiplier, longitudeMultiplier } from './multipliers';
import { getCities, getWeatherOracleDynamicFields } from './utils';
import { logger } from './utils/logger';

dotenv.config({ path: '../.env' });

const phrase = process.env.ADMIN_PHRASE;
const fullnode = process.env.FULLNODE!;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);
const client = new SuiClient({
	url: fullnode,
});

const packageId = process.env.PACKAGE_ID;
const adminCap = process.env.ADMIN_CAP_ID!;
const weatherOracleId = process.env.WEATHER_ORACLE_ID!;
const moduleName = 'weather';

const NUMBER_OF_CITIES = 10;

async function addCityWeather() {
	const cities: City[] = await getCities();
	const thousandGeoNameIds = await get1000Geonameids();

	const weatherOracleDynamicFields = await getWeatherOracleDynamicFields(client, weatherOracleId);
	const geonames = weatherOracleDynamicFields.map(function (obj) {
		return obj.name;
	});

	let counter = 0;
	let transaction = new Transaction();
	for (let c in cities) {
		if (
			!geonames.includes(cities[c].geonameid) &&
			thousandGeoNameIds.includes(cities[c].geonameid)
		) {
			transaction.moveCall({
				target: `${packageId}::${moduleName}::add_city`,
				arguments: [\
					transaction.object(adminCap), // adminCap\
					transaction.object(weatherOracleId), // WeatherOracle\
					transaction.pure(cities[c].geonameid), // geoname_id\
					transaction.pure(cities[c].asciiname), // asciiname\
					transaction.pure(cities[c].countryCode), // country\
					transaction.pure(cities[c].latitude * latitudeMultiplier), // latitude\
					transaction.pure(cities[c].latitude > 0), // positive_latitude\
					transaction.pure(cities[c].longitude * longitudeMultiplier), // longitude\
					transaction.pure(cities[c].longitude > 0), // positive_longitude\
				],
			});

			counter++;
			if (counter === NUMBER_OF_CITIES) {
				await signAndExecuteTransaction(transaction);
				counter = 0;
				transaction = new Transaction();
			}
		}
	}
	await signAndExecuteTransaction(transaction);
}

async function signAndExecuteTransaction(transaction: Transaction) {
	transaction.setGasBudget(5000000000);
	await client
		.signAndExecuteTransaction({
			signer: keypair,
			transaction,
			requestType: 'WaitForLocalExecution',
			options: {
				showObjectChanges: true,
				showEffects: true,
			},
		})
		.then(function (res) {
			logger.info(res);
		});
}

addCityWeather();

```

The code of init.ts does the following:

- Imports the necessary modules and classes from the library, such as `Ed25519Keypair`, `SuiClient`, and `Transaction`.
- Imports the `dotenv` module to load environment variables from a .env file.
- Imports some custom modules and functions from the local files, such as `City`, `get1000Geonameids`, `getCities`, `getWeatherOracleDynamicFields`, and `logger`.
- Derives a key pair from a phrase stored in the `ADMIN_PHRASE` environment variable.
- Creates a sui client object that connects to a Full node specified by the `FULLNODE` environment variable.
- Reads some other environment variables, such as `PACKAGE_ID`, `ADMIN_CAP_ID`, `WEATHER_ORACLE_ID`, and `MODULE_NAME`, which are used to identify the weather oracle contract and its methods.
- Defines a constant `NUMBER_OF_CITIES`, which is the number of cities to be added to the weather oracle in each batch.
- Defines an async function `addCityWeather`, which does the following:
  - Gets an array of cities from the `getCities` function.
  - Gets an array of 1,000 geonameids from the `get1000Geonameids` function.
  - Gets an array of weather oracle dynamic fields from the `getWeatherOracleDynamicFields` function, which contains the geonameids of the existing cities in the weather oracle.
  - Initializes a counter and a transaction block object.
  - Loops through the cities array and checks if the city's geonameid is not in the weather oracle dynamic fields array and is in the 1,000 geonameids array.
  - If the condition is met, adds a `moveCall` to the transaction block, which calls the `add_city` method of the weather oracle contract with the city's information, such as `geonameid`, `asciiname`, `country`, `latitude`, and `longitude`.
  - Increments the counter and checks if it reaches the `NUMBER_OF_CITIES`. If so, calls another async function, `signAndExecuteTransaction`, with the transaction block as an argument, which signs and executes the transaction block on the blockchain and logs the result. The code then resets the counter and the transaction block.
  - After the loop ends, calls the `signAndExecuteTransaction` function again with the remaining transaction block.

You have now initialized the `WeatherOracle` shared object. The next step is to learn how to update them every 10 minutes with the latest weather data from the OpenWeatherMap API.

[index.ts](https://github.com/MystenLabs/sui/tree/main/index.ts)

```codeBlockLines_p187
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';

import { City } from './city';
import { tempMultiplier, windGustMultiplier, windSpeedMultiplier } from './multipliers';
import { getWeatherData } from './openweathermap';
import { getCities, getWeatherOracleDynamicFields } from './utils';
import { logger } from './utils/logger';

dotenv.config({ path: '../.env' });

const phrase = process.env.ADMIN_PHRASE;
const fullnode = process.env.FULLNODE!;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);
const client = new SuiClient({
	url: fullnode,
});

const packageId = process.env.PACKAGE_ID;
const adminCap = process.env.ADMIN_CAP_ID!;
const weatherOracleId = process.env.WEATHER_ORACLE_ID!;
const appid = process.env.APPID!;
const moduleName = 'weather';

const CHUNK_SIZE = 25;
const MS = 1000;
const MINUTE = 60 * MS;
const TEN_MINUTES = 10 * MINUTE;

async function performUpdates(
	cities: City[],
	weatherOracleDynamicFields: {
		name: number;
		objectId: string;
	}[],
) {
	let startTime = new Date().getTime();

	const geonames = weatherOracleDynamicFields.map(function (obj) {
		return obj.name;
	});
	const filteredCities = cities.filter((c) => geonames.includes(c.geonameid));

	for (let i = 0; i < filteredCities.length; i += CHUNK_SIZE) {
		const chunk = filteredCities.slice(i, i + CHUNK_SIZE);

		let transaction = await getTransaction(chunk);
		try {
			await client.signAndExecuteTransaction({
				signer: keypair,
				transaction,
			});
		} catch (e) {
			logger.error(e);
		}
	}

	let endTime = new Date().getTime();
	setTimeout(
		performUpdates,
		TEN_MINUTES - (endTime - startTime),
		cities,
		weatherOracleDynamicFields,
	);
}

async function getTransaction(cities: City[]) {
	let transaction = new Transaction();

	let counter = 0;
	for (let c in cities) {
		const weatherData = await getWeatherData(cities[c].latitude, cities[c].longitude, appid);
		counter++;
		if (weatherData?.main?.temp !== undefined) {
			transaction.moveCall({
				target: `${packageId}::${moduleName}::update`,
				arguments: [\
					transaction.object(adminCap), // AdminCap\
					transaction.object(weatherOracleId), // WeatherOracle\
					transaction.pure(cities[c].geonameid), // geoname_id\
					transaction.pure(weatherData.weather[0].id), // weather_id\
					transaction.pure(weatherData.main.temp * tempMultiplier), // temp\
					transaction.pure(weatherData.main.pressure), // pressure\
					transaction.pure(weatherData.main.humidity), // humidity\
					transaction.pure(weatherData.visibility), // visibility\
					transaction.pure(weatherData.wind.speed * windSpeedMultiplier), // wind_speed\
					transaction.pure(weatherData.wind.deg), // wind_deg\
					transaction.pure(\
						weatherData.wind.gust === undefined ? [] : [weatherData.wind.gust * windGustMultiplier],\
						'vector<u16>',\
					), // wind_gust\
					transaction.pure(weatherData.clouds.all), // clouds\
					transaction.pure(weatherData.dt), // dt\
				],
			});
		} else logger.warn(`No weather data for ${cities[c].asciiname} `);
	}
	return transaction;
}

async function run() {
	const cities: City[] = await getCities();
	const weatherOracleDynamicFields: {
		name: number;
		objectId: string;
	}[] = await getWeatherOracleDynamicFields(client, weatherOracleId);
	performUpdates(cities, weatherOracleDynamicFields);
}

run();

```

The code in index.ts does the following:

- Uses `dotenv` to load some environment variables from a `.env` file, such as `ADMIN_PHRASE`, `FULLNODE`, `PACKAGE_ID`, `ADMIN_CAP_ID`, `WEATHER_ORACLE_ID`, `APPID`, and `MODULE_NAME`. These variables are used to configure some parameters for the code, such as the key pair, the client, and the target package and module.
- Defines some constants, such as `CHUNK_SIZE`, `MS`, `MINUTE`, and `TEN_MINUTES`. These constants are used to control the frequency and size of the updates that the code performs.
- Defines an async function called `performUpdates`, which takes two arguments: `cities` and `weatherOracleDynamicFields`. This function is the main logic of the code, and it does the following:
  - Filters the `cities` array based on the `weatherOracleDynamicFields` array, which contains the names and object IDs of the weather oracle dynamic fields that the code needs to update.
  - Loops through the filtered cities in chunks of `CHUNK_SIZE`, and for each chunk, it calls another async function called `getTransaction`, which returns a transaction block that contains the Move calls to update the weather oracle dynamic fields with the latest weather data from the OpenWeatherMap API.
  - Tries to sign and execute the transaction block using the client and keypair, and catches any errors that may occur.
  - Calculates the time it took to perform the updates, and sets a timeout to call itself again after `TEN_MINUTES` minus the elapsed time.
- The code defines another async function called `getTransaction`, which takes one argument: `cities`. This function does the following:
  - Creates a new transaction block object.
  - Loops through the `cities` array, and for each city, it calls another async function called `getWeatherData`, which takes the `latitude`, `longitude`, and `appid` as arguments, and returns the weather data for the city from the OpenWeatherMap API.
  - Checks if the weather data is valid, and if so, adds a Move call to the transaction block, which calls the `update` function of the target package and module, and passes the admin cap, the weather oracle id, the geoname id, and the weather data as arguments.
  - Returns the transaction block object.
- An async `run` function is defined, which does the following:
  - Calls another async function called `getCities`, which returns an array of city objects that contain information such as name, geoname id, latitude, and longitude.
  - Calls another async function called `getWeatherOracleDynamicFields`, which takes the package id, the module name, and the client as arguments, and returns an array of weather oracle dynamic field objects that contain information such as name and object id.
  - Calls the `performUpdates` function with the cities and weather oracle dynamic fields arrays as arguments.

Congratulations, you completed the Sui Weather Oracle tutorial. You can carry the lessons learned here forward when building your next Sui project.

- [Move smart contract](https://docs.sui.io/guides/developer/app-examples/weather-oracle#move-smart-contract)
  - [Weather Oracle module](https://docs.sui.io/guides/developer/app-examples/weather-oracle#weather-oracle-module)
- [Deployment](https://docs.sui.io/guides/developer/app-examples/weather-oracle#deployment)
- [Backend](https://docs.sui.io/guides/developer/app-examples/weather-oracle#backend)
  - [Initialize the project](https://docs.sui.io/guides/developer/app-examples/weather-oracle#initialize-the-project)