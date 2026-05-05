#!/usr/bin/env bash
# =============================================================================
#  Script        shadcn_vue_installer.sh
#  Description   Bulk-install shadcn-vue components, with maintenance helpers.
#  Version       1.3.0
#  Author        Imani Manyara <imani@simtabi.com>
#  Company       Simtabi · https://simtabi.com
#  License       MIT
#  Reference     https://www.shadcn-vue.com/docs/components.html
# =============================================================================
#
# USAGE
#   ./.dev/shadcn_vue_installer.sh                    interactive menu (when on a TTY)
#                                                     install everything (CI / non-TTY)
#   ./.dev/shadcn_vue_installer.sh button card tabs   install only the listed components
#
#   ./.dev/shadcn_vue_installer.sh --skip-installed   skip components already on disk
#   ./.dev/shadcn_vue_installer.sh --no-overwrite     don't overwrite local edits
#   ./.dev/shadcn_vue_installer.sh --dry-run          show what would happen, change nothing
#   ./.dev/shadcn_vue_installer.sh --quiet            only print the summary
#   ./.dev/shadcn_vue_installer.sh --verbose          announce each underlying dlx command
#   ./.dev/shadcn_vue_installer.sh --no-color         disable colour even on a TTY
#   ./.dev/shadcn_vue_installer.sh --no-banner        suppress the identity banner
#   ./.dev/shadcn_vue_installer.sh --no-interactive   skip the menu (force install-all default)
#   ./.dev/shadcn_vue_installer.sh --manager=npm      use npm (also: pnpm | yarn | bun)
#   ./.dev/shadcn_vue_installer.sh --project-name=Ichava
#                                                      override the auto-detected project name
#   ./.dev/shadcn_vue_installer.sh --components-file=path.txt
#                                                      read components from a newline file
#   ./.dev/shadcn_vue_installer.sh --components-json=path/to/components.json
#                                                      use a non-default shadcn config
#   ./.dev/shadcn_vue_installer.sh --log-path=/abs/path/to/run.log
#                                                      override the auto-resolved log file
#
# MAINTENANCE
#   ./.dev/shadcn_vue_installer.sh --clean-logs              wipe every run log
#   ./.dev/shadcn_vue_installer.sh --clean-logs --keep=10    keep the 10 most recent run logs
#   ./.dev/shadcn_vue_installer.sh --clean-logs --older-than=14
#                                                            delete logs older than N days
#
# INFORMATIONAL
#   ./.dev/shadcn_vue_installer.sh --list             print the catalogue and exit
#   ./.dev/shadcn_vue_installer.sh --version          print version metadata and exit
#   ./.dev/shadcn_vue_installer.sh --help, -h         show this help
#
# ENVIRONMENT
#   PROJECT_NAME           same as --project-name (overrides package.json detection)
#   SHADCN_MANAGER         same as --manager
#   SHADCN_COMPONENTS_JSON same as --components-json
#   LOG_FILE               same as --log-path
#   NO_COLOR               same as --no-color (honours the de-facto convention)
#
# LOG PATH RESOLUTION
#   1. --log-path / LOG_FILE override               (single appended file)
#   2. <project>/storage/logs/{script_basename}.log if `artisan` exists  (Laravel mode)
#   3. .dev/.{script_basename}-logs/...DATE.log     otherwise            (dev mode)
#   The file basename always tracks the script name so logs and script
#   stay in lockstep.
#
# PLATFORM SUPPORT
#   This script supports Unix (macOS), Linux, and Windows via WSL only.
#   Cygwin / MinGW / Git Bash on bare Windows are intentionally rejected
#   because their `dlx` tooling, line-ending handling, and pnpm cache paths
#   don't reliably match the upstream shadcn-vue CLI's expectations.
#

# ----------------------------------------------------------------------------
# Bash + platform guards
# ----------------------------------------------------------------------------
if [ -z "${BASH_VERSION:-}" ]; then
    echo "ERROR: this script must be run with bash, not /bin/sh." >&2
    exit 1
fi
case "${BASH_VERSION%%[!0-9.]*}" in
    [0-2].*|3.[01]*) echo "ERROR: bash 3.2+ required (current: $BASH_VERSION)" >&2; exit 1 ;;
esac

if [ "${BASH_VERSINFO[0]:-0}" -ge 4 ]; then
    set -Eeuo pipefail
else
    set -euo pipefail
fi

case "$(uname -s 2>/dev/null)" in
    Linux*)
        if grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then
            PLATFORM="WSL"
        else
            PLATFORM="Linux"
        fi
        ;;
    Darwin*)
        PLATFORM="macOS"
        ;;
    CYGWIN*|MINGW*|MSYS*|MINGW32*|MINGW64*)
        echo "ERROR: native Windows shells (Cygwin/MinGW/MSYS/Git Bash) are not supported." >&2
        echo "       This script supports Unix, Linux, and Windows via WSL only." >&2
        exit 1
        ;;
    *)
        echo "ERROR: unsupported platform: $(uname -s 2>/dev/null || echo unknown)" >&2
        echo "       This script supports Unix, Linux, and Windows via WSL only." >&2
        exit 1
        ;;
esac
readonly PLATFORM

# ----------------------------------------------------------------------------
# Identity
# ----------------------------------------------------------------------------
readonly SCRIPT_NAME="shadcn_vue_installer.sh"
readonly SCRIPT_VERSION="1.4.0"
readonly SCRIPT_AUTHOR="Imani Manyara <imani@simtabi.com>"
readonly SCRIPT_COMPANY="Simtabi"
readonly SCRIPT_URL="https://simtabi.com"
readonly SCRIPT_LICENSE="MIT"

# ----------------------------------------------------------------------------
# Component catalogue (kept sorted; mirrors the shadcn-vue docs)
# ----------------------------------------------------------------------------
declare -a CATALOGUE=(
    accordion
    alert
    alert-dialog
    aspect-ratio
    avatar
    badge
    breadcrumb
    button
    button-group
    calendar
    card
    carousel
    chart
    checkbox
    collapsible
    combobox
    command
    context-menu
    data-table
    date-picker
    dialog
    drawer
    dropdown-menu
    empty
    field
    form
    hover-card
    input
    input-group
    input-otp
    item
    kbd
    label
    menubar
    native-select
    navigation-menu
    number-field
    pagination
    pin-input
    popover
    progress
    radio-group
    range-calendar
    resizable
    scroll-area
    select
    separator
    sheet
    sidebar
    skeleton
    slider
    sonner
    spinner
    stepper
    switch
    table
    tabs
    tags-input
    textarea
    toast
    toggle
    toggle-group
    tooltip
    typography
)

# ----------------------------------------------------------------------------
# Defaults
# ----------------------------------------------------------------------------
PROJECT_NAME="${PROJECT_NAME:-}"
MANAGER="${SHADCN_MANAGER:-}"
COMPONENTS_JSON="${SHADCN_COMPONENTS_JSON:-components.json}"
COMPONENTS_FILE=""
SKIP_INSTALLED=false
OVERWRITE=true
DRY_RUN=false
QUIET=false
VERBOSE=false
USE_COLOR=true
SHOW_BANNER=true
INTERACTIVE=true
CLEAN_LOGS=false
CLEAN_KEEP=""
CLEAN_OLDER=""
LOG_PATH_OVERRIDE="${LOG_FILE:-}"   # honour LOG_FILE env if exported
declare -a SELECTED=()

if [[ -n "${NO_COLOR:-}" ]]; then
    USE_COLOR=false
fi

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
err() { printf '%s\n' "$*" >&2; }

print_help() {
    awk '/^# USAGE/,/^# ?$/'         "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    echo
    awk '/^# MAINTENANCE/,/^# ?$/'   "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    echo
    awk '/^# INFORMATIONAL/,/^# ?$/' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    echo
    awk '/^# ENVIRONMENT/,/^# ?$/'   "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    echo
    awk '/^# PLATFORM/,/^# ?$/'      "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

resolve_script_path() {
    local target="${BASH_SOURCE[0]}"
    if command -v realpath >/dev/null 2>&1; then
        realpath "$target"
    elif readlink -f "$target" >/dev/null 2>&1; then
        readlink -f "$target"
    else
        local dir
        dir="$(cd "$(dirname "$target")" && pwd)"
        printf '%s/%s\n' "$dir" "$(basename "$target")"
    fi
}

in_catalogue() {
    local needle="$1"
    local item
    for item in "${CATALOGUE[@]}"; do
        [[ "$item" == "$needle" ]] && return 0
    done
    return 1
}

# Best-effort project-name detection from package.json or composer.json.
# Falls back to the directory name and finally a generic placeholder.
detect_project_name() {
    local name=""

    if command -v node >/dev/null 2>&1; then
        if [[ -f package.json ]]; then
            name="$(node -e '
                try {
                    const c = JSON.parse(require("fs").readFileSync("package.json", "utf8"));
                    if (c.name) {
                        const parts = String(c.name).split("/");
                        process.stdout.write(parts[parts.length - 1]);
                    }
                } catch {}
            ' 2>/dev/null || true)"
        fi
        if [[ -z "$name" && -f composer.json ]]; then
            name="$(node -e '
                try {
                    const c = JSON.parse(require("fs").readFileSync("composer.json", "utf8"));
                    if (c.name) {
                        const parts = String(c.name).split("/");
                        process.stdout.write(parts[parts.length - 1]);
                    }
                } catch {}
            ' 2>/dev/null || true)"
        fi
    fi

    if [[ -z "$name" ]]; then
        name="$(basename "$PWD")"
    fi
    if [[ -z "$name" ]]; then
        name="the project"
    fi
    printf '%s\n' "$name"
}

# Title-case the first character of a string for nicer banner text.
titleize() {
    local s="$1"
    [[ -z "$s" ]] && { printf '%s' "$s"; return; }
    local first="${s:0:1}"
    local rest="${s:1}"
    printf '%s%s' "$(printf '%s' "$first" | tr '[:lower:]' '[:upper:]')" "$rest"
}

# ----------------------------------------------------------------------------
# Flag parsing
# ----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h)             print_help; exit 0 ;;
        --version|-V)          printf '%s %s\n%s · %s\n%s\nLicense %s\n' \
                                 "$SCRIPT_NAME" "$SCRIPT_VERSION" \
                                 "$SCRIPT_COMPANY" "$SCRIPT_URL" \
                                 "$SCRIPT_AUTHOR" "$SCRIPT_LICENSE"; exit 0 ;;
        --list)                printf '%s\n' "${CATALOGUE[@]}"; exit 0 ;;
        --skip-installed)      SKIP_INSTALLED=true;  shift ;;
        --no-overwrite)        OVERWRITE=false;      shift ;;
        --dry-run)             DRY_RUN=true;         shift ;;
        --quiet|-q)            QUIET=true;           shift ;;
        --verbose|-v)          VERBOSE=true;         shift ;;
        --no-color)            USE_COLOR=false;      shift ;;
        --no-banner)           SHOW_BANNER=false;    shift ;;
        --no-interactive)      INTERACTIVE=false;    shift ;;
        --clean-logs)          CLEAN_LOGS=true;      shift ;;
        --keep=*)              CLEAN_KEEP="${1#*=}"; shift ;;
        --keep)                CLEAN_KEEP="${2:?--keep requires a number}"; shift 2 ;;
        --older-than=*)        CLEAN_OLDER="${1#*=}";shift ;;
        --older-than)          CLEAN_OLDER="${2:?--older-than requires a number of days}"; shift 2 ;;
        --all)                 shift ;; # alias for --clean-logs without other constraints; no-op here
        --manager=*)           MANAGER="${1#*=}";    shift ;;
        --manager)             MANAGER="${2:?--manager requires a value}"; shift 2 ;;
        --project-name=*)      PROJECT_NAME="${1#*=}";   shift ;;
        --project-name)        PROJECT_NAME="${2:?--project-name requires a value}"; shift 2 ;;
        --components-file=*)   COMPONENTS_FILE="${1#*=}";   shift ;;
        --components-file)     COMPONENTS_FILE="${2:?--components-file requires a path}"; shift 2 ;;
        --components-json=*)   COMPONENTS_JSON="${1#*=}";   shift ;;
        --components-json)     COMPONENTS_JSON="${2:?--components-json requires a path}"; shift 2 ;;
        --log-path=*)          LOG_PATH_OVERRIDE="${1#*=}"; shift ;;
        --log-path)            LOG_PATH_OVERRIDE="${2:?--log-path requires a path}"; shift 2 ;;
        --)                    shift; SELECTED+=("$@"); break ;;
        -*)                    err "Unknown flag: $1"; err "Try --help"; exit 2 ;;
        *)                     SELECTED+=("$1"); shift ;;
    esac
done

if $QUIET && $VERBOSE; then
    VERBOSE=false
fi

# ----------------------------------------------------------------------------
# Locate project root
# ----------------------------------------------------------------------------
SCRIPT_PATH="$(resolve_script_path)"
PROJECT_ROOT="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
cd "$PROJECT_ROOT"

# Resolve the project name once cwd is set, before any output.
if [[ -z "$PROJECT_NAME" ]]; then
    PROJECT_NAME="$(detect_project_name)"
fi
PROJECT_LABEL="$(titleize "$PROJECT_NAME")"
readonly PROJECT_NAME PROJECT_LABEL

# ----------------------------------------------------------------------------
# Log path resolution
# ----------------------------------------------------------------------------
# Strategy:
#   * If a Laravel `artisan` file is found above the project root → flat,
#     append-only file at storage/logs/<base>.log (single shared file).
#   * Otherwise → dev mode: dated rotation under .dev/.<base>-logs/.
#
# `base` is derived from the script name (without extension) so log files
# stay consistent with the script identity. Override either with --log-path=
# or LOG_FILE env.
LOG_BASENAME="${SCRIPT_NAME%.*}"   # 'shadcn_vue_installer'
LOG_DIR=""
LOG_FILE=""
LOG_FLAT=true   # true = single appended file, false = dated rotation

resolve_log_paths() {
    # Honour explicit override first.
    if [[ -n "${LOG_PATH_OVERRIDE:-}" ]]; then
        LOG_DIR="$(cd "$(dirname "$LOG_PATH_OVERRIDE")" && pwd)"
        LOG_FILE="${LOG_DIR}/$(basename "$LOG_PATH_OVERRIDE")"
        LOG_FLAT=true
        return
    fi

    # Walk up from the script looking for Laravel's `artisan` file.
    local probe="$PROJECT_ROOT"
    local depth=0
    while [[ "$probe" != "/" && $depth -lt 6 ]]; do
        if [[ -f "$probe/artisan" && -d "$probe/storage/logs" ]]; then
            LOG_DIR="$probe/storage/logs"
            LOG_FILE="${LOG_DIR}/${LOG_BASENAME}.log"
            LOG_FLAT=true
            return
        fi
        probe="$(dirname "$probe")"
        depth=$((depth + 1))
    done

    # Dev mode (package dev, no host Laravel app): dated rotation under .dev/.
    LOG_DIR="$(dirname "$SCRIPT_PATH")/.${LOG_BASENAME}-logs"
    LOG_FILE="${LOG_DIR}/${LOG_BASENAME}-$(date +%Y%m%d-%H%M%S).log"
    LOG_FLAT=false
}

# ----------------------------------------------------------------------------
# Output helpers (TTY-aware colours; --no-color / NO_COLOR honoured)
# ----------------------------------------------------------------------------
if $USE_COLOR && [[ -t 1 ]]; then
    GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; YELLOW=$'\033[1;33m'
    BLUE=$'\033[0;34m';  DIM=$'\033[2m';   BOLD=$'\033[1m';   NC=$'\033[0m'
else
    GREEN=''; RED=''; YELLOW=''; BLUE=''; DIM=''; BOLD=''; NC=''
fi

say()       { $QUIET && return 0; printf '%s\n' "$*"; }
say_lined() { $QUIET && return 0; printf '%b' "$*"; }

print_banner() {
    $QUIET && return 0
    $SHOW_BANNER || return 0

    local rule
    rule="$(printf '=%.0s' {1..72})"

    printf '%b%s%b\n'                            "${BOLD}${BLUE}" "$rule" "$NC"
    printf '  %b%s%b  %bv%s%b\n'                  "${BOLD}" "$SCRIPT_NAME" "$NC" \
                                                  "${DIM}" "$SCRIPT_VERSION" "$NC"
    printf '  %bBulk-install shadcn-vue components for %s%b\n' "${DIM}" "$PROJECT_LABEL" "$NC"
    printf '%b%s%b\n'                            "${DIM}${BLUE}" "$rule" "$NC"
    printf '  %bAuthor%b    %s\n'                "${DIM}" "$NC" "$SCRIPT_AUTHOR"
    printf '  %bCompany%b   %s -- %s\n'          "${DIM}" "$NC" "$SCRIPT_COMPANY" "$SCRIPT_URL"
    printf '  %bLicense%b   %s\n'                "${DIM}" "$NC" "$SCRIPT_LICENSE"
    printf '  %bPlatform%b  %s   %b(bash %s)%b\n' "${DIM}" "$NC" "$PLATFORM" \
                                                  "${DIM}" "$BASH_VERSION" "$NC"
    printf '%b%s%b\n'                            "${BOLD}${BLUE}" "$rule" "$NC"
    echo
}

# ----------------------------------------------------------------------------
# Log cleaner
# ----------------------------------------------------------------------------
clean_logs() {
    resolve_log_paths
    print_banner

    if [[ ! -d "$LOG_DIR" ]]; then
        say "${DIM}No log directory at ${LOG_DIR/$HOME/\~} — nothing to clean.${NC}"
        return 0
    fi

    # Match both the dev-mode rotation pattern and the flat single-file
    # pattern: "<base>-YYYYMMDD-HHMMSS.log" or "<base>.log".
    local glob_dated="${LOG_DIR}/${LOG_BASENAME}-*.log"
    local glob_flat="${LOG_DIR}/${LOG_BASENAME}.log"

    local all_logs=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && all_logs+=("$line")
    done < <( {
        ls -1t $glob_dated 2>/dev/null || true
        [[ -f "$glob_flat" ]] && printf '%s\n' "$glob_flat"
    } )

    local total=${#all_logs[@]}
    if [[ $total -eq 0 ]]; then
        say "${DIM}No log files in ${LOG_DIR/$HOME/\~}.${NC}"
        return 0
    fi

    local victims=()
    if [[ -n "$CLEAN_OLDER" ]]; then
        while IFS= read -r line; do
            victims+=("$line")
        done < <(find "$LOG_DIR" -maxdepth 1 \( -name "${LOG_BASENAME}-*.log" -o -name "${LOG_BASENAME}.log" \) -type f -mtime "+${CLEAN_OLDER}" 2>/dev/null)
    elif [[ -n "$CLEAN_KEEP" ]]; then
        if [[ $total -gt $CLEAN_KEEP ]]; then
            local i
            for ((i=CLEAN_KEEP; i<total; i++)); do
                victims+=("${all_logs[$i]}")
            done
        fi
    else
        victims=("${all_logs[@]}")
    fi

    local victim_count=${#victims[@]}
    if [[ $victim_count -eq 0 ]]; then
        say "${GREEN}Nothing to delete.${NC} ${DIM}(total run logs: ${total})${NC}"
        return 0
    fi

    say_lined "${BOLD}${YELLOW}About to delete ${victim_count} of ${total} run log(s):${NC}\n"
    local f
    for f in "${victims[@]}"; do
        local size
        size="$(du -h "$f" 2>/dev/null | cut -f1 || echo '?')"
        say_lined "  ${DIM}-${NC} ${f/$HOME/\~} ${DIM}(${size})${NC}\n"
    done
    say ""

    # Confirm interactively unless we're on a non-TTY (or --no-interactive).
    if $INTERACTIVE && [[ -t 0 ]]; then
        local answer=""
        printf "%bProceed?%b [y/N]: " "${BOLD}" "${NC}"
        read -r answer || true
        case "${answer,,}" in
            y|yes) ;;
            *)     say "${DIM}Cancelled.${NC}"; return 0 ;;
        esac
    fi

    if $DRY_RUN; then
        say "${DIM}DRY-RUN: skipped removal.${NC}"
        return 0
    fi

    for f in "${victims[@]}"; do
        rm -f -- "$f"
    done

    say "${GREEN}Removed ${victim_count} log file(s).${NC} ${DIM}(${total} -> $((total - victim_count)))${NC}"
    return 0
}

# ----------------------------------------------------------------------------
# Interactive entry menu
# ----------------------------------------------------------------------------
interactive_menu() {
    print_banner

    say_lined "${BOLD}What would you like to do?${NC}\n\n"
    say_lined "  ${BOLD}1${NC}) Install every shadcn-vue component\n"
    say_lined "  ${BOLD}2${NC}) Install specific components (you'll be asked which)\n"
    say_lined "  ${BOLD}3${NC}) Install only components missing on disk\n"
    say_lined "  ${BOLD}4${NC}) List the catalogue and exit\n"
    say_lined "  ${BOLD}5${NC}) Clean run logs\n"
    say_lined "  ${BOLD}6${NC}) Quit\n\n"

    local choice=""
    printf "%bChoice%b [1-6]: " "${BOLD}" "${NC}"
    read -r choice || choice=""

    case "$choice" in
        1)  ;; # fall through to install-all
        2)  printf "%bComponents (space-separated, blank = all)%b: " "${BOLD}" "${NC}"
            local line=""
            read -r line || line=""
            if [[ -n "$line" ]]; then
                # shellcheck disable=SC2206  # word-splitting is what we want here
                SELECTED=($line)
            fi
            ;;
        3)  SKIP_INSTALLED=true ;;
        4)  printf '%s\n' "${CATALOGUE[@]}"; exit 0 ;;
        5)  CLEAN_LOGS=true ;;
        6|q|Q|quit|exit) say "${DIM}Bye.${NC}"; exit 0 ;;
        '')  say "${DIM}No choice made — defaulting to install-all.${NC}" ;;
        *)   err "Unknown choice: ${choice}"; exit 2 ;;
    esac
    echo
    SHOW_BANNER=false  # banner already printed by the menu
}

# Decide whether to show the menu.
if $INTERACTIVE && ! $CLEAN_LOGS && [[ ${#SELECTED[@]} -eq 0 && -z "$COMPONENTS_FILE" ]] && [[ -t 0 ]] && [[ -t 1 ]]; then
    interactive_menu
fi

# Log-clean mode is mutually exclusive with installation — handle and exit.
if $CLEAN_LOGS; then
    clean_logs
    exit 0
fi

# ----------------------------------------------------------------------------
# Pre-flight checks (install path)
# ----------------------------------------------------------------------------
if [[ ! -f "$COMPONENTS_JSON" ]]; then
    err "ERROR: components.json not found at: ${PROJECT_ROOT}/${COMPONENTS_JSON}"
    err "Run 'npx shadcn-vue@latest init' first, or pass --components-json=<path>."
    exit 1
fi

if [[ ! -f package.json ]]; then
    err "ERROR: package.json not found at $PROJECT_ROOT"
    exit 1
fi

# Auto-detect package manager when not explicitly set.
if [[ -z "$MANAGER" ]]; then
    if   [[ -f pnpm-lock.yaml ]];     then MANAGER=pnpm
    elif [[ -f yarn.lock ]];          then MANAGER=yarn
    elif [[ -f bun.lockb ]];          then MANAGER=bun
    elif [[ -f package-lock.json ]];  then MANAGER=npm
    else MANAGER=pnpm
    fi
fi

if ! command -v "$MANAGER" >/dev/null 2>&1; then
    err "ERROR: '$MANAGER' is not on PATH. Install it or pass --manager=<other>."
    exit 1
fi

declare -a DLX
case "$MANAGER" in
    npm)  DLX=(npx) ;;
    pnpm) DLX=(pnpm dlx) ;;
    yarn) DLX=(yarn dlx) ;;
    bun)  DLX=(bunx) ;;
    *)    err "Unknown package manager: $MANAGER (expected npm|pnpm|yarn|bun)"; exit 2 ;;
esac

# ----------------------------------------------------------------------------
# Determine the install set
# ----------------------------------------------------------------------------
declare -a TO_INSTALL=()

if [[ -n "$COMPONENTS_FILE" ]]; then
    if [[ ! -f "$COMPONENTS_FILE" ]]; then
        err "ERROR: --components-file path does not exist: $COMPONENTS_FILE"
        exit 1
    fi
    while IFS= read -r line; do
        line="${line%%#*}"
        line="${line#"${line%%[![:space:]]*}"}"
        line="${line%"${line##*[![:space:]]}"}"
        [[ -z "$line" ]] && continue
        TO_INSTALL+=("$line")
    done < "$COMPONENTS_FILE"
elif [[ ${#SELECTED[@]} -gt 0 ]]; then
    TO_INSTALL=("${SELECTED[@]}")
else
    TO_INSTALL=("${CATALOGUE[@]}")
fi

declare -a UNKNOWN=()
for component in "${TO_INSTALL[@]}"; do
    in_catalogue "$component" || UNKNOWN+=("$component")
done

if [[ ${#UNKNOWN[@]} -gt 0 ]]; then
    err "ERROR: not in the shadcn-vue catalogue: ${UNKNOWN[*]}"
    err "Run --list to see every supported component."
    exit 2
fi

# ----------------------------------------------------------------------------
# Resolve the on-disk target dir from components.json.
# ----------------------------------------------------------------------------
COMPONENTS_DIR="resources/assets/scripts/components/ui"
if command -v node >/dev/null 2>&1; then
    if resolved="$(node -e '
        try {
            const c = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
            const ui = (c.aliases && c.aliases.ui) || "@/components/ui";
            process.stdout.write(ui.replace(/^@\//, "resources/assets/scripts/"));
        } catch { process.exit(1); }
    ' "$COMPONENTS_JSON" 2>/dev/null)" && [[ -n "$resolved" ]]; then
        COMPONENTS_DIR="$resolved"
    fi
fi

# ----------------------------------------------------------------------------
# Logging setup
# ----------------------------------------------------------------------------
resolve_log_paths
mkdir -p "$LOG_DIR"

cleanup() { :; }
trap cleanup EXIT INT TERM

# ----------------------------------------------------------------------------
# Banner + run header
# ----------------------------------------------------------------------------
print_banner

total=${#TO_INSTALL[@]}
mode_tag="$($DRY_RUN && echo " (DRY-RUN)" || echo "")"

say_lined "${BOLD}${GREEN}Run${mode_tag}${NC}\n"
say_lined "  ${DIM}project${NC}     ${PROJECT_LABEL}   ${DIM}${PROJECT_ROOT/$HOME/\~}${NC}\n"
say_lined "  ${DIM}manager${NC}     ${MANAGER}   ${DIM}(dlx via: ${DLX[*]})${NC}\n"
say_lined "  ${DIM}target${NC}      ${COMPONENTS_DIR}\n"
say_lined "  ${DIM}config${NC}      ${COMPONENTS_JSON}\n"
say_lined "  ${DIM}components${NC}  ${total}"
if [[ -n "$COMPONENTS_FILE" ]]; then
    say_lined "   ${DIM}(from ${COMPONENTS_FILE})${NC}"
fi
say_lined "\n"
say_lined "  ${DIM}log${NC}         ${LOG_FILE/$HOME/\~}\n"
say ""

# ----------------------------------------------------------------------------
# Install loop
# ----------------------------------------------------------------------------
SUCCESS=0
SKIPPED=0
FAILED=0
declare -a FAILED_LIST=()
declare -a FAILED_REASONS=()
START=$(date +%s)

idx=0
for component in "${TO_INSTALL[@]}"; do
    idx=$((idx + 1))
    pad=$(printf "%-22s" "$component")
    progress=$(printf "[%3d/%3d]" "$idx" "$total")

    if $SKIP_INSTALLED && [[ -d "$COMPONENTS_DIR/$component" ]]; then
        say_lined "${progress} ${pad} ${BLUE}-> already installed${NC}\n"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    args=(shadcn-vue@latest add "$component" --yes)
    if $OVERWRITE; then args+=(--overwrite); fi

    if $DRY_RUN; then
        say_lined "${progress} ${pad} ${DIM}-> would run: ${DLX[*]} ${args[*]}${NC}\n"
        SUCCESS=$((SUCCESS + 1))
        continue
    fi

    # Header per dlx call. In flat mode this gets appended to the shared
    # log; in dated mode it lives in this run's own file.
    {
        printf '----- %s :: %s -----\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$component"
        printf '+ %s %s\n' "${DLX[*]}" "${args[*]}"
    } >> "$LOG_FILE"

    if $VERBOSE; then
        printf '%s %s %s\n' "$progress" "$pad" "running ..."
    fi

    if "${DLX[@]}" "${args[@]}" >> "$LOG_FILE" 2>&1; then
        say_lined "${progress} ${pad} ${GREEN}OK installed${NC}\n"
        SUCCESS=$((SUCCESS + 1))
    else
        rc=$?
        say_lined "${progress} ${pad} ${RED}X failed${NC} ${DIM}(exit ${rc}, see log)${NC}\n"
        FAILED=$((FAILED + 1))
        FAILED_LIST+=("$component")
        last_err="$(grep -E '^(Error|error|fatal|ENOENT|EACCES)' "$LOG_FILE" 2>/dev/null \
                    | tail -n 1 \
                    || tail -n 1 "$LOG_FILE" 2>/dev/null \
                    || true)"
        FAILED_REASONS+=("${last_err:-(see log)}")
    fi
done

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
elapsed=$(( $(date +%s) - START ))
mins=$(( elapsed / 60 ))
secs=$(( elapsed % 60 ))

echo
printf '%bSummary%b%s %b(%dm%ds)%b\n' "$BOLD" "$NC" "$mode_tag" "$DIM" "$mins" "$secs" "$NC"
printf '  %bOK installed%b  %d\n' "$GREEN" "$NC" "$SUCCESS"
printf '  %b-> skipped%b    %d\n'  "$BLUE"  "$NC" "$SKIPPED"
printf '  %bX  failed%b     %d\n'  "$RED"   "$NC" "$FAILED"

if [[ ${#FAILED_LIST[@]} -gt 0 ]]; then
    echo
    printf '%bFailed components:%b\n' "$YELLOW" "$NC"
    for i in "${!FAILED_LIST[@]}"; do
        printf '  %b-%b %s\n' "$RED" "$NC" "${FAILED_LIST[$i]}"
        printf '    %b%s%b\n' "$DIM" "${FAILED_REASONS[$i]}" "$NC"
    done
    echo
    printf '%bFull log: %s%b\n' "$DIM" "$LOG_FILE" "$NC"
    exit 1
fi

if ! $DRY_RUN; then
    echo
    printf '%bFull log: %s%b\n' "$DIM" "$LOG_FILE" "$NC"
fi
