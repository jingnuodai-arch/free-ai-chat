# Free AI Chat

A minimal English AI chat website using a server-side API key.

## 1. Install

```bash
npm install
```

## 2. Configure

Copy `.env.example` to `.env`.

For DeepSeek:

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_key
DEEPSEEK_MODEL=deepseek-flash
```

For Doubao / Volcengine Ark:

```env
AI_PROVIDER=doubao
ARK_API_KEY=your_key
DOUBAO_MODEL=your_endpoint_id
```

## 3. Run

```bash
npm start
```

Open:

http://localhost:3000

## Important

Do not put API keys in `public/app.js` or `public/index.html`.
The browser talks to `/api/chat`; the server talks to the AI provider.
