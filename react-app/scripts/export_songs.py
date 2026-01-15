#!/usr/bin/env python3
"""
Export songs from parquet to JSON for the website
"""

import json
import sys
from pathlib import Path

# Add parent directories to path
script_dir = Path(__file__).parent
repo_root = script_dir.parent.parent.parent.parent
execution_scripts = repo_root / "execution" / "scripts"

# Add to path and import
sys.path.insert(0, str(execution_scripts))
sys.path.insert(0, str(repo_root))

from parquet_client import ParquetMCPClient

def main():
    # Find parquet server path (try multiple locations)
    possible_paths = [
        repo_root / "mcp" / "parquet" / "parquet_mcp_server.py",
        Path("/Users/markmhendrickson/repos/personal/mcp/parquet/parquet_mcp_server.py"),
    ]
    
    parquet_server_path = None
    for path in possible_paths:
        if path.exists():
            parquet_server_path = path
            break
    
    if not parquet_server_path:
        print(f"Error: Parquet server not found. Tried:")
        for path in possible_paths:
            print(f"  - {path}")
        sys.exit(1)
    
    # Initialize parquet client with explicit path
    client = ParquetMCPClient(parquet_server_path=str(parquet_server_path))
    
    # Read only favorite songs
    result = client.call_tool_sync("read_parquet", {
        "data_type": "songs",
        "filters": {
            "favorite": True
        },
        "limit": 10000
    })
    
    songs = result.get("data", [])
    
    # Write to public JSON file
    output_path = script_dir.parent / "public" / "data" / "songs.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(songs, f, indent=2, default=str, ensure_ascii=False)
    
    print(f"✅ Exported {len(songs)} songs to {output_path}")

if __name__ == "__main__":
    main()
