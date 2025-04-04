<script lang="ts" module>
  const userDefined = (() => {
    const [urlKeys, slugKeys, authTokenKeys] = [
      ['url', 'do', 'link', 'short', 'shorten', 'shorten_url', 'shorten-url'], // app?url=https://example.com, ...
      ['slug', 'custom', 'short', 'custom_slug', 'custom-slug'], // app?slug=foo, ...
      ['key', 'auth', 'token', 'pass', 'pwd', 'auth_token', 'authtoken', 'auth-token'], // app?key=bar, ...
    ]
    const result: { url: string | null; slug: string | null; authToken: string | null } = {
      url: null,
      slug: null,
      authToken: null,
    }

    for (let [key, value] of new URLSearchParams(window.location.search)) {
      key = key.trim().toLowerCase()
      value = value.trim()

      if (key && value) {
        switch (true) {
          case urlKeys.includes(key):
            result.url = value
            break
          case slugKeys.includes(key):
            result.slug = value
            break
          case authTokenKeys.includes(key):
            result.authToken = value
            break
        }
      }
    }

    return result
  })()
</script>

<script lang="ts">
  import { Error as ErrorView, Form, Result } from './components'

  let result = $state<string | null>(null)
  let error = $state<string | null>(null)
  let enabled = $state<boolean>(true)

  const handleSubmit = async ({
    url,
    slug,
    authToken,
  }: {
    url: URL
    slug: string | null
    authToken: string | null
  }): Promise<void> => {
    enabled = false
    error = null
    result = null

    try {
      const resp = await fetch('/api/create', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ url, slug }),
      })

      if (!resp.ok) {
        if (resp.status === 401) {
          error = 'Invalid auth token'
          return
        }

        const data = await resp.json()
        if (data.error) {
          error = 'API error: ' + String(data.error)
          return
        }

        error = 'RAW API error: ' + String(data)
        return
      }

      const data = await resp.json()
      if (!data.url) {
        error = 'Invalid API response'
        return
      }

      result = data.url
    } catch (e) {
      error = 'Exception: ' + (e instanceof Error ? e : new Error(String(e))).message
    } finally {
      enabled = true
    }
  }

  const handleError = (err: Error): void => {
    error = err.message
  }
</script>

<main>
  {#if result}
    <Result url={result} />
  {/if}
  {#if error}
    <ErrorView message={error} />
  {/if}
  <Form
    onSubmit={handleSubmit}
    onError={handleError}
    initialUrl={userDefined.url}
    initialSlug={userDefined.slug}
    initialAuthToken={userDefined.authToken}
    {enabled}
  />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
  }

  @media screen and (max-width: 576px) {
    main {
      width: 100%;
    }
  }

  @media screen and (min-width: 768px) {
    main {
      width: 600px;
    }
  }

  @media screen and (min-width: 992px) {
    main {
      width: 800px;
    }
  }
</style>
