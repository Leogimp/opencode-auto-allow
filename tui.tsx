/** @jsxImportSource @opentui/solid */
import { createMemo, createSignal, Show, Switch, Match } from "solid-js"
import { RGBA } from "@opentui/core"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { homedir } from "os"
import { isAbsolute, relative, sep } from "path"

const KV_KEY = "auto_allow_enabled"
const SLOT_ORDER = 0

function abbreviateHome(input: string, home: string) {
  if (!home) return input
  const rel = relative(home, input)
  if (rel === "") return "~"
  if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) return input
  return "~" + sep + rel
}

function withAlpha(color: RGBA, factor: number): RGBA {
  return RGBA.fromValues(color.r, color.g, color.b, (color.a ?? 1) * factor)
}

async function kvValue(api: TuiPluginApi, key: string, fallback: boolean) {
  for (let i = 0; i < 50 && !api.kv.ready; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return api.kv.get(key, fallback) === true
}

function Directory(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const dir = createMemo(() => {
    const value = props.api.state.path.directory
    if (!value) return undefined
    const abbreviated = abbreviateHome(value, homedir())
    const branch = props.api.state.vcs?.branch
    return branch ? abbreviated + ":" + branch : abbreviated
  })

  return <Show when={dir()}>{(value) => <text fg={theme().textMuted}>{value()}</text>}</Show>
}

function Mcp(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current
  const list = createMemo(() => props.api.state.mcp())
  const err = createMemo(() => list().some((item) => item.status === "failed"))
  const count = createMemo(() => list().filter((item) => item.status === "connected").length)

  return (
    <Show when={list().length > 0}>
      <box gap={1} flexDirection="row" flexShrink={0}>
        <text fg={theme().text}>
          <Switch>
            <Match when={err()}>
              <span style={{ fg: theme().error }}>⊙ </span>
            </Match>
            <Match when={true}>
              <span style={{ fg: count() > 0 ? theme().success : theme().textMuted }}>⊙ </span>
            </Match>
          </Switch>
          {count()} MCP
        </text>
        <text fg={theme().textMuted}>/status</text>
      </box>
    </Show>
  )
}

function Version(props: { api: TuiPluginApi }) {
  const theme = () => props.api.theme.current

  return (
    <box flexShrink={0}>
      <text fg={theme().textMuted}>{props.api.app.version}</text>
    </box>
  )
}

function Indicator(props: { api: TuiPluginApi; enabled: () => boolean }) {
  const theme = () => props.api.theme.current
  const color = () => (props.enabled() ? theme().text : withAlpha(theme().text, 0.5))

  return <text fg={color()}>allow</text>
}

function Footer(props: { api: TuiPluginApi; enabled: () => boolean }) {
  const theme = () => props.api.theme.current
  const indicator = () =>
    props.enabled() ? theme().text : withAlpha(theme().text, 0.5)

  return (
    <box
      width="100%"
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      flexDirection="row"
      flexShrink={0}
      gap={2}
    >
      <text fg={indicator()}>allow</text>
      <Directory api={props.api} />
      <Mcp api={props.api} />
      <box flexGrow={1} />
      <Version api={props.api} />
    </box>
  )
}

function requestList(result: unknown): Array<{ id: string }> {
  if (Array.isArray(result)) return result
  if (Array.isArray((result as { data?: unknown })?.data)) return (result as { data: Array<{ id: string }> }).data
  if (Array.isArray((result as { response?: unknown })?.response))
    return (result as { response: Array<{ id: string }> }).response
  return []
}

async function replyOnce(api: TuiPluginApi, request: { id: string }) {
  try {
    await api.client.permission.reply({
      requestID: request.id,
      directory: api.state.path.directory,
      reply: "once",
    })
  } catch {
    // Requests can disappear if OpenCode handles them before this reply lands.
  }
}

async function approvePending(api: TuiPluginApi) {
  try {
    const result = await api.client.permission.list({ directory: api.state.path.directory })
    for (const request of requestList(result)) void replyOnce(api, request)
  } catch {
    // The permission service may not be reachable yet; new requests are handled by the event hook.
  }
}

const tui: TuiPlugin = async (api) => {
  const [enabled, setEnabled] = createSignal(await kvValue(api, KV_KEY, false))

  const toggle = () => {
    const next = !enabled()
    setEnabled(next)
    api.kv.set(KV_KEY, next)
    if (next) void approvePending(api)
    api.ui.toast({
      variant: next ? "success" : "info",
      title: "allow",
      message: next
        ? "Auto-approve permissions enabled. Explicit deny rules still apply."
        : "Auto-approve permissions disabled. Permission prompts work normally.",
      duration: 3000,
    })
  }

  api.keymap.registerLayer({
    commands: [
      {
        name: "allow.toggle",
        title: "Allow: toggle auto-approve permissions",
        category: "Permissions",
        namespace: "palette",
        slashName: "allow",
        run() {
          toggle()
        },
      },
    ],
  })

  api.lifecycle.onDispose(
    api.event.on("permission.asked", (event) => {
      if (!enabled()) return
      void replyOnce(api, event.properties)
    }),
  )

  if (enabled()) void approvePending(api)

  api.slots.register({
    order: SLOT_ORDER,
    slots: {
      home_footer() {
        return <Footer api={api} enabled={enabled} />
      },
      session_prompt_right() {
        return <Indicator api={api} enabled={enabled} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "@leo.gimp/opencode-auto-allow",
  tui,
}

export default plugin
