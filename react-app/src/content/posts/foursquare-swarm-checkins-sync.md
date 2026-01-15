[Neotoma](https://neotoma.io) ([on GitHub](https://github.com/neotoma)) now backs up all of my [Foursquare](http://foursquare.com) / [Swarm](https://www.swarmapp.com) check-ins to my Dropbox account whereupon they’re republished instantly to my website on {{#link-to 'checkins'}}a new check-ins page{{/link-to}}.

This setup relies on {{#link-to 'post' $post-dropbox-website-publishing.id}}the same publishing technique{{/link-to}} as my other website content as well as [recent changes to the Neotoma sync software](https://github.com/neotoma/sync-server/commit/fc5a2a2412ad405f5e1c670f1f6963c4300fe527#diff-6365ffb16fdc3a539e4cda9e40ab2a1cR825).

That software now transforms Foursquare check-ins copied initially in a proprietary JSON format from its API (e.g. [one from this past weekend](https://gist.github.com/markmhx/52d49a3ed4328c6141271b2640a25eea)) into a cleaner [JSON API](http://jsonapi.org/) format before saving them to Dropbox so [my website software](https://github.com/neotoma/personal-server) can easily understand and serve them as content:

```
{
  data: {
    id: "foursquare-5a0719c1d4cc9849790606eb",
    type: "check-ins",
    attributes: {
      place-state: "Catalonia",
      place-postal: "43840",
      place-name: "Corcega",
      place-longitude: 1.1382177519242145,
      place-latitude: 41.076488193500616,
      place-country-code: "ES",
      place-country: "Spain",
      place-city: "Salou",
      place-category: "Spanish Restaurant",
      place-address: "C. Major, 31",
      photo-url: "https://igx.4sqi.net/img/general/original/11437_gvUS2Nmh9bAaE7O2PP98sz5TZTzTbzr-wQlEShLGkmU.jpg",
      likes-count: 1,
      foursquare-venue-id: "4d0bce3d46bab60c9cc82990",
      description: "Primera calçotada de l’any!",
      created-at: "2017-11-11T15:39:45.000Z"
    }
  }
}
```

The exact format I use here is definitely going to evolve as I build out functionality around this data on my website. For example, I plan to break out the places embedded in check-ins into their own files so I can rank the places I visit by frequency. But for now this format provides a quick and simple way to get the check-ins displayed reverse chronologically.

Also, Neotoma currently conducts a full historic backup of my check-ins when I connect my Dropbox and Foursquare accounts to it, but it doesn't keep watching for new check-ins.

I'll be improving the system shortly to sync all new / future check-ins automatically so they appear on my website as well, both on the above check-ins page and on the homepage where I show my latest check-in up top.