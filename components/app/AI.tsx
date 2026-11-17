'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';
import Markdown from '../Markdown';
import { searchLibrary, type Section } from '@/lib/library';
import { MODELS, aiState, chat, lastModel, refreshCached, startModel, subscribeAI, type AIState, type ModelId } from '@/lib/ai';

const SYSTEM = `You are AFTERNET, an offline survival assistant running on the user's device with no internet.
Answer in short numbered steps. Be concise and practical. Prioritise safety.
For medical emergencies, first say to contact emergency services if at all possible.
If an AFTERNET GUIDE is given it is authoritative: base your answer on it, keep its exact numbers (times, doses, distances), and don't add methods it doesn't mention. Never mention the guide text or these instructions. If unsure, say so.`;

type Msg = { role: 'user' | 'assistant'; content: string; sources?: Section[]; field?: boolean };
const SUGGEST = ['How do I purify stream water?', 'Someone is bleeding heavily from the leg', 'How many solar watts to charge 2 phones a day?', 'Signs of hypothermia?'];

/** Drop lines (ignoring list numbers) that already appeared earlier in the answer. */
function dedupeLines(text: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    const key = line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').replace(/\*\*/g, '').trim().toLowerCase();
    const last = idx === lines.length - 1; // the line still being typed
    if (key.length > 12 && seen.has(key) && !last) return;
    if (key.length > 12 && !last) seen.add(key);
    out.push(line);
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}
function looping(text: string) {
  const lines = text.split('\n').map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim().toLowerCase()).filter((l) => l.length > 12);
  const counts = new Map<string, number>();
  for (const l of lines) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts.values()].some((n) => n >= 3);
}

// keep the conversation across tab switches
let history: Msg[] = [];

export default function AI() {
  const [ai, setAi] = useState<AIState>(aiState());
  const [pick, setPick] = useState<ModelId>('ranger');
  const [msgs, setMsgs] = useState<Msg[]>(history);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const stop = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const un = subscribeAI(setAi);
    refreshCached().then(() => {
      const st = aiState();
      const last = lastModel();
      const has = (Object.keys(st.cached) as ModelId[]).filter((k) => st.cached[k]);
      const phone = /Android|iPhone|iPad/i.test(navigator.userAgent);
      setPick(st.model ?? (last && st.cached[last] ? last : has[0] ?? (phone ? 'scout' : 'ranger')));
    });
    return un;
  }, []);
  useEffect(() => {
    history = msgs;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs]);

  const ready = ai.status === 'ready';
  const working = ai.status === 'downloading' || ai.status === 'loading';
  const current = MODELS.find((m) => m.id === pick)!;

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    const sources = searchLibrary(q, 3);
    const next: Msg[] = [...msgs, { role: 'user', content: q }];
    if (!ready) {
      setMsgs([...next, { role: 'assistant', field: true, sources, content: sources.length ? 'Field search (AI not started). Here’s what the survival guides say:' : 'Nothing in the guides matches that. Start the AI above, or try simpler words.' }]);
      return;
    }
    setBusy(true);
    // Ground the answer in ONE guide (the best match), each section once, without markdown noise.
    const top = sources[0]?.guide;
    const notes = top
      ? `${top.title}\n${top.body.replace(/\*\*/g, '').replace(/^> !? ?/gm, '').replace(/\n{2,}/g, '\n')}`.slice(0, 2400)
      : '';
    // Short memory: the last two exchanges, assistant replies trimmed so earlier mistakes don't snowball.
    const convo = next.slice(-4).map((m) => ({ role: m.role, content: m.role === 'assistant' ? dedupeLines(m.content).slice(0, 500) : m.content }));
    if (notes) convo[convo.length - 1] = { role: 'user', content: `AFTERNET GUIDE:\n${notes}\n\nQUESTION: ${q}` };
    setMsgs([...next, { role: 'assistant', content: '', sources }]);
    stop.current = new AbortController();
    try {
      let acc = '';
      const prompt = [{ role: 'system' as const, content: SYSTEM }, ...convo];
      if (process.env.NODE_ENV !== 'production') (window as unknown as { __afnPrompt: unknown }).__afnPrompt = prompt;
      for await (const t of chat(prompt, stop.current.signal)) {
        acc += t;
        const clean = dedupeLines(acc);
        setMsgs((m) => {
          const c = m.slice();
          c[c.length - 1] = { ...c[c.length - 1], content: clean };
          return c;
        });
        // small models sometimes loop: stop as soon as output starts repeating itself
        if (looping(acc)) {
          stop.current?.abort();
          break;
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setMsgs((m) => [...m.slice(0, -1), { ...m[m.length - 1], content: (m[m.length - 1].content || '') + `\n\n[Error: ${(e as Error).message}]` }]);
    } finally {
      setBusy(false);
      stop.current = null;
    }
  };

  return (
    <div className="pane ai">
      <div className="pane-head">
        <div>
          <p className="kicker">Local AI // on-device</p>
          <h1 className="pane-title">Your own AI. <span className="red">No servers.</span></h1>
          <p className="muted">Runs on this device: on the graphics chip when it can, otherwise the processor. Your questions never leave it. After a one-time download it works with no internet.</p>
        </div>
      </div>

      <div className="ai-bar">
        <div className="ai-models">
          {MODELS.map((m) => (
            <button key={m.id} className={`ai-model ${pick === m.id ? 'is-on' : ''}`} onClick={() => setPick(m.id)} disabled={working}>
              <span className="radio" />
              <div>
                <b>{m.name} <small>{m.size}</small></b>
                <small>{m.note}</small>
              </div>
              {ai.cached[m.id] && <span className="tag-ok">On device</span>}
              {ai.model === m.id && ready && <span className="live-dot" title="Running" />}
            </button>
          ))}
        </div>
        <div className="ai-go">
          {working ? (
            <div className="pack-prog">
              <div className="bar"><div style={{ width: `${Math.round(ai.progress * 100)}%` }} /></div>
              <small>{ai.message}</small>
            </div>
          ) : ready && ai.model === pick ? (
            <span className="ai-running"><i /> {ai.message}</span>
          ) : (
            <button className="btn btn-red" onClick={() => startModel(pick)} disabled={!ai.cached[pick] && typeof navigator !== 'undefined' && !navigator.onLine}>
              <Icon name={ai.cached[pick] ? 'power' : 'download'} size={18} />
              <span>{ai.cached[pick] ? `Start ${current.name}` : `Download & start ${current.name} (${current.size})`}</span>
            </button>
          )}
          {ai.status === 'error' && <p className="err small">{ai.message}</p>}
        </div>
      </div>

      <div className="chat">
        {msgs.length === 0 && (
          <div className="chat-empty">
            <div className="chat-orb"><Icon name="chip" size={34} /></div>
            <p className="muted">{ready ? 'Ask anything. Answers draw on the survival guides.' : 'Without a model, AFTERNET answers straight from the survival guides.'}</p>
            <div className="suggest">
              {SUGGEST.map((s) => <button key={s} onClick={() => ask(s)}>{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-body">
              {m.content ? (
                m.role === 'assistant' ? <Markdown src={m.content.replace(/^#{1,6} /gm, '## ').replace(/^\* /gm, '- ')} /> : m.content
              ) : busy && i === msgs.length - 1 ? (
                <span className="typing"><i /><i /><i /></span>
              ) : null}
            </div>
            {m.role === 'assistant' && !m.field && m.sources?.[0]?.guide.urgent && (
              <a href={`#guides/${m.sources[0].guide.id}`} className="critical-card">
                <span className="cc-flag">Critical · verified guide</span>
                <b>{m.sources[0].guide.title}</b>
                <small>AI answers can be wrong. For {m.sources[0].guide.title.toLowerCase()}, follow the step-by-step guide. Tap to open it.</small>
              </a>
            )}
            {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
              <div className="msg-src">
                {m.field && m.sources.map((s, k) => (
                  <div key={k} className="src-block">
                    <b>{s.guide.title} · {s.heading}</b>
                    <p>{s.text.replace(/\*\*/g, '').replace(/^> !? ?/gm, '').slice(0, 420)}{s.text.length > 420 ? '…' : ''}</p>
                  </div>
                ))}
                <div className="src-links">
                  <small>Full guide</small>
                  {m.sources.filter((s, k, a) => a.findIndex((x) => x.guide.id === s.guide.id) === k).map((s) => <a key={s.guide.id} href={`#guides/${s.guide.id}`}>{s.guide.title} →</a>)}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <textarea
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          placeholder={ready ? 'Ask AFTERNET anything…' : 'Ask the survival guides…'}
        />
        {busy ? (
          <button type="button" className="btn btn-ghost" onClick={() => stop.current?.abort()} aria-label="Stop"><Icon name="stop" size={18} /></button>
        ) : (
          <button type="submit" className="btn btn-red" disabled={!input.trim()} aria-label="Send"><Icon name="send" size={18} /></button>
        )}
      </form>
      <p className="disclaimer">AI can be wrong. In a medical emergency follow trained guidance and contact emergency services if you can.</p>
    </div>
  );
}
