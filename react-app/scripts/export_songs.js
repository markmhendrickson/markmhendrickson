#!/usr/bin/env node
/**
 * Export songs from parquet to JSON for the website
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '../../../../..')

// Use the parquet client to read songs
const parquetClientPath = join(repoRoot, 'execution/scripts/parquet_client.py')

async function exportSongs() {
  try {
    // Call parquet client to read all songs
    const result = execSync(
      `python3 -c "
import sys
sys.path.insert(0, '${repoRoot}/execution/scripts')
from parquet_client import ParquetMCPClient
import json

client = ParquetMCPClient()
songs = client.call_tool_sync('read_parquet', {
    'data_type': 'songs',
    'limit': 10000
})

# Extract just the data array
data = songs.get('data', [])
print(json.dumps(data, indent=2, default=str))
"`,
      { encoding: 'utf-8', cwd: repoRoot }
    )

    const songs = JSON.parse(result)

    // Write to public JSON file
    const outputPath = join(__dirname, '../public/data/songs.json')
    const outputDir = dirname(outputPath)
    
    // Ensure directory exists
    execSync(`mkdir -p "${outputDir}"`, { cwd: repoRoot })
    
    writeFileSync(outputPath, JSON.stringify(songs, null, 2))
    console.log(`✅ Exported ${songs.length} songs to ${outputPath}`)
  } catch (error) {
    console.error('Error exporting songs:', error)
    process.exit(1)
  }
}

exportSongs()
