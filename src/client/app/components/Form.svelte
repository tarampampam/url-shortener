<script lang="ts">
  import { onMount } from 'svelte'

  const {
    onSubmit,
    onError,
    initialUrl = undefined,
    initialSlug = undefined,
    initialAuthToken = undefined,
    enabled = true,
    autofocus = false,
  }: {
    onSubmit: (data: { url: URL; slug: string | null; authToken: string | null }) => void
    onError: (err: Error) => void
    initialUrl?: string | null
    initialSlug?: string | null
    initialAuthToken?: string | null
    enabled?: boolean
    autofocus?: boolean
  } = $props()

  const uid = $props.id()
  const localStorageKey = 'auth_token'

  let url = $state<string>(initialUrl ?? '')
  let slug = $state<string>(initialSlug ?? '')
  let authToken = $state<string>(initialAuthToken ?? localStorage.getItem(localStorageKey) ?? '')
  let urlInput: HTMLInputElement
  let authTokenInput: HTMLInputElement

  $effect(() => {
    if (authToken) {
      localStorage.setItem(localStorageKey, authToken)
    } else {
      localStorage.removeItem(localStorageKey)
    }
  })

  onMount((): void => {
    if (autofocus) {
      urlInput.focus()
    }

    if (url && authToken) {
      // automatically submit the form if a URL and auth token are provided
      queueMicrotask(() => handleSubmit(new SubmitEvent('submit', { cancelable: true, bubbles: true })))
    }
  })

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault()

    if (!url) {
      return onError(new Error('URL is required'))
    }

    const cleanSlug = slug.trim().replace(/^\/+/, '')

    if (cleanSlug && !/^[a-z0-9_~!*()+=%.-]+$/i.test(cleanSlug)) {
      return onError(new Error('Invalid slug'))
    }

    let u: URL

    try {
      u = new URL(url)
    } catch (_) {
      return onError(new Error('Invalid URL'))
    }

    return onSubmit({ url: u, slug: cleanSlug || null, authToken: authToken || null })
  }

  const handleTokenVisibilityChange = (e: UIEvent) => {
    e.preventDefault()

    authTokenInput.type = authTokenInput.type === 'password' ? 'text' : 'password'
  }
</script>

<form onsubmit={handleSubmit}>
  <section class="data">
    <div class="left">
      <input
        bind:this={urlInput}
        type="url"
        name="search"
        class="url"
        placeholder="Enter a URL to shorten..."
        aria-label="Enter a URL to shorten..."
        autocomplete="off"
        spellcheck="false"
        inputmode="none"
        bind:value={url}
        disabled={!enabled}
        required
      />
      <input
        type="text"
        name="search"
        class="slug"
        placeholder="/custom-slug"
        aria-label="/custom-slug"
        autocomplete="off"
        spellcheck="false"
        inputmode="none"
        bind:value={slug}
        disabled={!enabled}
      />
    </div>
    <div class="right">
      <button type="submit" disabled={!enabled}>Shorten</button>
    </div>
  </section>
  <section class="auth">
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
    <label for="{uid}-show-token" onclick={handleTokenVisibilityChange}>🔐</label>
    <input
      bind:this={authTokenInput}
      type="password"
      name="password"
      placeholder="Auth token"
      aria-label="Auth token"
      class="auth-token"
      autocomplete="current-password"
      inputmode="text"
      tabindex={-1}
      id="{uid}-show-token"
      bind:value={authToken}
      disabled={!enabled}
    />
  </section>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    width: 100%;

    section.data {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
      width: 100%;

      --border-radius: 0.4em;

      input,
      button {
        border: 2px solid var(--color-primary-border);
        padding: 0.7em 0.7em;
      }

      .left {
        display: flex;
        flex-direction: column;
        width: 100%;

        input::placeholder {
          color: var(--color-primary-placeholder);
        }

        input.url {
          background-color: var(--color-submit-input-bg);
          color: var(--color-submit-input-text);
          border-radius: var(--border-radius) 0 0 0;
          border-right: 0;
          border-bottom: 0;
          font-size: 1.15em;
          padding-bottom: 0.2em;
        }

        input.slug {
          background-color: var(--color-submit-input-bg);
          color: var(--color-submit-input-text);
          border-radius: 0 0 0 var(--border-radius);
          border-top: 0;
          border-right: 0;
          font-size: 0.8em;
          padding-top: 0.2em;
          padding-left: 1.1em;
        }
      }

      .right {
        button[type='submit'] {
          font-weight: bolder;
          font-size: 1.3em;
          border-left: none;
          cursor: pointer;
          height: 100%;
          background-color: var(--color-primary-bg);
          color: var(--color-primary-text);
          border-radius: 0 var(--border-radius) var(--border-radius) 0;
          transition: box-shadow 0.1s ease;

          &:disabled {
            cursor: not-allowed;
          }

          &:active {
            box-shadow: inset 0 0 1em rgba(0, 0, 0, 0.2);
          }
        }
      }
    }

    section.auth {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
      font-size: 0.9em;

      --border-width: 1px;
      --border-radius: 0.3em;

      label {
        display: inline-block;
        border: var(--border-width) solid var(--color-secondary-border);
        border-radius: var(--border-radius) 0 0 var(--border-radius);
        background-color: var(--color-secondary-bg);
        padding: 0.5em;
        cursor: pointer;
        user-select: none;
      }

      input.auth-token {
        border: var(--border-width) solid var(--color-secondary-border);
        border-radius: 0 var(--border-radius) var(--border-radius) 0;
        border-left: none;
        padding: 0 0.5em;
        font-size: 0.9em;
        background-color: var(--color-primary-bg);
        color: var(--color-primary-text);
        width: 35ch;
      }
    }
  }
</style>
