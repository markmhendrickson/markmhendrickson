# markmhendrickson.com

Personal website for Mark Hendrickson

## Current Status

**Published:** Static HTML site (deployed via GitHub Pages)

**Staged:** React + Vite + shadcn/ui app in `react-app/` directory (not yet ready for publishing)

## Static Site (Currently Published)

The site is currently deployed as static HTML files:
- `index.html` - Main landing page

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

To run the development server and preview changes:

```bash
cd react-app
npm install  # Only needed on first setup or after dependency changes
npm run dev
```

The dev server will start and display a URL (typically `http://localhost:5173`). Open this URL in your browser to preview changes. The server will automatically reload when you make changes to the code.

**Available commands:**
- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally

### React App Build

```bash
cd react-app
npm run build
```

Output will be in the `react-app/dist/` directory.

## Deployment

The static HTML site is automatically deployed to GitHub Pages via the `.github/workflows/deploy.yml` workflow when changes are pushed to the `main` branch.

The React app in `react-app/` is not included in the deployment and will remain staged until ready for publishing.
