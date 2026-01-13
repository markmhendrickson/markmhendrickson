# markmhendrickson.com

Personal website for Mark Hendrickson

## Current Status

**Published:** Static HTML site (deployed via GitHub Pages)

**Staged:** React + Vite + shadcn/ui app in `react-app/` directory (not yet ready for publishing)

## Static Site (Currently Published)

The site is currently deployed as static HTML files:
- `index.html` - Main landing page
- `newsletter.html` - Newsletter subscription page
- `newsletter-unsubscribe.html` - Newsletter unsubscribe page

Deployment is handled automatically via GitHub Actions on push to `main` branch.

## React App (Staged for Future)

A React application is being developed in the `react-app/` directory but is not yet ready for publishing.

### React App Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

### React App Development

To work on the React app:

```bash
cd react-app
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

### React App Build

```bash
cd react-app
npm run build
```

Output will be in the `react-app/dist/` directory.

## Deployment

The static HTML site is automatically deployed to GitHub Pages via the `.github/workflows/deploy.yml` workflow when changes are pushed to the `main` branch.

The React app in `react-app/` is not included in the deployment and will remain staged until ready for publishing.
