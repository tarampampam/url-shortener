import { isApiRequest, type Middleware } from '../routing'
import { jsonErr } from './json'

/**
 * To protect some of the routes, we use a middleware that checks for an auth token in the request environment
 * and compares it to the `Authorization` header. If the token is missing or invalid, the middleware returns
 * an unauthorized response.
 *
 * The authorization token must be set in the Worker environment variables, empty string or `null` disables
 * the middleware.
 */
export const authMiddleware: Middleware = (next) => {
  return async (req, env, ctx) => {
    // extract the auth token from the environment
    const authToken = env.AUTH_TOKEN ?? null

    if (authToken) {
      // check if the request includes an `Authorization` header with the auth token
      if (req.headers.get('Authorization') !== `Bearer ${authToken}`) {
        if (isApiRequest(req)) {
          return jsonErr('unauthorized', 401)
        }

        return new Response('Unauthorized', { status: 401 })
      }
    }

    return next(req, env, ctx)
  }
}
