/** Determines if a request is an API request. */
export const isApiRequest = (req: Request): boolean => {
  // dirty, but fast check if the request is an API request; alternative:
  // `{ pathname } = new URL(req.url); return pathname.startsWith('/api')`
  return req.url.split('/').slice(3)[0].startsWith('api')
}
