#!/usr/bin/env python3
"""
Parse form submissions CSV and generate SQL migration for pest pressure data points.

Usage:
    python3 scripts/parse-forms-csv.py /path/to/csv <company_uuid> [default_state] > migration.sql

    default_state: Optional 2-letter state code to use when ZIP code is not available (e.g., PA, CA, TX)
"""

import csv
import sys
import re
from datetime import datetime
from typing import List, Tuple, Optional

# Pest keyword mapping (same as production aggregator)
PEST_KEYWORDS = {
    'ant': 'ants',
    'roach': 'roaches',
    'cockroach': 'roaches',
    'termite': 'termites',
    'bed bug': 'bed_bugs',
    'bedbug': 'bed_bugs',
    'spider': 'spiders',
    'mosquito': 'mosquitoes',
    'flea': 'fleas',
    'tick': 'ticks',
    'rat': 'rodents',
    'mouse': 'rodents',
    'mice': 'rodents',
    'rodent': 'rodents',
    'wasp': 'wasps',
    'hornet': 'wasps',
    'bee': 'bees',
    'fly': 'flies',
    'silverfish': 'silverfish',
    'beetle': 'beetles',
    'cricket': 'crickets',
    'centipede': 'centipedes',
    'millipede': 'millipedes',
    'moth': 'moths',
    'gopher': 'rodents',
    'mole': 'rodents',
    'squirrel': 'wildlife',
    'critter': 'wildlife',
    'scorpion': 'scorpions',
}

# Spam indicators
SPAM_NAMES = {'jessica snyder', 'gloria mueller', 'jerry wenger', 'amine kacim', 'aj ros', 'bruce brace', 'james ben'}
SPAM_KEYWORDS = ['financing', 'customer financing', 'hrdealerfinancing', 'mapagency', 'digital-x-press', 'vrooted', 'domain', 'seo']

def parse_date(date_str: str) -> Optional[str]:
    """Parse date string to ISO format timestamp."""
    try:
        # Format: "November 05, 2025 at 3:14pm"
        dt = datetime.strptime(date_str, "%B %d, %Y at %I:%M%p")
        # Return as timestamptz (Central Time - CST/CDT)
        return dt.strftime("%Y-%m-%d %H:%M:%S-06")
    except:
        return None

def extract_pest_types(text: str) -> List[str]:
    """Extract pest types from description text."""
    if not text or not isinstance(text, str):
        return []

    text_lower = text.lower()
    found_pests = set()

    for keyword, pest_type in PEST_KEYWORDS.items():
        if keyword in text_lower:
            found_pests.add(pest_type)

    return sorted(list(found_pests))

def calculate_urgency(text: str) -> int:
    """Calculate urgency level 1-10 from description."""
    if not text:
        return 5

    text_lower = text.lower()

    # High urgency (8-10)
    if any(kw in text_lower for kw in ['asap', 'emergency', 'immediately', 'urgent', 'help!!!', 'help!!']):
        return 9
    if 'infestation' in text_lower:
        return 8

    # Moderate urgency (6-7)
    if any(kw in text_lower for kw in ['problem', 'issue', 'seeing', 'started']):
        return 6
    if any(kw in text_lower for kw in ['concerned', 'worried']):
        return 7

    # Low urgency (3-4)
    if any(kw in text_lower for kw in ['interested', 'quote', 'inspection']):
        return 4

    return 5  # Default

def calculate_confidence(pest_types: List[str], text: str) -> float:
    """Calculate confidence score 0.0-1.0."""
    if not pest_types:
        return 0.5

    # High confidence if specific pest names and action words
    if len(pest_types) >= 2:
        return 0.85

    text_lower = text.lower() if text else ""

    if any(kw in text_lower for kw in ['seeing', 'have', 'found', 'nest', 'infestation']):
        return 0.90

    if any(kw in text_lower for kw in ['problem', 'issue']):
        return 0.80

    return 0.75

def is_spam(row: dict, columns: dict = None) -> bool:
    """Check if row is spam or invalid."""
    # Check spam flag
    if row.get('Is Spam', '').strip().lower() == 'yes':
        return True

    # Check spam names (flexible - check any column with 'name' in it)
    name_value = ''
    if columns and columns.get('name'):
        name_value = row.get(columns['name'], '').strip().lower()
    else:
        # Fallback: check common name fields
        for key in row.keys():
            if 'name' in key.lower() and 'form' not in key.lower():
                name_value = row.get(key, '').strip().lower()
                break

    if any(spam_name in name_value for spam_name in SPAM_NAMES):
        return True

    # Check spam keywords in any text field
    all_text = ' '.join([str(v).lower() for v in row.values() if v and isinstance(v, str)])

    if any(spam_kw in all_text for spam_kw in SPAM_KEYWORDS):
        return True

    # Check for test submissions
    if 'test' in name_value and ('dh test' in name_value or 'form test' in all_text):
        return True

    return False

def is_valid_zip(zip_code: str) -> bool:
    """Validate that a ZIP code is actually a ZIP code (not a phone number)."""
    if not zip_code or not isinstance(zip_code, str):
        return False

    zip_clean = zip_code.strip()

    # Must be <= 10 characters (rejects phone numbers like 602-291-5603)
    if len(zip_clean) > 10:
        return False

    # Must be primarily numeric (allow hyphens for ZIP+4)
    # Remove hyphens and check if remaining chars are digits
    zip_no_hyphen = zip_clean.replace('-', '')

    if not zip_no_hyphen.isdigit():
        return False

    # ZIP codes should be 3-9 digits (allow shortened ZIPs, ZIP+4, etc.)
    # This rejects phone numbers (10+ digits) but accepts valid ZIP variations
    if len(zip_no_hyphen) < 3 or len(zip_no_hyphen) > 9:
        return False

    return True

def normalize_state(state: str) -> str:
    """Normalize state to 2-char code."""
    if not state:
        return ''

    state = state.strip().upper()

    # Already abbreviated
    if len(state) == 2:
        return state

    # Map common state names
    state_map = {
        'LOUISIANA': 'LA',
        'TEXAS': 'TX',
        'ARKANSAS': 'AR',
        'MISSISSIPPI': 'MS',
        'COLORADO': 'CO',
        'WYOMING': 'WY',
        'KANSAS': 'KS',
        'NEBRASKA': 'NE',
    }

    return state_map.get(state, state[:2] if len(state) >= 2 else '')

def extract_city_state_zip(address: str, zip_code: str) -> Tuple[str, str, str]:
    """Extract city, state, ZIP from address fields."""
    # ZIP code
    zip_clean = zip_code.strip() if zip_code else ''

    # Try to extract city and state from address
    city = ''
    state = ''

    if address:
        # Look for patterns like "City, State" or "City LA"
        if ',' in address:
            parts = address.split(',')
            if len(parts) >= 2:
                # Try to get city from second-to-last part
                city_part = parts[-2].strip()
                if city_part:
                    city = city_part.split()[-1] if city_part.split() else ''

                # Try to get state from last part
                state_part = parts[-1].strip()
                if state_part and state_part.split():
                    state = normalize_state(state_part.split()[0])

    # Infer state from ZIP code if not found
    if not state and zip_clean:
        # ZIP code to state mapping (first 2-3 digits)
        zip_prefix = zip_clean[:3] if len(zip_clean) >= 3 else zip_clean[:2]

        zip_to_state = {
            # Louisiana
            '700': 'LA', '701': 'LA', '702': 'LA', '703': 'LA', '704': 'LA', '705': 'LA',
            '706': 'LA', '707': 'LA', '708': 'LA', '710': 'LA', '711': 'LA', '712': 'LA',
            '713': 'LA', '714': 'LA',
            # Colorado
            '800': 'CO', '801': 'CO', '802': 'CO', '803': 'CO', '804': 'CO', '805': 'CO',
            '806': 'CO', '807': 'CO', '808': 'CO', '809': 'CO', '810': 'CO', '811': 'CO',
            '812': 'CO', '813': 'CO', '814': 'CO', '815': 'CO', '816': 'CO',
        }
        state = zip_to_state.get(zip_prefix, '')

    return city, state, zip_clean

def detect_columns(headers: List[str]) -> dict:
    """Auto-detect column names by fuzzy matching common patterns."""
    columns = {
        'pest_description': [],
        'address': None,
        'city': None,
        'state': None,
        'zip': None,
        'name': None,
    }

    headers_lower = [h.lower() for h in headers]

    # Find pest description columns (combine multiple fields)
    pest_patterns = ['help', 'comment', 'issue', 'problem', 'service', 'interested', 'concern', 'need']
    for i, h in enumerate(headers_lower):
        if any(pattern in h for pattern in pest_patterns):
            columns['pest_description'].append(headers[i])

    # Find address column (prefer "Address Row" or "Street", avoid "Ip Address")
    for i, h in enumerate(headers_lower):
        if ('address' in h or 'street' in h) and 'ip' not in h and 'email' not in h:
            columns['address'] = headers[i]
            break

    # Find city column
    for i, h in enumerate(headers_lower):
        if 'city' in h:
            columns['city'] = headers[i]
            break

    # Find state column
    for i, h in enumerate(headers_lower):
        if 'state' in h:
            columns['state'] = headers[i]
            break

    # Find ZIP column (avoid phone columns)
    for i, h in enumerate(headers_lower):
        if ('zip' in h or 'postal' in h) and 'phone' not in h:
            columns['zip'] = headers[i]
            break

    # Find name column
    for i, h in enumerate(headers_lower):
        if 'name' in h and 'form' not in h:
            columns['name'] = headers[i]
            break

    return columns

def generate_migration(csv_path: str, company_id: str, default_state: str = ''):
    """Generate SQL migration from CSV."""
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []

        # Auto-detect columns
        columns = detect_columns(headers)

        # Debug output
        print(f"-- Auto-detected columns:", file=sys.stderr)
        print(f"--   Pest description: {columns['pest_description']}", file=sys.stderr)
        print(f"--   Address: {columns['address']}", file=sys.stderr)
        print(f"--   City: {columns['city']}", file=sys.stderr)
        print(f"--   State: {columns['state']}", file=sys.stderr)
        print(f"--   ZIP: {columns['zip']}", file=sys.stderr)
        print(f"--   Name: {columns['name']}", file=sys.stderr)

    print(f"""-- Bulk Import Pest Pressure Data Points
-- Source: {csv_path.split('/')[-1]}
-- Company: {company_id}
-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

DO $$
DECLARE
  company_uuid UUID := '{company_id}';
  record_count INT := 0;
  pest_count INT := 0;
BEGIN
""")

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        columns = detect_columns(headers)

        for row in reader:
            # Skip spam/invalid
            if is_spam(row, columns):
                continue

            # Parse date
            date_str = row.get('Date', '')
            observed_at = parse_date(date_str)
            if not observed_at:
                continue

            # Extract location using detected columns
            address = row.get(columns['address'], '') if columns['address'] else ''
            city = row.get(columns['city'], '') if columns['city'] else ''
            state = row.get(columns['state'], '') if columns['state'] else ''
            zip_code = row.get(columns['zip'], '') if columns['zip'] else ''

            # If no direct city/state, try to extract from address
            if not city or not state:
                city_extracted, state_extracted, zip_extracted = extract_city_state_zip(address, zip_code)
                city = city or city_extracted
                state = state or state_extracted
                zip_code = zip_code or zip_extracted

            # Clean up values
            city = city.strip() if city else ''
            state = normalize_state(state) if state else ''
            zip_code = zip_code.strip() if zip_code else ''

            # Validate ZIP code - if invalid, clear it
            if zip_code and not is_valid_zip(zip_code):
                zip_code = ''

            # Use default state if no state found
            if not state and default_state:
                state = default_state.upper()

            # Skip if we don't have at least city OR zip_code
            if not city and not zip_code:
                continue

            # Extract pest info from all detected description columns
            combined_text_parts = []
            for col in columns['pest_description']:
                value = row.get(col, '')
                if value and isinstance(value, str) and value.strip():
                    combined_text_parts.append(value.strip())

            combined_text = ' '.join(combined_text_parts)

            pest_types = extract_pest_types(combined_text)

            # If no specific pests found, check if this is a general pest service request
            if not pest_types:
                combined_lower = combined_text.lower()
                # Skip if this is clearly not a pest-related request
                if any(kw in combined_lower for kw in ['pest control', 'exterminating', 'bug', 'insect', 'wildlife']):
                    # Create a general "other" pest type for tracking purposes
                    pest_types = ['other_pests']
                else:
                    continue

            # Calculate urgency and confidence
            urgency = calculate_urgency(combined_text)
            confidence = calculate_confidence(pest_types, combined_text)

            # Get form ID
            form_id = row.get('Id', '').strip()
            if not form_id:
                continue

            # Generate INSERT for each pest type
            for pest_type in pest_types:
                print(f"""
  -- Form {form_id}: {pest_type} ({city}, {state})
  INSERT INTO pest_pressure_data_points (
    id, company_id, source_type,
    pest_type, city, state, zip_code,
    urgency_level, confidence_score, observed_at
  ) VALUES (
    gen_random_uuid(), company_uuid, 'form',
    '{pest_type}', '{city}', '{state}', '{zip_code}',
    {urgency}, {confidence:.2f}, '{observed_at}'::timestamptz
  )
  ON CONFLICT DO NOTHING;

  pest_count := pest_count + 1;""")

            print(f"  record_count := record_count + 1;")

    print("""
  RAISE NOTICE 'Imported % pest pressure data points from % forms', pest_count, record_count;
END $$;
""")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/parse-forms-csv.py /path/to/csv <company_uuid> [default_state]", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]
    company_id = sys.argv[2]
    default_state = sys.argv[3] if len(sys.argv) > 3 else ''

    generate_migration(csv_path, company_id, default_state)
