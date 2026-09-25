const messagesEl = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const send = document.getElementById("send");
const provider = document.getElementById("provider");
const title = document.getElementById("title");
const chatListEl = document.getElementById("chatList");
const newChatBtn = document.getElementById("newChat");
const clearChatBtn = document.getElementById("clearChat");

const STORAGE_KEY = "free-ai-chat-history-v2";
let chats = [];
let currentChatId = null;
let history = [];

function saveChats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function loadChats() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    chats = Array.isArray(data) ? data : [];
  } catch {
    chats = [];
  }
}

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function currentChat() {
  return chats.find(c => c.id === currentChatId);
}

function createChat() {
  const chat = { id: id(), title: "New chat", messages: [], updatedAt: Date.now() };
  chats.unshift(chat);
  currentChatId = chat.id;
  history = [];
  saveChats();
  renderChatList();
  resetWelcome();
  input.focus();
}

function saveCurrentChat() {
  const chat = currentChat();
  if (!chat) return;
  chat.messages = [...history];
  chat.updatedAt = Date.now();
  const first = history.find(m => m.role === "user");
  if (first) {
    const t = first.content.trim().replace(/\s+/g, " ");
    chat.title = t.length > 34 ? t.slice(0, 34) + "..." : (t || "New chat");
  }
  saveChats();
  renderChatList();
}

function renderChatList() {
  chatListEl.innerHTML = "";
  if (!chats.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "No chats yet";
    chatListEl.appendChild(empty);
    return;
  }
  chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  chats.forEach(chat => {
    const item = document.createElement("div");
    item.className = "chat-item" + (chat.id === currentChatId ? " active" : "");

    const open = document.createElement("button");
    open.type = "button";
    open.className = "chat-item-title";
    open.textContent = chat.title || "New chat";
    open.onclick = () => openChat(chat.id);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-chat";
    del.textContent = "×";
    del.title = "Delete chat";
    del.onclick = e => {
      e.stopPropagation();
      if (!confirm("Delete this chat?")) return;
      chats = chats.filter(c => c.id !== chat.id);
      if (currentChatId === chat.id) {
        currentChatId = null;
        history = [];
        if (chats.length) openChat(chats[0].id); else resetWelcome();
      }
      saveChats();
      renderChatList();
    };

    item.append(open, del);
    chatListEl.appendChild(item);
  });
}

function openChat(chatId) {
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;
  currentChatId = chat.id;
  history = Array.isArray(chat.messages) ? [...chat.messages] : [];
  messagesEl.innerHTML = "";
  if (!history.length) resetWelcome();
  else history.forEach(m => addMessage(m.role, m.content));
  renderChatList();
  input.focus();
}

function addMessage(role, content) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "You" : "AI";
  const area = document.createElement("div");
  area.className = "message-content";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  area.appendChild(bubble);

  if (role === "assistant") {
    const actions = document.createElement("div");
    actions.className = "message-actions";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "message-action";
    copy.textContent = "Copy";
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(bubble.textContent); }
      catch { const t = document.createElement("textarea"); t.value = bubble.textContent; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
      copy.textContent = "Copied!";
      setTimeout(() => copy.textContent = "Copy", 1000);
    };
    const regen = document.createElement("button");
    regen.type = "button";
    regen.className = "message-action";
    regen.textContent = "Regenerate";
    regen.onclick = () => regenerate(row);
    actions.append(copy, regen);
    area.appendChild(actions);
  }
  row.append(avatar, area);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function resetWelcome() {
  messagesEl.innerHTML = `<div class="welcome"><div class="welcome-icon">✦</div><h2>What can I help you with?</h2><p>Ask a question, brainstorm an idea, translate text, or just chat.</p><div class="suggestions"><button type="button" data-prompt="Explain something difficult in simple English.">Explain simply</button><button type="button" data-prompt="Help me brainstorm three creative ideas.">Brainstorm ideas</button><button type="button" data-prompt="Translate this into natural English: ">Translate</button></div></div>`;
  bindSuggestions();
}

function bindSuggestions() {
  document.querySelectorAll("[data-prompt]").forEach(btn => btn.onclick = () => { input.value = btn.dataset.prompt; input.focus(); autoResize(); });
}

async function requestAI() {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: provider.value, messages: history })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data.answer;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || send.disabled) return;
  if (!currentChatId) createChat();
  if (!history.length) messagesEl.innerHTML = "";
  history.push({ role: "user", content: text });
  addMessage("user", text);
  input.value = "";
  autoResize();
  send.disabled = true;
  const thinking = addMessage("assistant", "Thinking…");
  thinking.classList.add("typing");
  try {
    const answer = await requestAI();
    thinking.classList.remove("typing");
    thinking.textContent = answer;
    history.push({ role: "assistant", content: answer });
    saveCurrentChat();
  } catch (error) {
    thinking.classList.remove("typing");
    thinking.textContent = `Error: ${error.message}`;
  } finally {
    send.disabled = false;
    input.focus();
  }
}

async function regenerate(row) {
  if (send.disabled || !history.length || history[history.length - 1].role !== "assistant") return;
  history.pop();
  row.remove();
  send.disabled = true;
  const thinking = addMessage("assistant", "Thinking…");
  thinking.classList.add("typing");
  try {
    const answer = await requestAI();
    thinking.classList.remove("typing");
    thinking.textContent = answer;
    history.push({ role: "assistant", content: answer });
    saveCurrentChat();
  } catch (error) {
    thinking.classList.remove("typing");
    thinking.textContent = `Error: ${error.message}`;
  } finally {
    send.disabled = false;
    input.focus();
  }
}

function autoResize() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
}

form.addEventListener("submit", e => { e.preventDefault(); sendMessage(); });
input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
input.addEventListener("input", autoResize);
newChatBtn.onclick = createChat;
clearChatBtn.onclick = () => {
  history = [];
  const chat = currentChat();
  if (chat) { chat.messages = []; chat.title = "New chat"; chat.updatedAt = Date.now(); saveChats(); }
  resetWelcome();
  renderChatList();
  input.focus();
};
provider.addEventListener("change", () => { title.textContent = provider.value === "doubao" ? "Doubao" : "DeepSeek"; });

loadChats();
if (chats.length) openChat(chats[0].id); else resetWelcome();
renderChatList();
input.focus();
