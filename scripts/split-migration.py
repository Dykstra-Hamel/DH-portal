#!/usr/bin/env python3
"""
Split large migration file into smaller chunks.

Usage:
    python3 scripts/split-migration.py <input_file> <records_per_file>
"""

import sys
import re
from datetime import datetime, timedelta

def split_migration(input_file: str, records_per_chunk: int = 1000):
    """Split a large migration file into smaller chunks."""

    with open(input_file, 'r') as f:
        content = f.read()

    # Extract header (everything before first INSERT)
    header_match = re.search(r'(.*?BEGIN\n)', content, re.DOTALL)
    if not header_match:
        print("Error: Could not find BEGIN block", file=sys.stderr)
        return

    header = header_match.group(1)

    # Extract company UUID from header
    company_uuid_match = re.search(r"company_uuid UUID := '([^']+)'", header)
    company_uuid = company_uuid_match.group(1) if company_uuid_match else 'unknown'

    # Extract footer
    footer = "\n  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;\nEND $$;\n"

    # Find all INSERT blocks (each record is: comment + INSERT + pest_count increment + optional record_count increment)
    insert_pattern = r'(  -- Form \d+:.*?\n.*?pest_count := pest_count \+ 1;(?:\n  record_count := record_count \+ 1;)?)'
    inserts = re.findall(insert_pattern, content, re.DOTALL)

    print(f"Found {len(inserts)} insert statements", file=sys.stderr)

    # Split into chunks
    total_chunks = (len(inserts) + records_per_chunk - 1) // records_per_chunk

    # Get base filename and extract timestamp
    base_name = input_file.rsplit('.sql', 1)[0]

    # Extract timestamp from filename (format: YYYYMMDDHHmmss)
    timestamp_match = re.search(r'/(\d{14})_', base_name)
    if not timestamp_match:
        print("Error: Could not extract timestamp from filename", file=sys.stderr)
        return

    base_timestamp_str = timestamp_match.group(1)
    base_timestamp = datetime.strptime(base_timestamp_str, "%Y%m%d%H%M%S")

    # Extract description (everything after timestamp and underscore)
    desc_match = re.search(r'/\d{14}_(.+)$', base_name)
    description = desc_match.group(1) if desc_match else 'migration'

    for chunk_idx in range(total_chunks):
        start_idx = chunk_idx * records_per_chunk
        end_idx = min((chunk_idx + 1) * records_per_chunk, len(inserts))
        chunk_inserts = inserts[start_idx:end_idx]

        # Increment timestamp by chunk_idx seconds to ensure uniqueness
        chunk_timestamp = base_timestamp + timedelta(seconds=chunk_idx)
        chunk_timestamp_str = chunk_timestamp.strftime("%Y%m%d%H%M%S")

        # Create output filename with unique timestamp
        base_dir = base_name.rsplit('/', 1)[0] if '/' in base_name else '.'
        output_file = f"{base_dir}/{chunk_timestamp_str}_{description}_part{chunk_idx + 1}.sql"

        # Write chunk file
        with open(output_file, 'w') as f:
            # Write header
            f.write(f"""-- Bulk Import Pest Pressure Data Points (Part {chunk_idx + 1}/{total_chunks})
-- Company: {company_uuid}
-- Records: {start_idx + 1} to {end_idx}

DO $$
DECLARE
  company_uuid UUID := '{company_uuid}';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN

""")

            # Write inserts
            for insert in chunk_inserts:
                f.write(insert + '\n')

            # Write footer
            f.write(footer)

        print(f"Created {output_file} with {len(chunk_inserts)} records", file=sys.stderr)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/split-migration.py <input_file> [records_per_file]", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    records_per_chunk = int(sys.argv[2]) if len(sys.argv) > 2 else 1000

    split_migration(input_file, records_per_chunk)
