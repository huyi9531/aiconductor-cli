# Repository Guidelines

## Project Structure & Module Organization

```
bin/aiconductor-cli.js     CLI entry point (Commander.js)
src/
  api.js                   HTTP API client — all platform calls live here
  lib/cli-utils.js         Shared helpers: output, error handling, key resolution
  commands/
    html_publish.js        `html publish` command
    md_publish.js          `webpage publish` command (Markdown/HTML)
    web_search.js          `search web` / `search image` commands
    douyin.js              All `douyin` subcommands
    xhs.js                 `xhs note-publish` command
```

- Commands are thin wrappers: parse options, call `src/api.js`, format output, and exit.
- Shared logic (key resolution, error formatting, output) goes into `src/lib/cli-utils.js`.
- Each command file exports an async function; no side effects on load.

## Build, Test, and Development Commands

- `node bin/aiconductor-cli.js --help` — run locally without a build step
- `npm install` — install the single runtime dependency (`commander`)
- No test suite currently exists

## Coding Style & Naming Conventions

- 2-space indentation, no tabs
- CommonJS (`require` / `module.exports`), no ESM
- camelCase for JS identifiers; snake_case for API request fields
- Every exported function gets a JSDoc block describing parameters and return type
- Use `const` by default; `let` only when reassignment is needed
- No formatter or linter configured — follow surrounding code style

## Error Handling

- Never swallow errors with empty `catch`. At minimum, log and re-throw.
- API errors carry a `.type` property (`http_error`, `network_error`, `validation_error`, `api_error`)
- Commands exit with code 0 on success, 1 on failure

## Testing Guidelines

No test framework is wired up yet. If adding tests:
- Use a standard Node.js test runner or Jest
- Place test files next to the module they cover (`src/commands/web_search.test.js`)

## Commit & Pull Request Guidelines

From the existing history:

- Messages are in English, often prefixed with conventional commit tags: `feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `ci:`
- Agent-authored commits include `[Agent]` before the description
- PRs should describe the change, note API surface impacts, and keep diffs focused

## Adding a New Command

1. Create `src/commands/<name>.js` with an async handler that calls `src/api.js`
2. Add the API function to `src/api.js` if it calls a new endpoint
3. Register the subcommand in `bin/aiconductor-cli.js`
4. Update `README.md` — command synopsis, option table, and example

## Security & Configuration

- API Key is read from three sources in order: `-k` CLI argument → `AICONDUCTOR_API_KEY` env var → `.env` file
- Never commit `.env` files or hardcoded credentials
