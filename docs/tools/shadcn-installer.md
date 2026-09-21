# shadcn-vue installer

*How-to guide.*

A bash helper for bulk-installing shadcn-vue components, plus maintenance helpers (log cleanup, interactive entry menu, project-aware identity banner).

> Lives at `browser/.dev/shadcn_vue_installer.sh`. Run from the `browser/` package root.

## Why a wrapper

`pnpm dlx shadcn-vue@latest add <component>` works one component at a time. The shadcn-vue project ships ~64 components and Ichava (or any host project) typically wants the full set or a deliberate subset. The wrapper handles:

- Bulk install of every component in one command, with retry-friendly progress output.
- Per-run logging in `.dev/.shadcn-logs/` so a failed install can be diagnosed offline.
- Skip-installed mode for idempotent reruns when components already exist on disk.
- Validation of requested component names against the official catalogue (no more cryptic dlx errors when you typo `aacordion`).
- Cross-platform support, runs on **macOS, Linux, and Windows via WSL**. Native Windows shells (Cygwin, MinGW, MSYS, Git Bash) are intentionally rejected.

## Quick start

```bash
# Interactive menu (default when stdin is a TTY)
./.dev/shadcn_vue_installer.sh

# Or non-interactive: install every component
./.dev/shadcn_vue_installer.sh --no-interactive

# Install only a subset
./.dev/shadcn_vue_installer.sh button card tabs dialog

# Idempotent rerun, skip components already installed
./.dev/shadcn_vue_installer.sh --skip-installed

# Preview without changing anything
./.dev/shadcn_vue_installer.sh --dry-run
```

## Identity banner

Each invocation prints a banner identifying the script, project, and runtime:

```
========================================================================
  shadcn_vue_installer.sh  v1.3.0
  Bulk-install shadcn-vue components for Ichava
========================================================================
  Author    Imani Manyara <imani@simtabi.com>
  Company   Simtabi -- https://simtabi.com
  License   MIT
  Platform  macOS   (bash 5.3.3(1)-release)
========================================================================
```

The project name is auto-detected (see below). Suppress the banner with `--no-banner`, or the entire output except the summary with `--quiet`.

## Project-name detection

The script is **project-agnostic**, drop it into any shadcn-vue project. The project name shown in the banner is resolved in this order:

1. `--project-name=<name>` flag.
2. `PROJECT_NAME` environment variable.
3. `package.json#name` (last segment after `/`).
4. `composer.json#name` (last segment after `/`).
5. The basename of the current working directory.
6. The literal string `"the project"`.

```bash
# Override explicitly
./.dev/shadcn_vue_installer.sh --project-name="Acme Storefront"

# Or via env
PROJECT_NAME="Acme Storefront" ./.dev/shadcn_vue_installer.sh
```

## Reference

### Install flags

| Flag | Purpose |
|---|---|
| `--skip-installed` | Skip components whose target directory already exists. |
| `--no-overwrite` | Don't pass `--overwrite` to dlx (preserve local edits). |
| `--dry-run` | Print what would happen, change nothing. |
| `--manager=npm\|pnpm\|yarn\|bun` | Override the auto-detected package manager. |
| `--components-file=<path>` | Read components from a newline file. `#` comments and blank lines are stripped. |
| `--components-json=<path>` | Use a non-default `components.json` location. |
| `--project-name=<name>` | Override the auto-detected project name. |

### Output flags

| Flag | Purpose |
|---|---|
| `--quiet` / `-q` | Suppress banner + per-component lines, keep the summary. |
| `--verbose` / `-v` | Announce each component before running its dlx call. |
| `--no-color` | Disable ANSI even on a TTY (`NO_COLOR=1` env honoured too). |
| `--no-banner` | Skip the identity banner; keep the run header. |
| `--no-interactive` | Skip the entry menu and the y/N confirmation in `--clean-logs`. |

### Maintenance flags

| Flag | Purpose |
|---|---|
| `--clean-logs` | Enter log-clean mode; exits without installing anything. |
| `--keep=N` | With `--clean-logs`: retain the N most recent run logs. |
| `--older-than=N` | With `--clean-logs`: delete logs older than N days. |

### Informational flags

| Flag | Purpose |
|---|---|
| `--list` | Print the catalogue (one component per line) and exit. |
| `--version` / `-V` | Print version metadata and exit. |
| `--help` / `-h` | Show help. |

### Environment variables

| Variable | Equivalent flag |
|---|---|
| `PROJECT_NAME` | `--project-name=` |
| `SHADCN_MANAGER` | `--manager=` |
| `SHADCN_COMPONENTS_JSON` | `--components-json=` |
| `NO_COLOR` | `--no-color` |

## Interactive menu

When run without arguments on a TTY, the script offers a six-option menu:

```
What would you like to do?

  1) Install every shadcn-vue component
  2) Install specific components (you'll be asked which)
  3) Install only components missing on disk
  4) List the catalogue and exit
  5) Clean run logs
  6) Quit

Choice [1-6]:
```

On non-TTY runs (CI), the menu is skipped automatically and the script defaults to install-all. Force the non-interactive path explicitly with `--no-interactive`.

## Log path resolution

The script writes a single per-install log. Where that log lives is chosen automatically by walking up the file tree from the project root:

1. **Explicit override**. `--log-path=/abs/path/to/run.log` or `LOG_FILE` env. Used verbatim; single appended file.
2. **Laravel host detected**, if an `artisan` file exists at the project root or in any parent (up to 6 levels), logs go to `storage/logs/<script_basename>.log` (flat, single appended file). This is the production-style mode: one shared file that pairs naturally with Laravel's own daily rotation tooling.
3. **Dev mode**, when no `artisan` is found above the script (e.g, while developing the package itself), logs rotate per run under `.dev/.<script_basename>-logs/<script_basename>-YYYYMMDD-HHMMSS.log`.

The file basename always tracks the script name (`shadcn_vue_installer.log`), rename the script and the logs follow.

## Maintenance: cleaning run logs

```bash
# Delete every run log (asks for confirmation on a TTY)
./.dev/shadcn_vue_installer.sh --clean-logs

# Keep the 10 most recent
./.dev/shadcn_vue_installer.sh --clean-logs --keep=10

# Delete logs older than 14 days
./.dev/shadcn_vue_installer.sh --clean-logs --older-than=14

# Preview first
./.dev/shadcn_vue_installer.sh --clean-logs --keep=5 --dry-run
```

The cleaner picks up both the dated dev-mode files (`<base>-YYYYMMDD-HHMMSS.log`) and the flat Laravel-mode file (`<base>.log`). On a TTY it asks for `[y/N]` confirmation listing each victim with its size; pass `--no-interactive` to skip the prompt (deletion still runs unless `--dry-run` is set).

## CI usage

```yaml
# Example: GitHub Actions
- name: Install shadcn-vue components
  run: ./.dev/shadcn_vue_installer.sh --skip-installed --no-interactive --no-color
```

`--no-interactive` and `--no-color` are recommended for CI; both are auto-applied when the script detects a non-TTY stdin/stdout, but being explicit keeps the intent clear in the workflow file.

## Platform support

- **macOS** (BSD userland, default bash 3.2 supported).
- **Linux** (Ubuntu, Debian, Alpine, etc.).
- **Windows via WSL** (detected through `/proc/version`).
- **Cygwin / MinGW / MSYS / Git Bash on bare Windows** are explicitly rejected, their `dlx` tooling, line-ending handling, and pnpm cache paths don't reliably match the upstream shadcn-vue CLI's expectations.

A `.gitattributes` rule (`*.sh text eol=lf`) keeps the script's shebang line clean even when checked out on Windows.

## Component catalogue

Run `./.dev/shadcn_vue_installer.sh --list` to print every supported component name (one per line). The list mirrors the [shadcn-vue components index](https://www.shadcn-vue.com/docs/components.html); update the `CATALOGUE` array at the top of the script when upstream adds entries.

---

---

[← Docs index](../../README.md#documentation)
