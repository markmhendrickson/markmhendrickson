# markmhendrickson.com

Personal website for Mark Hendrickson - Built with React + Vite + shadcn/ui

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **shadcn/ui** - Component library (Select, Checkbox, Label)
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

## Local Development

Start the development server:

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Build

Build for production:

```bash
npm run build
```

Output will be in the `dist/` directory.

## Deployment to GitHub Pages

The site is configured for GitHub Pages deployment. After building:

1. Build the project: `npm run build`
2. Copy `CNAME` to `dist/`: `cp CNAME dist/`
3. Commit and push the `dist/` directory to the `gh-pages` branch

Or use the GitHub Actions workflow (if configured) to automatically deploy on push to main.

## Project Structure

```
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── pages/           # Page components
│   │   ├── Home.jsx
│   │   └── Newsletter.jsx
│   ├── lib/             # Utilities
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles + Tailwind
├── dist/                # Build output (for GitHub Pages)
└── backup/              # Old HTML files (backup)

```

## Components

- **Home** - Main landing page with bio and timeline
- **Newsletter** - Newsletter subscription form with ICP survey using shadcn/ui Select and Checkbox components
