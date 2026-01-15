As I’ve been working more or less full-time on [Neotoma](https://neotoma.io) (formerly Asheville) since last summer, I’ve had the opportunity to cut my teeth truly on open-source software for the first time.

I’m happy to say that in addition to working on publicly available repositories specific to Neotoma, I’ve created a few repositories that are hopefully useful as modules to other Node.js apps in general:

- [Park Ranger](https://github.com/markmhx/park-ranger): A manager for environment-specific dependencies such as environment variables, configuration files and SSL certificate files.

  It’s called “park ranger” because a computer program always runs in a given environment, often determined by its device or a specific environment chosen within that device alongside other possible environments. And whom do you seek out when you’re enjoying the natural environment and have questions about it…? That’s right, a park ranger.

  I basically kept rewriting the same utility code across my repositories to handle environment-based differences, mainly between my local development machine and deployment host. So, I refactored it all into this module to speed up code improvements and maintenance going forward. My starting point was [dotenv](https://github.com/motdotla/dotenv) but I quickly realized it was too simple for my needs.

- [Hoist](https://github.com/markmhx/grunt-hoist): A suite of Grunt tasks to deploy Node.js apps to hosts and execute related remote procedures.

  Similar to my experience with Park Ranger, I found myself rewriting slight variations of the same deployment routines across repositories (such as rsync'ing files, running "npm install" and restarting the remote server). So I created this set of tasks (which automatically make themselves available to parent projects as npm scripts) to standardize the way in which I approach this. They also greatly simplify my approach to continual development, even as I spin up new micro-services or make quick changes to local dependencies along the way.

- [Proxy](https://github.com/neotoma/proxy): A proxy server for HTTP and HTTPS requests.

  As I began hosting early versions of Neotoma for closed testing, I needed a simple way to support different servers running on the same host across protocols (HTTP vs. HTTPS), ports and subdomains. For example, the same host that uses HTTP to serve the landing page for Neotoma also serves HTTPS requests to its underlying API and both HTTP and HTTPS requests to the actual Neotoma web app running on a subdomain for testing.

  While this repository lives under the Neotoma organization, it can be used by anyone who wants to do the same for their hosts that run multiple servers.

There are a number of other public repositories under development more directly related to Neotoma that I won’t list here but can be found on the [Neotoma GitHub organization](https://github.com/neotoma). While I haven’t actively sought contributions yet, all of the repositories listed above and in that organization are open to pull requests should you want to make any changes!