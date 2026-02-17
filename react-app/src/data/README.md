# Static Data Directory

This directory contains all static JSON data files for the website.

## Purpose

All static data for the website (posts, links, timeline, etc.) MUST be stored in JSON files in this directory, not hardcoded in component files.

## Structure

- `links.json` - Links and profiles (social media, contact, etc.)
- `timeline.json` - Career timeline data for the Home page
- Additional JSON files as needed for other static data

## Usage

Import JSON files directly in components:

```javascript
import linksData from '@cache/links.json'
import timelineData from '@cache/timeline.json'
```

## Adding New Static Data

1. Create a new JSON file in this directory
2. Import and use in the appropriate component
3. Never hardcode arrays or objects in component files

## Examples

### Links
- File: `links.json`
- Used in: `pages/SocialMedia.jsx`
- Format: Array of objects with `name`, `url`, `icon`, `description`

### Timeline
- File: `timeline.json`
- Used in: `pages/Home.jsx`
- Format: Array of objects with `role`, `company`, `date`, `description`

### Posts
- Cache: `cache/posts.json`, `cache/links.json`, `cache/timeline.json` (generated from Neotoma export at build time)
- Used in: `pages/Posts.jsx`, `pages/Post.jsx`
- Format: Array of post metadata objects
