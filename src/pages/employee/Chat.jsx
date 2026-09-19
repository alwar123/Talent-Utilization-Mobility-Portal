import { useState } from "react"
import { useStore } from "../../lib/store"

export default function Chat() {
  const { sessionUser, state, sendChat } = useStore()
  const [draft, setDraft] = useState("")
  const messages = state.chats[sessionUser.id] || []

  return (
    <main className="mx-auto flex min-h-[calc(100svh-96px)] max-w-3xl flex-col px-6 py-10">
      <h1 className="display text-4xl">AI career assistant</h1>
      <div className="mt-8 flex-1 space-y-6">
        {messages.map((m, i) => (
          <article key={i} className={m.from === "bot" ? "max-w-[90%] whitespace-pre-wrap text-ink-soft" : "ml-auto max-w-[80%] bg-mist px-4 py-3"}>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-coral">{m.from === "bot" ? "SkillSphere" : sessionUser.name}</p>
            <p className="mt-2 leading-7">{m.text}</p>
          </article>
        ))}
      </div>
      <form
        className="sticky bottom-0 mt-8 flex gap-2 bg-paper py-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.trim()) return
          sendChat(sessionUser.id, draft)
          setDraft("")
        }}
      >
        <input className="field" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your question..." />
        <button className="btn-coral" type="submit">
          Send
        </button>
      </form>
    </main>
  )
}
