import { type Storage, type Cache } from '../storage'

/**
 * Handles incoming requests and redirects based on a key stored in cache or storage.
 */
export const handler = async (
  req: Request,
  storage: Storage,
  cache: Cache<string, string>
): Promise<Response | undefined> => {
  // extract the key from the request URL
  const key = req.url.split('/').pop()
  if (!key) {
    return // invalid key
  }

  let location: string

  // check if the key is cached
  const cached = cache.get(key)
  if (cached !== undefined) {
    location = cached // use the cached URL
  } else {
    // retrieve the entity from the KV storage
    const entity = await storage.get(key)
    if (entity === null) {
      return // entity not found
    }

    cache.put(key, entity.url) // put the entity in the cache
    location = entity.url // use the URL from the entity
  }

  // return a redirect response with an HTML page for GET requests
  return new Response(
    req.method === 'GET'
      ? `<!doctype html>
<html lang="en">
  <head>
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0;url=${location}">
    <style>
      html, body { background-color: #fff; }

      @media (prefers-color-scheme: dark) {
        html, body { background-color: #222526 !important; }
      }
    </style>
  </head>
</html>`
      : null, // empty response body for non-GET requests
    {
      status: 301, // permanent redirect
      headers: {
        Location: location, // redirect location
        'Referrer-Policy': 'no-referrer', // ensure privacy by not forwarding referrer
      },
    }
  )
}
