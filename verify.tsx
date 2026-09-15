/** @jsxImportSource @opentui/solid */
import { ensureSolidTransformPlugin } from "@opentui/solid/bun-plugin"

ensureSolidTransformPlugin()

const { RGBA } = await import("@opentui/core")
const { testRender } = await import("@opentui/solid")
const { createSignal } = await import("solid-js")

const state = {
  toasts: [] as unknown[],
  kv: new Map<string, unknown>(),
  replies: [] as Array<{ requestID: string; reply: string }>,
  handlers: new Map<string, Array<(event: any) => void>>(),
}

const color = RGBA.fromInts(255, 255, 255)
const commands = new Map<string, any>()
const slots: any = {}
const api: any = {
  app: { version: "1.18.31" },
  client: {
    permission: {
      list: async () => ({ data: [{ id: "req-1", sessionID: "s1" }] }),
      reply: async (input: { requestID: string; reply: string }) => {
        state.replies.push({ requestID: input.requestID, reply: input.reply })
      },
    },
  },
  event: {
    on(type: string, handler: (event: any) => void) {
      const list = state.handlers.get(type) ?? []
      list.push(handler)
      state.handlers.set(type, list)
      return () => {}
    },
  },
  emit(type: string, properties: unknown) {
    for (const handler of state.handlers.get(type) ?? []) handler({ type, properties })
  },
  keymap: {
    registerLayer(layer: any) {
      for (const command of layer.commands ?? []) commands.set(command.name, command)
      return () => {}
    },
  },
  kv: {
    get(name: string, fallback?: unknown) {
      return state.kv.has(name) ? state.kv.get(name) : fallback
    },
    set(name: string, value: unknown) {
      state.kv.set(name, value)
    },
    ready: true,
  },
  lifecycle: { signal: new AbortController().signal, onDispose: () => () => {} },
  route: { register: () => () => {}, navigate() {}, current: { name: "home" } },
  slots: {
    register(p: any) {
      Object.assign(slots, p.slots)
      return "x"
    },
  },
  state: {
    path: { directory: "C:\\tmp\\project", worktree: "C:\\tmp\\project" },
    vcs: undefined,
    session: { count: () => 0, get: () => undefined, permission: () => [], question: () => [] },
    mcp: () => [],
    lsp: () => [],
  },
  theme: { current: new Proxy({}, { get: () => color }) },
  tuiConfig: { keybinds: { get: () => [], has: () => false, gather: () => [] } },
  ui: {
    dialog: { replace() {}, clear() {}, setSize() {}, size: "medium", depth: 0, open: false },
    toast(input: unknown) {
      state.toasts.push(input)
    },
  },
}

const { default: plugin } = await import("./tui.tsx")
await (plugin as any).tui(api)

function allowAlpha(frame: any): number {
  for (const line of frame.lines) {
    for (const span of line.spans) {
      if (span.text.includes("allow")) return span.fg.buffer[0]
    }
  }
  return -1
}

const app = await testRender(() => slots.session_prompt_right(), { width: 100, height: 4 })
try {
  await app.flush()
  const dimmed = allowAlpha(app.captureSpans() as any)

  api.emit("permission.asked", { id: "req-off", sessionID: "s1" })
  await new Promise((resolve) => setTimeout(resolve, 20))
  const repliesWhileDisabled = state.replies.length

  const command = commands.get("allow.toggle")
  if (!command) throw new Error("allow.toggle was not registered")
  command.run()
  await new Promise((resolve) => setTimeout(resolve, 20))
  const repliesOnEnable = state.replies.length

  await app.flush()
  await app.renderOnce()
  await app.flush()
  const bright = allowAlpha(app.captureSpans() as any)

  state.replies = []
  api.emit("permission.asked", { id: "req-on", sessionID: "s1" })
  await new Promise((resolve) => setTimeout(resolve, 20))
  const repliesWhileEnabled = state.replies.length

  state.replies = []
  command.run()
  await new Promise((resolve) => setTimeout(resolve, 20))
  const repliesOnDisable = state.replies.length

  console.log("dimmed indicator rgb:", dimmed, "(expect 128)")
  console.log("replies while disabled:", repliesWhileDisabled, "(expect 0)")
  console.log("replies on enable (pending approved):", repliesOnEnable, "(expect 1)")
  console.log("bright indicator rgb:", bright, "(expect 255)")
  console.log("replies while enabled:", repliesWhileEnabled, "(expect 1)")
  console.log("replies on disable:", repliesOnDisable, "(expect 0)")
  console.log("kv:", state.kv.get("auto_allow_enabled"))
} finally {
  app.renderer.destroy()
}
