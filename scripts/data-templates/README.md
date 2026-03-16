# Data Templates

These are example JSON files showing the expected format for batch population scripts.

## Usage

1. Copy the template to `scripts/data/` (gitignored):
   ```bash
   mkdir -p scripts/data
   cp scripts/data-templates/alumni-data.example.json scripts/data/alumni-data.json
   ```
2. Edit `scripts/data/alumni-data.json` with real Sanity document IDs and data
3. Run the corresponding script:
   ```bash
   npx tsx scripts/populate-alumni.ts --dry-run   # preview
   npx tsx scripts/populate-alumni.ts              # apply
   ```

The `scripts/data/` directory is gitignored to prevent committing personal data.
