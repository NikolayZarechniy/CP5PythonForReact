import { useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://localhost:8000';

export default function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');

  const wsRef = useRef(null);
  const listRef = useRef(null);

  // Подключаемся к WebSocket, когда пользователь вошёл в чат
  useEffect(() => {
    if (!joined) return;

    const ws = new WebSocket(`${WS_URL}/ws/${encodeURIComponent(name)}`);
    wsRef.current = ws;
    setStatus('Подключение...');

    ws.onopen = () => {
      setStatus('Вы в чате');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    ws.onerror = () => {
      setStatus('Ошибка соединения: проверьте, что backend запущен на localhost:8000');
    };

    // если сервер выключили, соединение просто закрывается — тоже показываем ошибку
    ws.onclose = () => {
      setStatus((prev) =>
        prev.startsWith('Ошибка') ? prev : 'Ошибка соединения: связь с сервером потеряна'
      );
    };

    // закрываем соединение при выходе со страницы
    return () => ws.close();
  }, [joined, name]);

  // прокрутка списка вниз при новом сообщении
  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setName(trimmed);
    setJoined(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ text: trimmed }));
    setText('');
  };

  if (!joined) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form
          onSubmit={handleJoin}
          style={{
            width: 320,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2 style={{ margin: 0, textAlign: 'center' }}>Чат</h2>
          <p style={{ margin: 0, color: '#666', fontSize: 14, textAlign: 'center' }}>
            Введите имя, чтобы войти
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 15 }}
          />
          <button
            type="submit"
            style={{
              padding: 10,
              borderRadius: 8,
              border: 'none',
              background: '#1976d2',
              color: '#fff',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: '0 auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <strong>Чат</strong>
        <span
          style={{
            fontSize: 14,
            color: status.startsWith('Ошибка') ? '#d32f2f' : '#666',
          }}
        >
          {name} · {status}
        </span>
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 16,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center' }}>Сообщений пока нет...</p>
        )}

        {messages.map((message, index) =>
          message.type === 'system' ? (
            <div
              key={index}
              style={{
                textAlign: 'center',
                fontStyle: 'italic',
                fontSize: 14,
                color: '#888',
              }}
            >
              {message.text} · {message.timestamp}
            </div>
          ) : (
            <div
              key={index}
              style={{
                alignSelf: message.username === name ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
              }}
            >
              <div
                style={{
                  marginBottom: 2,
                  fontSize: 12,
                  color: '#888',
                  textAlign: message.username === name ? 'right' : 'left',
                }}
              >
                {message.username === name ? 'Вы' : message.username} · {message.timestamp}
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: message.username === name ? '#1976d2' : '#f1f1f1',
                  color: message.username === name ? '#fff' : '#000',
                }}
              >
                {message.text}
              </div>
            </div>
          )
        )}
      </div>

      <form
        onSubmit={handleSend}
        style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #ddd' }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Введите сообщение..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 15 }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#1976d2',
            color: '#fff',
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
