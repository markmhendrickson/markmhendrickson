// Netlify Edge Function: HTTP Basic Auth for dev.markmhendrickson.com
// Runs before every request — blocks unauthenticated access.

export default async function handler(request: Request) {
  const authHeader = request.headers.get("Authorization")

  if (authHeader) {
    const encoded = authHeader.replace("Basic ", "")
    const decoded = atob(encoded)
    const [, password] = decoded.split(":")
    const expected = Deno.env.get("DEV_SITE_PASSWORD") ?? "devpreview"
    if (password === expected) {
      return  // Allow request to proceed
    }
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Dev Preview", charset="UTF-8"',
    },
  })
}

export const config = {
  path: "/*",
}
