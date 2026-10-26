#!/usr/bin/env python3
"""Keep the professional-mission cache entry bound to repository content."""
import json
from pathlib import Path

root = Path('.')
md_path = root / 'src' / 'content' / 'posts' / 'professional-mission.md'
manifest_path = root / 'src' / 'content' / 'posts' / 'posts.json'
cache_posts_path = root / 'cache' / 'posts.json'
cache_api_posts_path = root / 'cache' / 'api' / 'posts.json'

body = md_path.read_text(encoding='utf-8')
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
src = next((p for p in manifest if p.get('slug') == 'professional-mission'), None)
if src is None:
  raise RuntimeError('professional-mission not found in src/content/posts/posts.json')

def patch_post(post: dict) -> None:
  post['title'] = src.get('title', post.get('title', 'Mark Hendrickson'))
  post['excerpt'] = src.get('excerpt', post.get('excerpt', ''))
  post['body'] = body
  post['published'] = True
  post['publishedDate'] = src.get('publishedDate', post.get('publishedDate', '2025-01-01'))
  post['category'] = src.get('category', post.get('category', 'essay'))
  post['heroImage'] = src.get('heroImage', post.get('heroImage', 'profile.jpg'))
  post['heroImageStyle'] = src.get('heroImageStyle', post.get('heroImageStyle', 'float-right'))
  post['excludeFromListing'] = src.get('excludeFromListing', post.get('excludeFromListing', True))
  post['showMetadata'] = src.get('showMetadata', post.get('showMetadata', False))

cache_posts = json.loads(cache_posts_path.read_text(encoding='utf-8'))
entry = next((p for p in cache_posts if p.get('slug') == 'professional-mission'), None)
if entry is None:
  entry = {'slug': 'professional-mission'}
  cache_posts.append(entry)
patch_post(entry)
cache_posts_path.write_text(json.dumps(cache_posts, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

api_payload = json.loads(cache_api_posts_path.read_text(encoding='utf-8'))
posts = api_payload.get('posts') or []
api_entry = next((p for p in posts if p.get('slug') == 'professional-mission'), None)
if api_entry is None:
  api_entry = {'slug': 'professional-mission'}
  posts.append(api_entry)
patch_post(api_entry)
api_payload['posts'] = posts
cache_api_posts_path.write_text(json.dumps(api_payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Forced professional-mission in cache/posts.json and cache/api/posts.json')
