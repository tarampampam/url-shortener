/**
 * - Run `npm run gen` in your terminal to generate all the required types
 * - Run `npm run dev` to start a development server and open http://localhost:8787/ in your browser
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { createHandler, redirectHandler, jsonErr, authMiddleware } from './handlers'
import { isApiRequest, Router, routes } from './routing'
import { InMemory, KVStorage } from './storage'
import error404 from '../../static/404.html?raw'

// to decrease the number of KV reads, we cache the short link locations in memory. this approach allows the
// Worker to access frequently used data without querying the KV store each time. however, it's important to
// note that each Worker instance can consume up to 128 MB of memory, and instances may occasionally be
// evicted from memory, which would clear the cached data
const cache = new InMemory<string, string>(/* items count */ 16384)

/**
 * Initializes the application's router and defines route handlers.
 */
const router = new Router()
  // new short link creation API endpoint
  .put(routes.API_CREATE, (req, env) => createHandler(req, new KVStorage(env.KV)), authMiddleware)
  // health check endpoints (GET and HEAD)
  .get(routes.HEALTH, () => new Response('OK', { status: 200 }))
  .head(routes.HEALTH, () => new Response(null, { status: 200 }))
  // any other GET/HEAD request is treated as a short link redirect request
  .notFound((req, env) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return redirectHandler(req, new KVStorage(env.KV), cache)
    }
  })

export default {
  /**
   * Cloudflare Workers `fetch` event handler.
   *
   * This is the entry point for handling HTTP requests.
   * It delegates request handling to the router and falls back to serving static assets.
   */
  async fetch(req, env, ctx): Promise<Response> {
    // check the Cloudflare asset storage for the requested URL
    const asset = await env.ASSETS.fetch(req.clone())
    if (asset.ok) {
      return asset
    }

    // try to pass the request through the router
    try {
      const handled = await router.handle(req, env, ctx)
      if (handled) {
        return handled
      }
    } catch (e) {
      return isApiRequest(req)
        ? // return JSON error response for API requests
          jsonErr(e, 500)
        : // otherwise, return the 500 HTML page
          new Response(`Internal Server Error (${(e instanceof Error ? e : new Error(String(e))).message})`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
    }

    // if no asset/route matched the request, return a 404 response
    return isApiRequest(req)
      ? // return JSON error response for API requests
        jsonErr('not found', 404)
      : // otherwise, return the 404 HTML page
        new Response(error404, {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
  },
} satisfies ExportedHandler<Env>
