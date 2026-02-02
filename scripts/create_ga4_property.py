#!/usr/bin/env python3
"""
Create a GA4 property and web data stream via Google Analytics Admin API.

Prerequisites:
  1. Enable the API: https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com
  2. Authenticate: gcloud auth application-default login
     (or set GOOGLE_APPLICATION_CREDENTIALS to a service account key JSON)

Usage:
  python create_ga4_property.py [--account-id ACCOUNT_ID] [--property-name NAME] [--site-url URL]
  # Output: measurement ID (G-XXXXXXXXXX) to set as VITE_GA_MEASUREMENT_ID
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Optional: use repo scripts for path resolution
REPO_ROOT = Path(__file__).resolve().parents[3]


def get_credentials():
    """Application Default Credentials (gcloud auth application-default login or GOOGLE_APPLICATION_CREDENTIALS)."""
    try:
        import google.auth
        from google.auth.transport.requests import Request
        credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/analytics.edit"]
        )
        credentials.refresh(Request())
        return credentials
    except ImportError:
        print(
            "Install: pip install google-auth",
            file=sys.stderr,
        )
        sys.exit(1)
    except Exception as e:
        print(f"Credentials error: {e}", file=sys.stderr)
        print("Run: gcloud auth application-default login", file=sys.stderr)
        sys.exit(1)


def list_accounts(credentials) -> list[dict]:
    """GET /v1beta/accounts."""
    import requests
    token = credentials.token
    r = requests.get(
        "https://analyticsadmin.googleapis.com/v1beta/accounts",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    return data.get("accounts", [])


def create_property(credentials, account_id: str, display_name: str, time_zone: str = "America/Los_Angeles") -> dict:
    """POST /v1beta/properties."""
    import requests
    token = credentials.token
    r = requests.post(
        "https://analyticsadmin.googleapis.com/v1beta/properties",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "parent": f"accounts/{account_id}",
            "displayName": display_name,
            "timeZone": time_zone,
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def create_web_data_stream(
    credentials,
    property_id: str,
    display_name: str,
    default_uri: str,
) -> dict:
    """POST /v1beta/properties/{property_id}/dataStreams."""
    import requests
    token = credentials.token
    r = requests.post(
        f"https://analyticsadmin.googleapis.com/v1beta/properties/{property_id}/dataStreams",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "type": "WEB_DATA_STREAM",
            "displayName": display_name,
            "webStreamData": {
                "defaultUri": default_uri,
            },
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def main():
    parser = argparse.ArgumentParser(
        description="Create GA4 property and web stream via Admin API; prints measurement ID."
    )
    parser.add_argument(
        "--account-id",
        type=str,
        help="GA account ID (e.g. 123456789). If omitted, first account is used.",
    )
    parser.add_argument(
        "--property-name",
        type=str,
        default="markmhendrickson.com",
        help="Property display name (default: markmhendrickson.com)",
    )
    parser.add_argument(
        "--site-url",
        type=str,
        default="https://markmhendrickson.com",
        help="Web stream default URI (default: https://markmhendrickson.com)",
    )
    parser.add_argument(
        "--time-zone",
        type=str,
        default="America/Los_Angeles",
        help="Property time zone (default: America/Los_Angeles)",
    )
    args = parser.parse_args()

    credentials = get_credentials()

    account_id = args.account_id
    if not account_id:
        accounts = list_accounts(credentials)
        if not accounts:
            print("No GA accounts found. Create one at https://analytics.google.com/", file=sys.stderr)
            sys.exit(1)
        # name is "accounts/123"
        account_id = accounts[0]["name"].split("/")[-1]
        print(f"Using account: {accounts[0].get('displayName', account_id)} ({account_id})", file=sys.stderr)

    prop = create_property(
        credentials,
        account_id=account_id,
        display_name=args.property_name,
        time_zone=args.time_zone,
    )
    property_name_resource = prop["name"]  # properties/123456
    property_id = property_name_resource.split("/")[-1]

    stream = create_web_data_stream(
        credentials,
        property_id=property_id,
        display_name=args.property_name,
        default_uri=args.site_url.rstrip("/"),
    )
    measurement_id = stream.get("webStreamData", {}).get("measurementId")
    if not measurement_id:
        print("Stream created but measurementId missing:", json.dumps(stream, indent=2), file=sys.stderr)
        sys.exit(1)

    print(measurement_id)
    print(
        "\nAdd to GitHub Actions secrets: VITE_GA_MEASUREMENT_ID = " + measurement_id,
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
