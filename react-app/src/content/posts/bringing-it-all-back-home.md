> "Now, I been in jail when all my mail showed, that a man can’t give his address out to bad company" - Bob Dylan, Absolutely Sweet Marie

Last summer I drove across the USA from New York City to San Francisco, mostly by myself. I took my time, stopping in many places along the way over the course of a relaxed month. I didn't have a predefined itinerary; I just wanted to discover and react to what I saw.

The trip granted me stretches of time to both reflect and record, which accentuated an increasing tendency in both my life and our culture in general. One moment I was ruminating about Civil War history, the other I was cropping a photo of a Robert E. Lee commemorative plaque and writing some commentary to share online.

The recording was not only an instantaneous way to share a bit of my journey with friends, family and followers. More importantly in the long run, it was my way of creating a breadcrumb trail of moments that would later help me remember and make sense of them.

Internet-connected software, aided by portable devices, has given us an unprecedented ability to create such live journals. But while enabling the online production of historical identities, the companies behind this software (e.g. Facebook, Twitter, Instagram, Foursquare, etc.) present two substantial shortcomings:

1. They keep our own data primarily on their own computers.

2. They provide, support and permit software for accessing our data only when it aligns with their business needs.

I have noodled on this set of problems before, but an epiphany of sorts hit me while walking the streets of Asheville, North Carolina just about a week and a half into my trip.

I had just finished posting a photo to Instagram, tweeting an observation on Twitter, and checking into a restaurant on Foursquare. All three of these actions constituted different ways to reflect and preserve the moment. But I was giving my impressions away to three separate companies that would keep the memories in  fragments on disparate servers over which I had no control. 

I had no practical way of bringing all these moments into a single place on which I could depend over the next five, ten, and fifty years. Nor could I access or create a cohesive representation of them, tailored to my liking. These cherished moments were to remain fragments of my identity, adrift in the proverbial cloud unless something changed.

The epiphany presented a core of a solution: **what if I had copies of all these moments on my Dropbox, alongside all of the other files I store there already?**

Dropbox (as well as other sync-based cloud storage solutions that have emerged in its wake such as Google Drive) is a beautiful tool because it bridges the local and network-based data realms. Any files you put into it will gain a dual property: stored both locally on your device, such as a laptop or desktop computer, and accessibly on the internet (i.e. the "cloud").

If Dropbox were to disappear tomorrow, you would still have your files on your computer. If your computer were to get destroyed, you would still have them on Dropbox.

But most importantly for the epiphany, these cloud storage solutions have APIs that make it possible to add, remove and view files within Dropbox accounts from other software on the internet. They can be used to copy all of the data I am currently giving away to online software companies to my Dropbox account for safekeeping.

From this idea was born [Asheville](http://asheville.io), a nascent open-source project on which I have been hacking over the past several months. The project's goal is not only to provide a user-friendly solution for syncing one's content (such as photos, status updates, checkins, blog posts, and reviews) over to a cloud storage account on a continual basis. It is also intended to help people do more with their data once it has been synced, by providing them with ways to make their data available to any number of third party software services (or their own).

In the purest sense, the project is all about helping people establish proper stakes on the web. We live in the digital age but as individuals, the vast majority of us do not have proper digital homes. Many companies are vying to provide them for us but ultimately, they cannot without playing a zero-sum game with our data. We should be empowered to own our personal online data, maintaining close control so we can use it and open it up to others as we please. Asheville is intended to help make that possible for non-technical and technical people alike.

There are a lot more details about the project on Github, and there is still much more to do before it will be ready for actual usage. But I have already made a lot of headway on the initial user experience, creating an [Ember](http://emberjs.com)-based web application that provides users with real-time updates on their sync status. Next comes tying this interface to backend software that does the work of actual copying the data from various social networks, publishing platforms and other online services to cloud storage accounts.

I have also just relaunched my personal website in preparation for dogfooding Asheville and showcasing the ways in which it can extend the application of your online data. This website is now built in Ember as well and is therefore [a proper JavaScript app](https://github.com/markmhx/markmhendrickson), not just a flat set of files with no way of processing and displaying data from external sources. Currently, it still shows only a set of blog posts  I have written, but soon I expect to add photo galleries, maps of places I have been, status updates and more. All of this will be powered in large part by the data I have already posted elsewhere online.

If you are interested in getting involved with Asheville, please do not hesitate to get in touch with me. Thanks already to [Jack Pearkes](http://jack.ly/) and [Ryan Barrett](http://snarfed.org/) for helping out. And if you would simply like to try the product once ready, [leave us your contact information](https://docs.google.com/forms/d/1i2iHhLVcfhYIEHPS5G7iD0gC4z-K-2e535GLGrj_qNE/viewform) for further updates.