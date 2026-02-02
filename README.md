# Hi, I'm Mark

I build systems that restore sovereignty, clarity, and long-range capability to individuals in a world defined by complexity, centralized control, and cognitive overload.

My technology transforms chaos into structure, volatility into signal, and information abundance into actionable leverage, empowering people to operate with more agency, creativity, and strategic independence.

My work centers on designing personal infrastructure that is open, privacy-preserving, and fundamentally user-owned. Through data ingestion, contextual modeling, and automation, I eliminate friction and restore the time, mental bandwidth, and autonomy lost to modern digital and institutional systems. This gives people the structural foundation to think more deeply, act more decisively, and build more freely.

I take an antifragile approach: systems grow stronger through disruption, not weaker. The tools I build help people thrive under uncertainty, adapt intelligently to changing conditions, and make decisions from clarity rather than reactivity.

**Currently:**
- **[Neotoma](https://github.com/markmhendrickson/neotoma)** — user-owned memory layer for AI agents (MCP, structured data, provenance)
- **Ateles** — personal operating system backed by that layer (truth → strategy → execution)
- **[markmhendrickson.com](https://markmhendrickson.com)** — essays and updates (this repo builds the site)

**Elsewhere:** [Website](https://markmhendrickson.com) · [X @markymark](https://x.com/markymark) · [LinkedIn](https://linkedin.com/in/markmhendrickson)

---

*This repo is the source for markmhendrickson.com. React app in `react-app/`; deploy is GitHub Actions → Pages on push to `main`.*

**Deploy:** The `shared` submodule points at `github.com/markmhendrickson/react-components`. If that repo is private, add a repo secret `REPO_ACCESS_TOKEN` (PAT with `repo` scope) in this repo’s Settings → Secrets so the workflow can clone it. If the repo is public, no secret is needed.

**Analytics (GA4):** The site loads gtag when `VITE_GA_MEASUREMENT_ID` is set at build time. To create a property and web stream via the Google Analytics Admin API (no UI): enable [Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com), run `gcloud auth application-default login`, then `pip install google-auth requests` and `python scripts/create_ga4_property.py`. The script prints the measurement ID (G-…); add it as repo secret `VITE_GA_MEASUREMENT_ID` so the deploy workflow injects it into the build.
