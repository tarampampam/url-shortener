/** The list of all elements used in the script */
const $el = {
  body: document.body,
  result: {
    container: document.getElementById('result'),
    link: document.getElementById('result-link'),
    copyBtn: document.getElementById('result-copy-link'),
  },
  error: document.getElementById('error'),
  form: {
    /** @type {HTMLFormElement} */
    form: document.getElementById('shorten'),
    /** @type {HTMLInputElement} */
    url: document.getElementById('url'),
    /** @type {HTMLInputElement} */
    slug: document.getElementById('slug'),
    submit: document.getElementById('submit'),
  },
  auth: {
    showTokenBtn: document.getElementById('show-token'),
    /** @type {HTMLInputElement} */
    token: document.getElementById('auth-token'),
  },
}

/** A class to deal with the authentication */
const auth = new (class {
  localStorageKey = 'auth_token'

  /** @return {string|null} */
  getToken() {
    return localStorage.getItem(this.localStorageKey)
  }

  /**
   * @param {string} token
   * @return {void}
   */
  setToken(token) {
    localStorage.setItem(this.localStorageKey, token)
  }
})()

/** A class to set/unset the result */
const result = new (class {
  hiddenClass = 'hidden'

  /**
   * @param {string} url
   * @return {void}
   */
  set(url) {
    $el.result.container.classList.remove(this.hiddenClass)

    $el.result.link.href = url
    $el.result.link.textContent = url.replace(/^(https?:\/\/)/, '')

    $el.result.copyBtn.onclick = (event) => {
      event.preventDefault()
      navigator.clipboard.writeText(url).catch(console.warn)
    }
  }

  /** @return {void} */
  unset() {
    $el.result.container.classList.add(this.hiddenClass)

    $el.result.link.href = ''
    $el.result.link.textContent = ''

    $el.result.copyBtn.onclick = null
  }
})()

/** A class to set/unset the error */
const error = new (class {
  hiddenClass = 'hidden'

  /**
   * @param {string} message
   * @return {void}
   */
  set(message) {
    $el.error.classList.remove(this.hiddenClass)
    $el.error.textContent = message
  }

  /** @return {void} */
  unset() {
    $el.error.classList.add(this.hiddenClass)
    $el.error.textContent = ''
  }
})()

/** A class to deal with the form */
const form = new (class {
  disable() {
    $el.form.url.disabled = true
    $el.form.slug.disabled = true
    $el.form.submit.disabled = true
    $el.form.form.disabled = true
    $el.auth.token.disabled = true
  }

  enable() {
    $el.form.url.disabled = false
    $el.form.slug.disabled = false
    $el.form.submit.disabled = false
    $el.form.form.disabled = false
    $el.auth.token.disabled = false
  }

  /**
   * @return {Promise<{url: string}>}
   */
  async submit() {
    const url = $el.form.url.value.trim()
    const slug = $el.form.slug.value.trim().replace(/^\/+/, '')

    if (!url) {
      throw new Error('URL is required')
    }

    try {
      new URL(url)
    } catch (e) {
      throw new Error('Invalid URL')
    }

    if (slug && !/^[a-z0-9_~!*()+=%.-]+$/i.test(slug)) {
      throw new Error('Invalid slug')
    }

    const resp = await fetch('/api/create', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.getToken()}`,
      },
      body: JSON.stringify({ url, slug }),
    })

    if (!resp.ok) {
      if (resp.status === 401) {
        throw new Error('Invalid auth token')
      }

      const data = await resp.json()
      if (data.error) {
        throw new Error(data.error)
      }

      throw new Error(data)
    }

    const data = await resp.json()
    if (!data.url) {
      throw new Error('Invalid API response')
    }

    return { url: data.url }
  }
})()

const urlParams = new URLSearchParams(window.location.search)
const tokenValues = ['key', 'auth', 'token', 'pass', 'pwd', 'auth_token', 'authtoken', 'auth-token']
const urlValues = ['url', 'do', 'link', 'short', 'shorten', 'shorten_url', 'shorten-url']
const slugValues = ['slug', 'custom', 'short', 'custom_slug', 'custom-slug']

// initialize the auth token input
$el.auth.token.value = auth.getToken()

// set the auth token from the query string, if available
for (let [key, value] of urlParams) {
  key = key.trim().toLowerCase()
  value = value.trim()

  if (key && value) {
    if (tokenValues.includes(key)) {
      $el.auth.token.value = value
      auth.setToken(value)
    }

    if (!$el.form.url.value && urlValues.includes(key)) {
      $el.form.url.value = value
      window.setTimeout(() => $el.form.form.dispatchEvent(new SubmitEvent('submit', { cancelable: true })), 100)
    }

    if (!$el.form.slug.value && slugValues.includes(key)) {
      $el.form.slug.value = value
    }
  }
}

// toggle the token visibility
$el.auth.showTokenBtn.addEventListener('click', (event) => {
  event.preventDefault()
  $el.auth.token.type = $el.auth.token.type === 'password' ? 'text' : 'password'
})

// handle auth token input change
$el.auth.token.addEventListener('input', (event) => {
  event.preventDefault()
  auth.setToken($el.auth.token.value)
})

// handle form submission
$el.form.form.addEventListener('submit', (event) => {
  event.preventDefault()

  error.unset()
  result.unset()
  form.disable()

  form
    .submit()
    .then((res) => result.set(res.url))
    .catch((e) => error.set((e instanceof Error ? e : new Error(String(e))).message))
    .finally(() => form.enable())
})

// remove loading class from body
document.body.classList.remove('loading')
