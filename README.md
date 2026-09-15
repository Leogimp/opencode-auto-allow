# opencode-auto-allow

[OpenCode](https://opencode.ai) TUI plugin that adds a `/allow` command to toggle OpenCode's built-in
**auto-approve permissions** mode, plus a persistent `allow` indicator in the home footer.

- `/allow` engages the integrated auto-approve setting (same code path as the command palette's
  "Enable auto-approve permissions" and `opencode --auto`): permission prompts that resolve to `ask`
  are approved automatically. Explicit `deny` rules are still enforced.
- The indicator renders in the home footer, to the left of the `~/` path: full opacity when
  auto-approve is on, 50% opacity when off.
- Toggle state is persisted in OpenCode's TUI KV store and survives restarts.

## Install

### From npm (published)

```sh
opencode plugin install opencode-auto-allow -g
```

or inside the TUI: `ctrl+p` -> Plugins -> `shift+i` -> enter `opencode-auto-allow`.

### Local development (this repo)

Registers the plugin file directly via the global `tui.json`:

```powershell
.\install.ps1
```

OpenCode auto-installs the plugin's dependencies (`@opencode-ai/plugin`) into the config directory
at startup. Requires opencode >= 1.18.0.

## Usage

| Action | Effect |
| --- | --- |
| `/allow` | Toggle auto-approve permissions on/off |
| `ctrl+p` -> "Allow: toggle auto-approve permissions" | Same toggle from the command palette |

The footer shows `allow` in green at full opacity when enabled and at half opacity when disabled.

## Caveats

- If you start opencode with `--auto`, the built-in auto mode is active but the indicator state was
  not set by this plugin, so it will show dimmed until the first `/allow` toggle. Prefer `/allow`
  over `--auto` for accurate indicator state.
- If you toggle auto-approve via the built-in palette command instead of `/allow`, the indicator
  will not update (it mirrors `/allow` state).
- Config changes require quitting and restarting opencode to take effect.

## Uninstall

Remove the `opencode-auto-allow` entry (or the local file path) from the `plugin` array in
`~/.config/opencode/tui.json`, then restart opencode.
