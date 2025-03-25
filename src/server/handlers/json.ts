/**
 * Converts data to JSON and sets the appropriate headers.
 */
export const json = (data: unknown, status: number = 200, headers?: { [name: string]: string }): Response => {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

/**
 * Converts an error message to JSON and sets the appropriate headers.
 */
export const jsonErr = (e: Error | unknown, status: number, headers?: { [name: string]: string }): Response => {
  const err: Readonly<Error> = e instanceof Error ? e : new Error(String(e))

  return json({ error: err.message }, status, headers)
}
