#!/bin/bash
# Documentation Helper Script
# Makes it easier to create and manage docs

set -e

DOCS_DIR="packages/docs/docs"
SIDEBARS_FILE="packages/docs/sidebars.js"

usage() {
  cat << EOF
Usage: ./scripts/docs-helper.sh <command> [options]

Commands:
  new <category> <page>     Create a new documentation page
  preview                   Start documentation preview server
  build                     Build documentation for production
  list                      List all documentation pages
  validate                  Validate documentation (check for broken links)
  help                      Show this help message

Examples:
  ./scripts/docs-helper.sh new guides custom-integrations
  ./scripts/docs-helper.sh new features ml-parsing
  ./scripts/docs-helper.sh preview
  ./scripts/docs-helper.sh build

Categories:
  - getting-started
  - architecture
  - features
  - monorepo
  - guides
  - api
EOF
}

create_page() {
  local category=$1
  local page=$2

  if [ -z "$category" ] || [ -z "$page" ]; then
    echo "Error: Please provide category and page name"
    echo "Example: ./scripts/docs-helper.sh new guides my-guide"
    exit 1
  fi

  local file_path="$DOCS_DIR/$category/$page.md"
  local dir=$(dirname "$file_path")

  # Create directory if needed
  mkdir -p "$dir"

  # Create file with template
  cat > "$file_path" << EOF
---
title: $(echo $page | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
---

# $(echo $page | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')

Page description here.

## Section 1

Content here.

## Section 2

More content.

---

**See also:** [Related](./related-page.md)
EOF

  echo "✅ Created: $file_path"
  echo ""
  echo "Next steps:"
  echo "1. Edit the file: $file_path"
  echo "2. Update sidebars.js to link the page"
  echo "3. Run: npm run docs:dev"
  echo "4. Preview at http://localhost:3000"
}

list_pages() {
  echo "Documentation pages:"
  echo ""
  find "$DOCS_DIR" -name "*.md" -type f | sort | while read file; do
    # Extract relative path
    rel_path=${file#$DOCS_DIR/}
    # Extract title from frontmatter
    title=$(grep -A1 "^title:" "$file" | tail -1 | sed 's/^title: //;s/ *$//')
    printf "  %-40s %s\n" "$rel_path" "$title"
  done
}

validate_docs() {
  echo "Validating documentation..."

  # Check for invalid markdown
  echo "  - Checking markdown syntax..."
  find "$DOCS_DIR" -name "*.md" -type f | while read file; do
    if ! grep -q "^---" "$file"; then
      echo "    ⚠️  $file: Missing frontmatter"
    fi
    if ! grep -q "^title:" "$file"; then
      echo "    ⚠️  $file: Missing title in frontmatter"
    fi
  done

  # Check for broken internal links (basic check)
  echo "  - Checking for broken links..."
  find "$DOCS_DIR" -name "*.md" -type f | while read file; do
    # Extract markdown links
    grep -o '\[.*\](.*\.md)' "$file" | sed 's/.*(\(.*\)).*/\1/' | while read link; do
      # Resolve relative path
      dir=$(dirname "$file")
      target=$(cd "$dir" && realpath "$link" 2>/dev/null || echo "NOT_FOUND")
      if [ "$target" = "NOT_FOUND" ]; then
        echo "    ⚠️  $file: Broken link - $link"
      fi
    done
  done

  echo "  ✅ Validation complete"
}

main() {
  case "${1:-help}" in
    new)
      create_page "$2" "$3"
      ;;
    preview)
      echo "Starting documentation preview..."
      npm run docs:dev --workspace=docs
      ;;
    build)
      echo "Building documentation..."
      npm run docs:build --workspace=docs
      ;;
    list)
      list_pages
      ;;
    validate)
      validate_docs
      ;;
    help|--help|-h|"")
      usage
      ;;
    *)
      echo "Unknown command: $1"
      usage
      exit 1
      ;;
  esac
}

main "$@"
