import { Fragment } from 'react';

/** Renders the library's small markdown dialect without any HTML injection. */
function inline(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>));
}

export default function Markdown({ src }: { src: string }) {
  const lines = src.split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('## ')) { out.push(<h3 key={k++}>{inline(l.slice(3))}</h3>); i++; continue; }
    if (l.startsWith('> ! ')) { out.push(<div key={k++} className="callout warn"><b>WARNING</b><p>{inline(l.slice(4))}</p></div>); i++; continue; }
    if (l.startsWith('> ')) { out.push(<div key={k++} className="callout tip"><b>NOTE</b><p>{inline(l.slice(2))}</p></div>); i++; continue; }
    if (/^- /.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) items.push(lines[i++].slice(2));
      out.push(<ul key={k++}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\. /.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\d+\. /, ''));
      out.push(<ol key={k++}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ol>);
      continue;
    }
    out.push(<p key={k++}>{inline(l)}</p>);
    i++;
  }
  return <div className="prose">{out}</div>;
}
