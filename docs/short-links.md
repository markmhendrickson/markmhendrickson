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

Agents use Ateles's `execution/scripts/publish_rendered_page.py` owning workflow
to publish an approved guest page and automatically register or reuse its alias.
The complete token-free registry lives in the owning private
`deployment_configuration.short_links` binding. Initialize it by importing the
complete known existing map and verified secret metadata; GitHub cannot return
encrypted secret contents. All registry/secret writers must use that workflow
on its one configured publisher host and account. Do not race it with manual
secret edits. It preserves every existing alias and shares a shortened URL only
after deployment and recipient-path verification; failures retain a verified
original URL or hold safely with outstanding work. Native Neotoma publishing
calls themselves continue to return long URLs.

The helper dispatches `deploy.yml` on the repository's default branch using an
opaque `alias_request_id` and `expected_source_sha`. The workflow serializes
Pages deployments, reads the current private registry secret during each build,
and rejects source that no longer equals the default-branch head before building
and before publishing. Do not rerun an older source to recover a failed alias
publication. Reconcile ambiguous secret writes or dispatches using the owning
Ateles workflow's documented recovery procedure rather than guessing contents
or blindly repeating an effect.

For local builds, supply the same environment variable from
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
