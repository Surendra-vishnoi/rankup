import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * MarkdownRenderer
 * Renders Markdown with:
 *  - KaTeX math   ($inline$ and $$block$$)
 *  - Syntax-highlighted code blocks (C++, Python, and others via Prism)
 *
 * Props:
 *  children  — the raw markdown string
 *  compact   — if true, strips extra spacing (used in post-card previews)
 */
export default function MarkdownRenderer({ children = '', compact = false }) {
  return (
    <div className={`markdown-body ${compact ? 'markdown-compact' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          /* ── Code blocks ── */
          code({ node, inline, className, children: codeChildren, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';

            // Normalise common shorthand: "c++" → "cpp"
            const langMap = { 'c++': 'cpp', 'c#': 'csharp', 'js': 'javascript', 'ts': 'typescript', 'py': 'python' };
            const normalised = langMap[language.toLowerCase()] || language;

            if (!inline && match) {
              return (
                <div className="code-block-wrapper">
                  <div className="code-block-header">
                    <span className="code-lang-badge">{normalised.toUpperCase()}</span>
                    <CopyButton code={String(codeChildren).replace(/\n$/, '')} />
                  </div>
                  <SyntaxHighlighter
                    style={oneDark}
                    language={normalised}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: '0 0 10px 10px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      background: '#0d1117',
                    }}
                    codeTagProps={{ style: { fontFamily: "'JetBrains Mono', monospace" } }}
                    {...props}
                  >
                    {String(codeChildren).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            }

            // Inline code
            return (
              <code
                className="inline-code"
                {...props}
              >
                {codeChildren}
              </code>
            );
          },

          /* ── Blockquote ── */
          blockquote({ children: bqChildren }) {
            return <blockquote className="md-blockquote">{bqChildren}</blockquote>;
          },

          /* ── Links — open in new tab ── */
          a({ href, children: linkChildren }) {
            if (href && href.startsWith('/profile/')) {
              return (
                <a href={href} className="text-blue-400 font-bold hover:underline hover:text-blue-300 transition-colors">
                  {linkChildren}
                </a>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="md-link"
              >
                {linkChildren}
              </a>
            );
          },
        }}
      >
        {String(children).replace(/(?<!\w)@([a-zA-Z0-9_]+)/g, '[@$1](/profile/$1)')}
      </ReactMarkdown>
    </div>
  );
}

/* ── Copy-to-clipboard button ── */
function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {/* ignore */ }
  };

  return (
    <button onClick={handleCopy} className="copy-btn" aria-label="Copy code">
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

// useState needed for CopyButton
import { useState } from 'react';
