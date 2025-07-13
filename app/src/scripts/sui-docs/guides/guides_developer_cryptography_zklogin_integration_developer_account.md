# https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account

[Skip to main content](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account#__docusaurus_skipToContent_fallback)

On this page

To integrate zkLogin with your app, you need an OAuth client from at least one of the [available providers](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account#openid-providers). You use the Client ID and redirect URI from those providers in your zkLogin project. For example, the following TypeScript code constructs a Google login URL for testing.

```codeBlockLines_p187
const REDIRECT_URI = '<YOUR_SITE_URL>';

const params = new URLSearchParams({
	// Configure client ID and redirect URI with an OpenID provider
	client_id: $CLIENT_ID,
	redirect_uri: $REDIRECT_URI,
	response_type: 'id_token',
	scope: 'openid',
	// See below for details about generation of the nonce
	nonce: nonce,
});

const loginURL = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

```

## OpenID providers [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account\#openid-providers "Direct link to OpenID providers")

The following table lists the OpenID providers that can support zkLogin or are currently being reviewed to determine whether they can support zkLogin.

| Provider | Can support? | Devnet | Testnet | Mainnet |
| --- | --- | --- | --- | --- |
| Facebook | Yes | Yes | Yes | Yes |
| Google | Yes | Yes | Yes | Yes |
| Twitch | Yes | Yes | Yes | Yes |
| Apple | Yes | Yes | Yes | Yes |
| Slack | Yes | Yes | No | No |
| Kakao | Yes | Yes | No | No |
| Microsoft | Yes | Yes | No | No |
| AWS (Tenant)\* | Yes | Yes | Yes | Yes |
| Karrier One | Yes | Yes | Yes | Yes |
| Credenza3 | Yes | Yes | Yes | Yes |
| RedBull | Under review | No | No | No |
| Amazon | Under review | No | No | No |
| WeChat | Under review | No | No | No |
| Auth0 | Under review | No | No | No |
| Okta | Under review | No | No | No |

- Sui supports AWS (Tenant) but the provider is enabled per tenant. Contact us for more information.

## Configuring an OpenID provider [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account\#configuring-an-openid-provider "Direct link to Configuring an OpenID provider")

Select a tab for instruction on configuring the client ID ( `$CLIENT_ID` in the previous example) and redirect URI ( `$REDIRECT_URI` in the previous example) with the relevant provider.

- Google
- Facebook
- Twitch
- Kakao
- Slack
- Apple
- Microsoft

1. Navigate a browser to the [Google Cloud dashboard](https://console.cloud.google.com/home/dashboard). Either sign in or register for a Google Cloud account.

2. Open **APIs & Services** \> **Credentials** using the Google Cloud dashboard navigation.

![1](https://docs.sui.io/assets/images/google-nav-41b1ccd898849a25050387e5e17e101b.png)

3. On the Credentials page, select **CREATE CREDENTIALS** \> **OAuth client ID**.

![2](https://docs.sui.io/assets/images/google-oauth-f835ef4bf576d3a373be5fc0666a8bbb.png)

4. Set the **Application type** and **Name** of your application.

![3](https://docs.sui.io/assets/images/google-appmeta-e97fb54d74740e600bc8d99b636c8a91.png)

5. In the **Authorized redirect URIs** section, click the **ADD URI** button. Set the value for your redirect URI in the field. This should be the wallet or application frontend.

![4](https://docs.sui.io/assets/images/google-addauth-2b5442f1667a14d1955e99e3549824b6.png)

6. Click **Create**. If successful, Google Cloud displays the **OAuth client created** dialog with metadata, including your **Client ID**. Click **OK** to dismiss the dialog.


Your new OAuth client should now appear in the **OAuth 2.0 Client IDs** section of the Credentials page. Click the **Client ID** that appears next to the client to copy the value to your clipboard. Click the client name to access the redirect URI and other client data.

## Related links [​](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account\#related-links "Direct link to Related links")

- [zkLogin Integration Guide](https://docs.sui.io/guides/developer/cryptography/zklogin-integration)
- [zkLogin Example](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/zklogin-example)

- [OpenID providers](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account#openid-providers)
- [Configuring an OpenID provider](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account#configuring-an-openid-provider)
- [Related links](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account#related-links)