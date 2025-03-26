/**
 * Represents a request handler function that processes an incoming request and returns a response. It may be
 * asynchronous.
 */
export type Handler = (
  req: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response | undefined> | Response | undefined

/**
 * Middleware function that wraps a handler, allowing pre- or post-processing
 * of requests and responses.
 */
export type Middleware = (next: Handler) => Handler

/**
 * A function that determines if a request matches a specific condition.
 */
type Matcher = (req: Request, url: URL) => boolean

/**
 * Represents supported HTTP methods.
 */
type HTTPMethod = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PATCH' | 'PUT'

/**
 * Creates a matcher that checks if a request matches a specific HTTP method and path.
 */
export const methodAndPatch = (method: HTTPMethod, patch: string): Matcher => {
  return (req: Request, url: URL) => req.method === method && url.pathname === patch
}

/**
 * A lightweight router for handling HTTP requests with middleware support.
 */
export class Router {
  // stores route matchers and their corresponding handlers and middleware
  protected routes: Map<Matcher, { handler: Handler; middleware: Array<Middleware> }> = new Map()

  // stores middleware applied to all routes
  protected middleware: Array<Middleware> = []

  // handler for requests that do not match any route
  protected notFoundHandler: Handler | undefined

  /** Registers a GET request handler for a specific path. */
  public get(path: string, handler: Handler, ...mw: Array<Middleware>): this {
    return this.register(methodAndPatch('GET', path), handler, ...mw)
  }

  /** Registers a DELETE request handler for a specific path. */
  public delete(path: string, handler: Handler, ...mw: Array<Middleware>): this {
    return this.register(methodAndPatch('DELETE', path), handler, ...mw)
  }

  /** Registers a HEAD request handler for a specific path. */
  public head(path: string, handler: Handler, ...mw: Array<Middleware>): this {
    return this.register(methodAndPatch('HEAD', path), handler, ...mw)
  }

  /** Registers an OPTIONS request handler for a specific path. */
  public options(path: string, handler: Handler, ...mw: Array<Middleware>): this {
    return this.register(methodAndPatch('OPTIONS', path), handler, ...mw)
  }

  /** Registers a POST request handler for a specific path. */
  public post(path: string, handler: Handler, ...mw: Array<Middleware>): this {
    return this.register(methodAndPatch('POST', path), handler, ...mw)
  }

  /** Registers a PATCH request handler for a specific path. */
  public patch(path: string, handler: Handler, ...mw: Array<Middleware>): this {
    return this.register(methodAndPatch('PATCH', path), handler, ...mw)
  }

  /** Registers a PUT request handler for a specific path. */
  public put(path: string, handler: Handler, ...mw: Array<Middleware>): this {
    return this.register(methodAndPatch('PUT', path), handler, ...mw)
  }

  /** Registers a request handler and its middleware for a given matcher. */
  public register(matcher: Matcher, handler: Handler, ...middleware: Array<Middleware>): this {
    this.routes.set(matcher, { handler, middleware })

    return this
  }

  /** Registers global middleware that applies to all routes, including notFoundHandler. */
  public use(...mw: Array<Middleware>): this {
    this.middleware.push(...mw)

    return this
  }

  /** Registers a handler for requests that do not match any route. */
  public notFound(handler: Handler): this {
    this.notFoundHandler = handler

    return this
  }

  /** Finds a matching route for a given request. */
  protected find(req: Request): { handler: Handler; middleware: Array<Middleware> } | undefined {
    const url = new URL(req.url)

    for (const [matcher, { handler, middleware }] of this.routes.entries()) {
      if (matcher(req, url)) {
        return { handler, middleware }
      }
    }

    return undefined
  }

  /**
   * Handles an incoming request by finding a matching route, applying middleware, and executing the
   * corresponding handler.
   */
  public handle = (req: Request, env: Env, ctx: ExecutionContext): ReturnType<Handler> => {
    let handler: Handler | undefined
    const middleware: Array<Middleware> = []

    const route = this.find(req)
    if (route === undefined) {
      if (this.notFoundHandler) {
        handler = this.notFoundHandler
      } else {
        return // mo money, no funny, honey bunny
      }
    } else {
      handler = route.handler
      middleware.push(...route.middleware)
    }

    // compose route-specific middleware, applying them in reverse order
    const handlerComposed = middleware.reduceRight((next, mw) => mw(next), handler)

    // apply global middleware to the composed handler
    const globalComposed = this.middleware.reduceRight((next, mw) => mw(next), handlerComposed)

    return new Promise((resolve): void => {
      resolve(globalComposed(req, env, ctx))
    })
  }
}
