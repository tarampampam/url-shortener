import { describe, expect, test } from 'vitest'
import { type Handler, Router } from './router'

describe('router', () => {
  const [env, ctx] = [{} as Env, {} as ExecutionContext]

  test('common', async () => {
    const router = new Router()
      .get('/get', (req) => {
        const url = new URL(req.url)
        const a = parseInt(url.searchParams.get('a') ?? '0')
        const b = parseInt(url.searchParams.get('b') ?? '0')

        return new Response(String(a + b))
      })
      .post('/post', () => new Response('post'))

    // table test to check if the router works correctly
    for (const [req, expected] of [
      [new Request('https://example.com/get?a=1&b=2'), '3'],
      [new Request('https://example.com/get?a=1&b=3'), '4'],
      [new Request('https://example.com/get?a=1&b=4'), '5'],
      [new Request('https://example.com/get?a=1&b=4', { method: 'POST' }), undefined],
      [new Request('https://example.com/get?a=1&b=4', { method: 'PUT' }), undefined],
      [new Request('https://example.com/post', { method: 'POST' }), 'post'],
      [new Request('https://example.com/post', { method: 'GET' }), undefined],
    ] satisfies Array<[Request, string | undefined]>) {
      const response = await router.handle(req, env, ctx)

      expect(await response?.text()).toBe(expected)
    }
  })

  test('middleware', async () => {
    const router = new Router().get(
      '/test',
      () => new Response('pass'),
      (next: Handler): Handler => {
        return async (req, env, ctx) => {
          const resp = await next(req, env, ctx)

          resp!.headers.set('x-handler-mw', 'ok')

          return resp
        }
      }
    )

    router.use((next: Handler): Handler => {
      return async (req, env, ctx) => {
        const resp = await next(req, env, ctx)

        resp!.headers.set('x-global-mw', 'ok')

        return resp
      }
    })

    const response = await router.handle(new Request('https://example.com/test'), env, ctx)

    expect(response?.headers.get('x-handler-mw')).toBe('ok')
    expect(response?.headers.get('x-global-mw')).toBe('ok')
    expect(await response?.text()).toBe('pass')
  })

  test('not found', async () => {
    const router = new Router()

    const response = await router.handle(new Request('https://example.com/not-found'), env, ctx)

    expect(response).toBeUndefined()
  })

  test('not found handler', async () => {
    const router = new Router()

    const response = await router
      .notFound(() => new Response('boom!', { status: 401 }))
      .handle(new Request('https://example.com/not-found'), env, ctx)

    expect(await response!.text()).toBe('boom!')
    expect(response!.status).toBe(401)
  })
})
