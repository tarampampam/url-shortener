import type { Storage } from '../storage'
import { jsonErr, json } from './json'

/** Defines the expected structure of the request payload. */
type RequestPayload = {
  url: string
  slug?: string
}

/** Defines the structure of the response payload. */
type ResponsePayload = {
  url: string
}

/**
 * The length of the generated short URL key. Refer to the following table to understand the number
 * of possible keys (16 ^ N) for a given key length:
 *
 * ```
 *   1 =            16 possible keys
 *   2 =           256 possible keys
 *   3 =         4,096 possible keys
 *   4 =        65,536 possible keys
 *   5 =     1,048,576 possible keys
 *   6 =    16,777,216 possible keys
 *   7 =   268,435,456 possible keys
 *   8 = 4,294,967,296 possible keys
 * ```
 */
const keyLength: number = 5

// number of times the system will attempt to generate a unique key before failing
const retryAttempts: number = 20

/**
 * Handles the creation of a new short URL.
 *
 * This function receives a JSON payload containing a URL, validates it, generates a short hash, and attempts to
 * store it in a key-value storage.
 * If a hash collision occurs, it retries with a shuffled key until either a unique key is found or the retry
 * limit is reached.
 */
export const handler = async (req: Request, storage: Storage): Promise<Response> => {
  const [payload, parsingErr] = await parseAndValidateRequest(req)
  if (parsingErr) {
    return jsonErr(parsingErr, 400)
  }

  const metadata = { client_ip: req.headers.get('CF-Connecting-IP') ?? 'unknown' }

  // if a custom slug is provided, work with it
  if (payload?.slug) {
    const entity = await storage.get(payload.slug)
    if (entity !== null) {
      return jsonErr(new Error('Slug already in use'), 409)
    }

    await storage.put(payload.slug, { url: payload.url }, metadata)

    return json({ url: [new URL(req.url).origin, payload.slug].join('/') } satisfies ResponsePayload)
  }

  // otherwise, generate a new short key
  let key = await generateHash(payload.url)
  const { origin } = new URL(req.url)

  // retry loop to handle potential hash collisions
  for (let i = 0; i < retryAttempts; i++) {
    const entity = await storage.get(key) // retrieve the stored value by key

    // check if the key is already in use
    if (entity !== null) {
      // if the stored value matches the requested URL, return the existing key
      if (entity.url === payload.url) {
        return json({ url: [origin, key].join('/') } satisfies ResponsePayload)
      }

      // if the key is already used for a different URL, shuffle and try again
      key = [...key].sort(() => Math.random() - 0.5).join('')

      continue // fuck it, let's try again
    }

    // store the new URL with the generated key
    await storage.put(key, { url: payload.url }, metadata)

    return json({ url: [origin, key].join('/') } satisfies ResponsePayload)
  }

  return jsonErr(new Error('Failed to generate a unique short key'), 500)
}

const parseAndValidateRequest = async (req: Request): Promise<[RequestPayload, undefined] | [undefined, Error]> => {
  let v: Readonly<RequestPayload>

  try {
    v = await req.json()
  } catch (e) {
    return [undefined, e instanceof Error ? e : new Error(String(e))]
  }

  switch (true) {
    case typeof v !== 'object' || v === null:
      return [undefined, new Error('invalid payload type')] // request must be a valid object
    case !Object.prototype.hasOwnProperty.call(v, 'url') || !v.url:
      return [undefined, new Error('URL is required')] // url field must be present and not empty
    case !v.url.startsWith('https://') && !v.url.startsWith('http://'):
      return [undefined, new Error('the URL must start with "https://" or "http://"')] // enforce valid URL scheme
    case v.url.length > 262144:
      return [undefined, new Error('the URL is too long')] // prevent excessively long URLs
  }

  if (Object.prototype.hasOwnProperty.call(v, 'slug') && v.slug) {
    switch (true) {
      case (typeof v.slug as unknown) !== 'string':
        return [undefined, new Error('invalid slug type')] // slug must be a string
      case !/^[a-z0-9_~!*()+=%.-]+$/i.test(v.slug):
        return [undefined, new Error('invalid slug format')] // enforce valid slug format
      case v.slug.length > 512:
        return [undefined, new Error('the slug is too long')] // prevent excessively long slugs
    }
  }

  try {
    new URL(v.url) // ensure the URL is syntactically correct
  } catch (e) {
    return [undefined, new Error('invalid URL: ' + (e instanceof Error ? e : new Error(String(e))).message)]
  }

  return [v, undefined]
}

/**
 * Generates a short hash from a given string using SHA-256.
 *
 * This function computes SHA-256 hash of the input string and returns a short 5-character substring of
 * the hexadecimal hash.
 */
const generateHash = async (s: string): Promise<string> => {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))

  // convert hash to a hex string
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hashHex.substring(0, keyLength) // return only the first N characters as the short hash
}
