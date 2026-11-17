'use client';
import { useEffect, useRef, useState } from 'react';
import type { MLCEngine } from '@mlc-ai/web-llm';
import Icon from '../Icon';
import { searchLibrary, categoryById, type Section } from '@/lib/library';
import { readModel, writeModel } from './packs';

const MODELS = [
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', name: 'Scout', size: '≈ 0.3 GB', note: 'Fastest. Phones and older laptops.' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Ranger', size: '≈ 0.7 GB', note: 'Better answers. Most laptops.' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Sage', size: '≈ 1 GB', note: 'Best quality. Needs a decent GPU.' },
];

const SYSTEM = `You are AFTERNET, an offline survival assistant running entirely on the user's device with no internet.
Give clear, practical, step-by-step answers. Be concise. Prioritise safety.
For medical emergencies, first tell the user to contact emergency services if at all possible.
If field notes are provided, base your answer on them. If you are unsure, say so rather than guessing.`;

type Msg = { role: 'user' | 'assistant'; content: string; sources?: Section[] };

// Keep the engine alive across tab switches.
let engine: MLCEngine | null = null;
let engineModel: string | null = null;

const SUGGEST = ['How do I purify stream water?', 'Someone is bleeding heavily from the leg', 'How many solar watts to charge 2 phones a day?', 'Signs of hypothermia?'];

export default function AITab() {
  const [gpu, setGpu] = useState<boolean | null>(null);
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<{ text: string; p: number } | null>(null);
  const [ready, setReady] = useState(!!engine);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const nav = navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } };
      let ok = false;
      try {
        ok = !!(nav.gpu && (await nav.gpu.requestAdapter()));
      } catch {}
      setGpu(ok);
      const saved = readModel();
      if (saved) setModel(saved);
      if (engine && engineModel) setModel(engineModel);
      try {
        const { hasModelInCache } = await import('@mlc-ai/web-llm');
        const c: Record<string, boolean> = {};
        for (const m of MODELS) c[m.id] = await hasModelInCache(m.id).catch(() => false);
        setCached(c);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs]);

  const load = async (id = model) => {
    setErr('');
    setLoading({ text: 'Starting engine…', p: 0 });
    try {
      const webllm = await import('@mlc-ai/web-llm');
      if (engine && engineModel !== id) {
        await engine.reload(id);
      } else if (!engine) {
        engine = await webllm.CreateMLCEngine(id, {
          initProgressCallback: (r) => setLoading({ text: r.text, p: r.progress }),
        });
      }
      engineModel = id;
      writeModel(id);
      setCached((c) => ({ ...c, [id]: true }));
      setReady(true);
    } catch (e) {
      setErr(`Couldn't start the model: ${(e as Error).message}`);
    } finally {
      setLoading(null);
    }
  };

  const remove = async (id: string) => {
    const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
    if (engineModel === id && engine) {
      await engine.unload();
      engine = null;
      engineModel = null;
      setReady(false);
    }
    await deleteModelAllInfoInCache(id).catch(() => {});
    if (readModel() === id) writeModel(null);
    setCached((c) => ({ ...c, [id]: false }));
  };

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    const sources = searchLibrary(q, 3);
    const next: Msg[] = [...msgs, { role: 'user', content: q }];

    // Fallback without a model: answer straight from the library.
    if (!engine) {
      setMsgs([
        ...next,
        {
          role: 'assistant',
          content: sources.length
            ? 'Field search (no AI model loaded). Here is what the survival library says:'
            : 'No AI model is loaded and nothing in the survival library matches. Try different words, or load a model.',
          sources,
        },
      ]);
      return;
    }

    setBusy(true);
    const notes = sources.map((s) => `### ${s.guide.title}: ${s.heading}\n${s.text.slice(0, 1400)}`).join('\n\n');
    const history = next.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    if (notes) history[history.length - 1] = { role: 'user', content: `Field notes:\n${notes}\n\nQuestion: ${q}` };
    setMsgs([...next, { role: 'assistant', content: '', sources }]);
    try {
      const stream = await engine.chat.completions.create({
        messages: [{ role: 'system', content: SYSTEM }, ...history],
        stream: true,
        temperature: 0.4,
        max_tokens: 700,
      });
      let acc = '';
      for await (const chunk of stream) {
        acc += chunk.choices[0]?.delta?.content ?? '';
        setMsgs((m) => {
          const c = m.slice();
          c[c.length - 1] = { ...c[c.length - 1], content: acc };
          return c;
        });
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const current = MODELS.find((m) => m.id === model)!;

  return (
    <div className="pane ai">
      <div className="pane-head">
        <div>
          <p className="kicker">Local AI // on-device</p>
          <h1 className="pane-title">Your own AI. <span className="red">No servers.</span></h1>
          <p className="muted">The model runs on this device’s graphics chip. Your questions never leave it, and after the one-time download it works with no internet.</p>
        </div>
      </div>

      <div className="ai-models">
        {MODELS.map((m) => (
          <div key={m.id} className={`ai-model ${model === m.id ? 'is-on' : ''}`}>
            <button className="ai-pick" onClick={() => setModel(m.id)} disabled={!!loading}>
              <span className="radio" />
              <div>
                <b>{m.name} <small>{m.size}</small></b>
                <small>{m.note}</small>
              </div>
            </button>
            {cached[m.id] && (
              <span className="ai-cached">
                <Icon name="check" size={13} /> On device
                <button aria-label={`Delete ${m.name}`} onClick={() => remove(m.id)}><Icon name="trash" size={13} /></button>
              </span>
            )}
          </div>
        ))}
      </div>

      {gpu === false && (
        <div className="note-card warn">
          <Icon name="chip" size={22} />
          <div>
            <b>This browser can’t run the AI model</b>
            <p className="muted">The local AI needs WebGPU: recent Chrome or Edge on desktop and Android, or Safari on recent iPhones and Macs. You can still ask questions below: AFTERNET will answer from the survival library.</p>
          </div>
        </div>
      )}

      {gpu && !ready && (
        <div className="pack-card">
          <div>
            <p className="kicker">Model // {current.name}</p>
            <h3>{cached[model] ? 'Downloaded. Start it up.' : `One-time download, ${current.size}`}</h3>
            <p className="muted">{cached[model] ? 'Loads from this device. No internet needed.' : 'Use Wi-Fi. Once downloaded it’s stored on this device for offline use.'}</p>
          </div>
          {loading ? (
            <div className="pack-prog">
              <div className="bar"><div style={{ width: `${Math.round(loading.p * 100)}%` }} /></div>
              <small className="mono-trunc">{loading.text}</small>
            </div>
          ) : (
            <button className="btn btn-red" onClick={() => load()} disabled={!cached[model] && !navigator.onLine}>
              <Icon name={cached[model] ? 'power' : 'download'} size={18} />
              <span>{cached[model] ? 'Start model' : 'Download model'}</span>
            </button>
          )}
        </div>
      )}

      {ready && engineModel !== model && !loading && (
        <div className="note-card">
          <Icon name="chip" size={22} />
          <div>
            <b>Switch to {current.name}?</b>
            <p className="muted">Currently running {MODELS.find((m) => m.id === engineModel)?.name}.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => load(model)}><span>Switch</span></button>
        </div>
      )}
      {loading && ready && <div className="loading">{loading.text}</div>}

      <div className="chat">
        {msgs.length === 0 && (
          <div className="chat-empty">
            <span className="chat-status">
              <i className={ready ? 'on' : ''} /> {ready ? `${MODELS.find((m) => m.id === engineModel)?.name} online` : 'Field search mode (no model loaded)'}
            </span>
            <div className="suggest">
              {SUGGEST.map((s) => (
                <button key={s} onClick={() => ask(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-body">
              {m.content || (busy && i === msgs.length - 1 ? <span className="typing"><i /><i /><i /></span> : null)}
            </div>
            {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
              <div className="msg-src">
                {!engine && m.sources.map((s, k) => (
                  <div key={k} className="src-block">
                    <b>{s.guide.title} · {s.heading}</b>
                    <p>{s.text.replace(/\*\*/g, '').replace(/^> !? ?/gm, '').slice(0, 420)}{s.text.length > 420 ? '…' : ''}</p>
                  </div>
                ))}
                <div className="src-links">
                  <small>Sources:</small>
                  {m.sources.map((s, k) => {
                    const c = categoryById(s.guide.cat)!;
                    return (
                      <a key={k} href={`#${c.group === 'survive' ? 'library' : 'rebuild'}/${s.guide.id}`}>{s.guide.title}</a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {err && <p className="err">{err}</p>}

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
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
          placeholder={ready ? 'Ask AFTERNET anything…' : 'Ask the survival library…'}
        />
        <button type="submit" className="btn btn-red" disabled={busy || !input.trim()} aria-label="Send">
          <Icon name="send" size={18} />
        </button>
      </form>
      <p className="disclaimer">AI can be wrong. For medical emergencies, follow trained guidance and contact emergency services if you can.</p>
    </div>
  );
}
