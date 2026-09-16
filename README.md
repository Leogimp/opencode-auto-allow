# opencode-auto-allow

A `/allow` toggle that auto-approves permission prompts in the [opencode](https://opencode.ai) TUI, with a persistent indicator next to the prompt. Uses OpenCode's own permission-reply API, so explicit `deny` rules are always enforced.

![auto-allow](assets/auto-allow.png)

## Install

```sh
opencode plugin install @leo.gimp/opencode-auto-allow -g
```

or in the TUI: `ctrl+p` → *Plugins* → `shift+i` → enter `@leo.gimp/opencode-auto-allow`.

Then quit and restart opencode - TUI config is only read at startup.

## Features

### `/allow` command

Toggle auto-approval of permission prompts from inside the TUI. Type `/allow`, or open the
command palette (`ctrl+p` → *Allow: toggle auto-approve permissions*):

- **On** - every permission prompt that resolves to `ask` is approved automatically; **off** - prompts work normally (`once` / `always` / reject)
- State persists in opencode's TUI KV store and **survives restarts**
- Enabling mid-session also approves any prompt that is currently pending
- Shows a toast confirming the new state

![/allow toggle](assets/allow-toggle.png)

### Indicators

The current state is always visible as a persistent `allow` indicator - **full opacity** when
auto-approve is on, **50% opacity** when off:

- **Home footer**, left of the `~/` path. The plugin replaces the built-in home footer
  (slot order `0` beats the built-in `order: 100`) and re-renders its content: abbreviated
  path with git branch, MCP status, and version
- **Session prompt meta row**, under the input line, left of the token/usage info - hidden on
  the start screen, where only the footer indicator shows

![indicators](assets/indicator.png)

### Auto-approval mechanism

The plugin subscribes to `permission.asked` events and replies `once` via OpenCode's
`permission.reply` API - the exact mechanism the built-in auto-approve mode uses:

- Plugin state is the **single source of truth**: indicator, toggle persistence, and
  auto-approval behavior always stay in sync
- Explicit `deny` rules from your config are still enforced by the permission service

## Required config

OpenCode's agent defaults allow every tool, so add `ask` rules to `~/.config/opencode/opencode.jsonc` (or the project's `opencode.json`) for `/allow` to gate on:

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

Then quit and restart opencode.

## Notes

- If opencode's built-in auto-approve mode is active (`--auto` or palette), prompts are auto-approved regardless of this plugin. Run the palette command *Disable auto-approve permissions* once, then use `/allow` exclusively.
- `test-prompt.md` exercises the read/bash/edit gates - run it once with `/allow` off (expect prompts) and once on (expect none).

## Local development

Register the plugin file in `~/.config/opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["C:\\path\\to\\auto-allow\\tui.tsx"]
}
```

## Requirements

- opencode **1.18+** (uses the TUI plugin slot API and keymap command API)
- A `permission` config with `ask` rules

## License

MIT
