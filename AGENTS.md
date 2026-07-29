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
.codex/skills/
  <skill-name>/
    SKILL.md               Skill entry point and decision/execution workflow
    references/            Documentation loaded only when its stated condition applies
    scripts/               Optional deterministic, reusable helper scripts
```

- Commands are thin wrappers: parse options, call `src/api.js`, format output, and exit.
- Shared logic (key resolution, error formatting, output) goes into `src/lib/cli-utils.js`.
- Each command file exports an async function; no side effects on load.
- Skills are versioned source assets that guide use of one or more real CLI workflows. They are maintained with the corresponding command surface, but are not included in the npm package unless an explicit skill distribution mechanism is added.

## Build, Test, and Development Commands

- `node bin/aiconductor-cli.js --help` — run locally without a build step
- `npm install` — install the single runtime dependency (`commander`)
- `npm test` — run the Node.js built-in test suite (`node --test`)

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

Use the Node.js built-in test runner via `npm test`. Place tests next to the module they cover when practical (for example, `src/commands/web_search.test.js`).

For changes to a CLI contract (commands, arguments, options, output, or errors), verify:
- The affected `--help` output exposes the intended command surface.
- A representative successful response is parsed and formatted correctly.
- A representative validation, authentication, or upstream API failure reports a non-zero exit path with useful error output.

## Skill Design & Maintenance

Skills in `.codex/skills` turn the CLI's verified capabilities into agent workflows. Keep them concise and operational; do not treat them as a second, independently authored API reference.

### Structure & Triggering

- The skill directory name and the `name` field in `SKILL.md` frontmatter must identify the same skill.
- The frontmatter `description` must state the capability, likely user phrasing or context, and boundaries with adjacent skills. Define one clear owner for overlapping workflows so similar skills do not compete for the same request.
- Keep `SKILL.md` focused on routing, decisions, command invocation, response handling, and safety rules. Move long option tables, platform-specific setup, and detailed background material into `references/`, and state exactly when that reference should be read.
- Add `scripts/` only for deterministic, reusable work that avoids repeated implementation. Do not add scripts solely to wrap a single documented CLI command.
- Add platform-specific metadata (such as files under `agents/`) only after validating its schema and behavior in the target runtime. Remove obsolete or unverified metadata rather than preserving it by convention.

### CLI Contract & Execution

- Derive command names, arguments, option names, defaults, response fields, and error semantics from the local `--help` output, implementation, or tests. Do not copy stale documentation or infer unsupported behavior.
- Default to JSON output and document stable response paths for the information the agent must return. Use text output only when the user asks for terminal-readable results.
- A user's request for a CLI operation authorizes direct execution. Do not preflight installation, API Key availability, or environment setup on every invocation.
- Put installation, upgrade, and API Key recovery instructions in an on-demand reference. Read it only when the user requests configuration or the command reports a missing CLI, authentication failure, or option/version incompatibility; after recovery, retry the original command at most once.

### Safety & External Effects

- Never write, commit, or echo API Keys, `.env` content, Base64 media, or other sensitive user material.
- Describe externally visible effects such as paid calls, temporary links, and public publishing accurately, including their success condition. Do not expose internal billing fields in user-facing output.
- For irreversible actions, including deletion or invalidating public links, first show the exact target and obtain explicit confirmation unless the user already supplied the unique target and explicitly requested deletion.

## CLI & Skill Synchronization

- When a command, argument, option, default, output shape, or error behavior is added, renamed, or removed, search for affected skills, README sections, and tests. Update all impacted artifacts in the same change.
- New or changed skills must be added to Git with their `.codex/skills/**` files. Keep `.codex/` excluded from `.npmignore` so skills remain versioned repository assets without being included in the npm package.
- Before finalizing a skill-related change, validate the referenced command's `--help` output and the documented JSON response path against implementation or tests.

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
