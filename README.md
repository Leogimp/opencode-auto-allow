# opencode-auto-allow

A `/allow` permission auto-approve toggle for the [opencode](https://opencode.ai) TUI.

Toggles auto-approval of permission prompts from inside the TUI - a persistent `allow` indicator
next to the `~/` path in the home footer and under the input line in sessions. Auto-approval uses
OpenCode's own permission-reply API (the same mechanism as the built-in auto-approve mode), so
explicit `deny` rules are always enforced.

```
allow   ~\Documents\Organizer\Projects\Plugins\auto-allow    ⊙ 1 MCP    OpenCode 1.18.31
```

## Features

### `/allow` command

Type `/allow` (or open the command palette with `ctrl+p` → *Allow: toggle auto-approve
permissions*) to toggle auto-approval of permission prompts:

- When **on**, every permission prompt that resolves to `ask` is approved automatically
- When **off**, prompts work normally (`once` / `always` / reject)
- Shows a toast confirming the new state
- Toggle state is persisted in opencode's TUI KV store and **survives restarts**
- Enabling mid-session also approves any permission prompt that is currently pending

### Footer indicator

A persistent `allow` text rendered in the home footer, to the left of the `~/` path. The plugin
replaces the built-in home footer (slot order `0` beats the built-in `order: 100`) and re-renders
its content - abbreviated path with git branch, MCP status, version:

```
allow  ~\Documents\my-project:main    ⊙ 2 MCP /status    OpenCode 1.18.31
```

- **Full opacity** when auto-approve is on, **50% opacity** when off
- Visible on the home/start screen, including before the first message

### Session prompt indicator

The same `allow` indicator also shows in the session prompt meta row (the line under the input,
left of the token/usage info), so the current state is always visible while working:

```
Build · GLM-5.3-Flash · high                    allow    10.0K (1%) · $0.00 · ctrl+p commands
```

- Hidden on the start screen (before the first message) - only the footer indicator shows there

### Auto-approval mechanism

The plugin subscribes to `permission.asked` events and replies `once` via OpenCode's
`permission.reply` API - the exact mechanism the built-in auto-approve mode uses:

- Plugin state is the **single source of truth**: indicator, toggle persistence, and
  auto-approval behavior always stay in sync
- Explicit `deny` rules from your config are still enforced by the permission service

## Install

The plugin needs `ask` permission rules in opencode's config to gate on (see
[Required config](#required-config)).

### npm (recommended)

```sh
opencode plugin install opencode-auto-allow -g
```

or inside the TUI: `ctrl+p` → *Plugins* → `shift+i` → enter `opencode-auto-allow`.

Then quit and restart opencode - TUI config is only read at startup.

### From a local checkout

Run the installer script, which registers the plugin file in the global `~/.config/opencode/tui.json`:

```powershell
.\install.ps1
```

Or add the absolute path manually:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["C:\\path\\to\\auto-allow\\tui.tsx"]
}
```

Then quit and restart opencode - TUI config is only read at startup.

To uninstall, remove the entry from `~/.config/opencode/tui.json`.

## Required config

OpenCode's built-in agent defaults allow every tool (`permission: { "*": "allow" }`), so nothing
prompts and `/allow` has nothing to approve or withhold. Add `ask` rules to
`~/.config/opencode/opencode.jsonc` (or the project's `opencode.json`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "read": "allow",
    "edit": "ask",
    "bash": "ask"
  }
}
```

With this in place: `/allow` on → edit/bash asks are auto-approved; `/allow` off → prompts appear
for every command and edit. Reads stay allowed at all times. Other tools (glob, grep, list, task,
...) keep their permissive defaults. Then quit and restart opencode - config is only read at
startup.

## Caveats

- If opencode's built-in auto-approve mode is active (from `--auto`, or if you enabled it via the
  command palette, or an earlier version of this plugin), permission prompts will be auto-approved
  regardless of this plugin's indicator. Run the palette command "Disable auto-approve
  permissions" once to clear it, then use `/allow` exclusively.

## Verifying

`test-prompt.md` contains a ready-made prompt that exercises the read, bash, and edit permission
gates with fresh patterns so saved "always" approvals can't mask the result. Run it once with
`/allow` off (expect prompts for the gated steps) and once on (expect zero prompts).

## Requirements

- opencode **1.18+** (tested against 1.18.31; uses the TUI plugin slot API and keymap command API)
- A `permission` config with `ask` rules (see [Required config](#required-config))

## License

MIT
