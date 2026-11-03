# Shared-page short links

The GitHub Pages build can generate standalone `/p/<slug>/` pages that redirect
to Neotoma rendered pages. Share `/p/<slug>?t=<access-token>`; GitHub Pages adds
the trailing slash, and the page forwards `t` as `access_token` using
`location.replace`. Neotoma still validates the token, including its scope and
revocation. A short link does not grant access by itself.

Configure the repository Actions secret `NEOTOMA_SHORT_LINKS_JSON` with a
token-free JSON object. For example, using synthetic values:

```json
{
  "origin": "https://records.example",
  "links": {
    "shared-page": "ent_0123456789abcdef01234567"
  }
}
```

Add or change a slug in that private configuration, then run the normal website
build/deployment. For local builds, supply the same environment variable from
your existing private configuration process. Never put an access token in this
configuration, source files, terminal commands, logs, or committed fixtures.
An absent configuration generates no short links; invalid configuration fails
the build without printing its contents. Each build removes obsolete generated
short-link pages. Unknown slugs retain the site's normal 404 behavior.

Slugs contain lowercase letters, digits and single separating hyphens, with a
maximum length of 80 characters. Destinations must be Neotoma entity IDs, all on
one configured HTTPS origin. The request cannot choose a destination. Exactly
one nonempty `t` query parameter is accepted; extra parameters, fragments,
duplicate tokens, malformed encoding, whitespace and control characters show
an error without navigating. JavaScript is required.

Generated pages have no analytics, external assets, cookies or browser storage.
They request no indexing and suppress referrers. They are excluded from the
site's sitemap and navigation. Their token-free destination is visible in the
generated HTML to anyone who knows the short URL; this is a redirect, not a
proxy or a way to hide the destination. The complete shared URL remains an
access-bearing URL: hosting infrastructure and browser history can see its
query string, just as they can for a direct Neotoma link.

Run `npm run test:short-links` in `react-app` for the generator and actual inline
redirect behavior. `npm run build:ci` generates these pages after the usual
prerender verification. Pull-request CI uses only synthetic mapping values;
production obtains its mapping from the private Actions secret.
