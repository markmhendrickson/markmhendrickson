#!/usr/bin/env python3
"""Exercise the repository-owned post overlay against divergent local caches."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SLUG = "professional-mission"
HELPER = ROOT / "scripts" / "force_professional_mission.py"


class ProfessionalMissionOverlayTest(unittest.TestCase):
    def setUp(self):
        self.fixture = tempfile.TemporaryDirectory(prefix=".professional-mission-test-", dir=ROOT)
        self.root = Path(self.fixture.name)
        source = ROOT / "src" / "content" / "posts"
        self.manifest = next(
            post for post in json.loads((source / "posts.json").read_text(encoding="utf-8"))
            if post.get("slug") == SLUG
        )
        self.body = (source / f"{SLUG}.md").read_text(encoding="utf-8")
        self.expected = {**self.manifest, "body": self.body}
        destination = self.root / "src" / "content" / "posts"
        destination.mkdir(parents=True)
        (destination / "posts.json").write_text(json.dumps([self.manifest]), encoding="utf-8")
        (destination / f"{SLUG}.md").write_text(self.body, encoding="utf-8")
        (self.root / "cache" / "api").mkdir(parents=True)

    def tearDown(self):
        self.fixture.cleanup()

    def run_overlay(self, cache_posts, api_posts):
        unrelated = {"slug": "fixture-unrelated", "title": "Keep this record", "published": False}
        cache_input = [unrelated, *cache_posts]
        api_input = {"url": "https://example.test/api/posts.json", "posts": [unrelated, *api_posts]}
        (self.root / "cache" / "posts.json").write_text(json.dumps(cache_input), encoding="utf-8")
        (self.root / "cache" / "api" / "posts.json").write_text(json.dumps(api_input), encoding="utf-8")
        subprocess.run([sys.executable, str(HELPER)], cwd=self.root, check=True, capture_output=True, text=True)
        cache_output = json.loads((self.root / "cache" / "posts.json").read_text(encoding="utf-8"))
        api_output = json.loads((self.root / "cache" / "api" / "posts.json").read_text(encoding="utf-8"))
        self.assertEqual(api_output["url"], api_input["url"])
        for output in (cache_output, api_output["posts"]):
            self.assertEqual(output[0], unrelated, "unrelated cache entry must stay intact")
            matches = [post for post in output if post.get("slug") == SLUG]
            self.assertEqual(len(matches), 1, "one target entry in each cache")
            self.assertEqual(matches[0], self.expected, "complete target entry must bind to manifest and markdown")

    def test_divergent_entries_in_both_caches_are_replaced_completely(self):
        corrupted = {**self.manifest, "title": "stale", "excerpt": "stale", "body": "stale",
                     "published": False, "publishedDate": "1900-01-01", "category": "stale",
                     "heroImage": "stale.png", "heroImageStyle": "stale", "excludeFromListing": False,
                     "showMetadata": True, "readTime": -1, "tags": ["stale"],
                     "createdDate": "1900-01-01", "updatedDate": "1900-01-01", "staleField": "remove"}
        alternate = {**corrupted, "title": "different stale title", "excerpt": "different stale excerpt"}
        self.run_overlay([corrupted], [alternate])

    def test_missing_entries_are_appended_without_changing_other_posts(self):
        self.run_overlay([], [])


if __name__ == "__main__":
    unittest.main()
