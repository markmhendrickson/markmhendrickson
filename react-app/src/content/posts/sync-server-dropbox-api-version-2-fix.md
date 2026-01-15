As part of my working sprint at [IndieWebCamp Berlin](https://indieweb.org/2017/Berlin) today, I managed to fix a show-stopping bug that’s been in production for [sync-server](https://github.com/neotoma/sync-server) on [Neotoma.io](https://neotoma.io) apparently since September 28, 2017 when [Dropbox fully retired its API v1](https://blogs.dropbox.com/developers/2017/09/api-v1-shutdown-details/) in favor of API v2.

I wasn’t aware of this bug until this week since error handling in production hasn’t been set to notify me (via email or otherwise), but setting up that notification is now [a prioritized task](https://github.com/neotoma/sync-server/issues/87) to avoid silent problems like this one in the future.

After digging through the code, it turned out that the [Passport](http://www.passportjs.org/) implementation for Dropbox specifically was not passing an `apiVersion` parameter upon initialization of [its strategy](https://github.com/florianheinemann/passport-dropbox-oauth2), and as such, it was defaulting to Dropbox’s API v1 without my realization.

I’ve added `apiVersion` [as a parameter here](https://github.com/neotoma/sync-server/commit/d9b1f15400201ef962a8dea79a121ad9d996c686#diff-25ac49459f3ccaa62fa691b8b449625cR69) and also as an attribute on the [storage model](https://github.com/neotoma/sync-server/commit/d9b1f15400201ef962a8dea79a121ad9d996c686#diff-430f49ef85b837131a35d1dd553659aeR23), specifically setting it to “2” for Dropbox’s storage document.

*Note: This attribute apparently needs to be a string, not an integer, the latter of which failed to work for me when attempted.*

```
req.strategy = new passportStrategy.Strategy({
  apiVersion: document.apiVersion,
  clientID: document.clientId,
  clientSecret: document.clientSecret,
  consumerKey: document.clientId,
  consumerSecret: document.clientSecret,
  callbackURL: `${req.protocol}://${req.get('host')}${path.resolve('/', Model.modelType(), document.slug, 'auth-callback')}`,
  passReqToCallback: true,
  profileFields: ['id', 'displayName', 'emails']
}...
```

As a result, Dropbox authentication now works again and I’ve been able to run a backup job for my Foursquare / Swarm check-ins, syncing the most recent ones to my Dropbox since last running backup earlier in the summer.