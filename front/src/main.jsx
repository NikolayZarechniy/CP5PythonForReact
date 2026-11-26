import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// StrictMode специально не используется: в dev-режиме он вызывает useEffect
// дважды и создаёт два WebSocket-соединения, из-за чего пользователь
// «подключается» к чату два раза.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
