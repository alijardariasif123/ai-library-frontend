// File: frontend/src/pages/Chat.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';

const MODES = [
  { value: 'qa', label: 'Ask a doubt (Q&A)' },
  { value: 'summary', label: 'Chapter summary' },
  { value: 'topics', label: 'Important topics' },
  { value: 'mcq', label: 'Generate MCQs' },
  { value: 'explain_hindi', label: 'Explain in Hindi' }
];

function ChatPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('qa');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const location = useLocation();
  const chatBottomRef = useRef(null);

  // Scroll to bottom on messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load documents and optionally preselect one from navigation state
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/docs');
        const docs = res.data?.documents || [];
        const readyDocs = docs.filter((d) => d.status === 'ready');
        setDocuments(docs);

        const fromStateId = location.state?.documentId;
        if (fromStateId && readyDocs.some((d) => d._id === fromStateId)) {
          setSelectedDocId(fromStateId);
        } else if (readyDocs.length > 0) {
          setSelectedDocId(readyDocs[0]._id);
        }
      } catch (err) {
        console.error('Failed to load docs for chat:', err);
        // show a helpful message for 401 or generic error
        const msg =
          err?.response?.status === 401
            ? 'You are not authenticated. Please log in and try again.'
            : 'Failed to load your documents. Please try again.';
        setErrorMsg(msg);
      }
    };

    fetchDocs();
  }, [location.state]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!selectedDocId) {
      setErrorMsg('Please select an AI-ready document first.');
      return;
    }

    const userText = input.trim();
    setInput('');
    setErrorMsg('');

    // Add user message to UI
    const userMsg = {
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      role: 'user',
      text: userText,
      meta: { mode }
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      setSending(true);

      // IMPORTANT: backend expects field `question` (not `query`) — send `question`
      const payload = {
        documentId: selectedDocId,
        question: userText,
        mode
      };

      const res = await api.post('/ai/query', payload);

      // backend returns `answer` and we also added `sentence` for compatibility
      const answer = res?.data?.answer ?? res?.data?.sentence ?? 'No response from AI.';
      const sources = res?.data?.sources || res?.data?.meta?.sources || [];
      const convId = res?.data?.conversationId || null;

      const botMsg = {
        id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        role: 'assistant',
        text: answer,
        meta: {
          mode,
          sources,
          conversationId: convId
        }
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('AI query failed:', err);
      // Pick best available error text
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.response?.data ? JSON.stringify(err.response.data) : null);

      const friendly =
        err?.response?.status === 401
          ? 'You are not authenticated. Please log in and try again.'
          : serverMsg ||
            'AI tutor is not responding right now. Please try again in a moment.';

      setErrorMsg(friendly);

      // Optionally show a fallback assistant message in UI (non-blocking)
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          role: 'assistant',
          text:
            serverMsg ||
            'Sorry — I could not fetch an answer. Please check your connection or login status.',
          meta: { mode }
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  const readyDocs = documents.filter((d) => d.status === 'ready');

  return (
    <div className="chat-layout">
      {/* Chat window */}
      <section className="chat-window">
        <div className="card-header" style={{ padding: '0.9rem 1.2rem 0.5rem' }}>
          <div>
            <h2 className="card-title">AI Tutor</h2>
            <p className="card-subtitle">
              Ask doubts, generate summaries, MCQs, and Hindi explanations based on your document.
            </p>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="form-helper">
              Start by selecting a document on the right, choose a mode (e.g.{' '}
              <span className="code-tag">Important topics</span>), and ask something like:{' '}
              <span className="code-tag">&quot;DBMS ke sabse important exam topics batao&quot;</span>.
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-message ${
                m.role === 'user' ? 'chat-message--user' : 'chat-message--assistant'
              }`}
            >
              <div>{m.text}</div>
              <div className="chat-message__meta">
                {m.role === 'user' ? 'You' : 'Study AI'} ·{' '}
                {m.meta?.mode === 'summary'
                  ? 'Summary'
                  : m.meta?.mode === 'topics'
                  ? 'Important topics'
                  : m.meta?.mode === 'mcq'
                  ? 'MCQs'
                  : m.meta?.mode === 'explain_hindi'
                  ? 'Hindi explanation'
                  : 'Q&A'}
                {m.meta?.sources && m.meta.sources.length > 0 && m.role === 'assistant' && (
                  <>
                    {' '}
                    · pages:{' '}
                    {m.meta.sources
                      .map((s) => (s.pageNo ? `p.${s.pageNo}` : null))
                      .filter(Boolean)
                      .join(', ')}
                  </>
                )}
              </div>
            </div>
          ))}

          <div ref={chatBottomRef} />
        </div>

        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            placeholder="Type your question or request here… (Press Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <select className="select-input" value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            className="btn btn--primary"
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            {sending ? 'Asking AI…' : 'Ask AI'}
          </button>
        </div>

        {errorMsg && (
          <div className="form-error" style={{ padding: '0.45rem 0.9rem 0.6rem' }}>
            {errorMsg}
          </div>
        )}
      </section>

      {/* Document selector & tips */}
      <section className="card card--soft">
        <header className="card-header">
          <div>
            <h2 className="card-title">Select document</h2>
            <p className="card-subtitle">
              Choose which book/notes the AI should use for answering your questions.
            </p>
          </div>
        </header>

        {documents.length === 0 && (
          <div className="form-helper" style={{ marginTop: '0.5rem' }}>
            You haven&apos;t uploaded any document yet. Go to <span className="code-tag">Upload</span>{' '}
            and add your material first.
          </div>
        )}

        {documents.length > 0 && (
          <>
            <div className="form-field" style={{ marginTop: '0.4rem' }}>
              <label className="form-label" htmlFor="docSelect">
                AI will use this document as context
              </label>
              <select
                id="docSelect"
                className="select-input"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
              >
                <option value="">Select an AI-ready document…</option>
                {readyDocs.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.filename} (ready)
                  </option>
                ))}
              </select>
              <div className="form-helper">
                Only documents with <span className="code-tag">ready</span> status will give the best
                results.
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div className="card-subtitle" style={{ marginBottom: '0.4rem' }}>
                Modes explained
              </div>
              <ul className="plan-feature-list">
                <li>
                  <strong>Ask a doubt (Q&A):</strong> Ask any conceptual or numerical question based on
                  your material.
                </li>
                <li>
                  <strong>Chapter summary:</strong> Get a clean, exam-friendly summary of the
                  chapter.
                </li>
                <li>
                  <strong>Important topics:</strong> List of topics you must revise before exam.
                </li>
                <li>
                  <strong>Generate MCQs:</strong> MCQs with answers and short explanations.
                </li>
                <li>
                  <strong>Explain in Hindi:</strong> Same topic explained in simple Hindi with
                  examples.
                </li>
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default ChatPage;

