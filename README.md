<p align="center">
  <a href="https://github.com/tarampampam/url-shortener#readme">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://socialify.git.ci/tarampampam/url-shortener/image?description=1&font=Raleway&forks=1&issues=1&owner=1&pulls=1&pattern=Solid&stargazers=1&theme=Dark">
      <img align="center" src="https://socialify.git.ci/tarampampam/url-shortener/image?description=1&font=Raleway&forks=1&issues=1&owner=1&pulls=1&pattern=Solid&stargazers=1&theme=Light">
    </picture>
  </a>
</p>

# URL shortener

This is a simple URL shortener application that allows users to create short links for long URLs. The app is
built using Cloudflare Workers and uses Workers KV for storage.

> [!TIP]
> To prevent abuse, the app may be protected by an authentication token.

## Steps to reproduce the project

* Issue a [new Cloudflare API token][new_cf_token] with the following scopes (`Workers KV Storage:Edit`,
  `Workers Scripts:Edit`) and save it
  <details>
  <summary>Screenshot</summary>

  ![screenshot][token_scopes]

  </details>
* Create a new KV (key-value) storage namespace on the Cloudflare "Storage & Databases" page and name it,
  for example, `url-shortener-kv`
  <details>
  <summary>Screenshot</summary>

  ![screenshot][new_kv]

  </details>
* Create the following GitHub Actions **secrets** in the repository settings:
  - `AUTH_TOKEN` - the token to protect creating short links only for authenticated users (e.g., `suPaPA$$w0rd`)
  - `CLOUDFLARE_PAGES_DEPLOY_TOKEN` – the API token you created in the first step
  - `CLOUDFLARE_ACCOUNT_ID` – your Cloudflare account ID (available on the Cloudflare Account Home Page)
  <details>
  <summary>Screenshot</summary>

  ![screenshot][account_id]

  </details>
* Create the following GitHub Actions **variables** (not secrets!) in the repository settings:
  - `CLOUDFLARE_PROJECT_NAME` – the name of your Cloudflare Worker project, e.g., `url-shortener-app`
  - `CLOUDFLARE_KV_ID` – the ID of the KV storage namespace you created in the second step
  <details>
  <summary>Screenshot</summary>

  ![screenshot][kv_id]

  </details>
* Run the deployment workflow (open "Actions" in your fork, click on "🚀 Deploy", and then click on "Run workflow")

[new_cf_token]:https://dash.cloudflare.com/profile/api-tokens
[token_scopes]:https://habrastorage.org/webt/zw/ou/1k/zwou1kfrf_5z9ije8bsxkhn_iqc.png
[new_kv]:https://habrastorage.org/webt/ql/z5/e2/qlz5e2th3q9o9bbbcupbfrvedwu.png
[kv_id]:https://habrastorage.org/webt/xo/7i/rl/xo7irl-7ulmpe8shd1l8g4arasi.png
[account_id]:https://habrastorage.org/webt/8c/ws/dx/8cwsdxoo_7ioonkgg1u2k2_qj6c.png
