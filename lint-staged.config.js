module.exports = {
  // Backend (Python)
  "backend/**/*.py": [
    "uv run --directory backend ruff check --fix",
    "uv run --directory backend ruff format",
    // We don't run mypy on individual files as it may fail without context, 
    // but running it broadly is better or we can skip it in lint-staged and leave it for CI.
    // For now we'll just run format and lint.
  ],
  // Frontend (JS/TS)
  "frontend/**/*.{js,jsx,ts,tsx}": [
    "pnpm --filter frontend exec prettier --write",
    "pnpm --filter frontend exec eslint --fix",
  ],
  "frontend/**/*.{json,css,md}": [
    "pnpm --filter frontend exec prettier --write"
  ]
};
