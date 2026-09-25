# Free AI Chat — Android independent use

This project is a Node/Express web app that can be deployed as a public HTTPS web app and installed on Android as a PWA.

## Important security rule

Do NOT upload `.env` or a real DeepSeek API key to GitHub. Put `DEEPSEEK_API_KEY` into the hosting provider's secret/environment-variable settings.

## Deploy with Render

1. Create a GitHub repository and upload this project. Do not upload `.env` or `node_modules`.
2. On Render, create a new Web Service and connect the GitHub repository.
3. Use:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Plan: Free for testing/personal use
4. Add environment variables:
   - `DEEPSEEK_API_KEY` = your real DeepSeek key
   - `DEEPSEEK_MODEL` = `deepseek-flash`
   - `AI_PROVIDER` = `deepseek`
5. Deploy. Render gives the service a public HTTPS `onrender.com` URL.
6. Open that URL on Android Chrome.
7. Chrome menu → Add to Home screen / Install app.

The chat history is stored in the Android browser's localStorage, so it stays on that phone/browser. The AI API key stays server-side.

## Free-tier note

Render's Free web services can spin down after 15 minutes without inbound traffic. The next request wakes the service and can take around a minute. Free instances are intended for hobby/testing use.
