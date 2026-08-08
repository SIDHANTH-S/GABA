# DeepSeek API Integration

Reference implementation for DeepSeek Chat API. Source: `deepseek.py`.

## What It Does

Python HTTP client that replicates DeepSeek's web chat interface, using extracted session credentials to interact with the API via SSE streaming.

> **Note:** This uses extracted browser session tokens, not an official API key. Suitable for testing/development. Use the official DeepSeek API for production.

## Key Functions

### `send_message_deepseek(prompt, chat_id)`
Sends a message and streams the response back.

```python
response = send_message_deepseek("What is Python used for?")
```

### `get_chat_history_deepseek(chat_id)`
Fetches all messages in a conversation.

### `create_new_chat_deepseek()`
Creates a new conversation session, returns new `chat_id`.

### `list_all_chats_deepseek()`
Lists all conversations with title, ID, and last updated date.

### `stream_response_manual(prompt, chat_id)`
Alternative streaming implementation with manual SSE parsing (more control).

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v0/chat/completion` | POST | Send message (streaming) |
| `/api/v0/chat_session/get_chat_session` | GET | Fetch conversation history |
| `/api/v0/chat_session/create` | POST | Create new conversation |
| `/api/v0/chat_session/fetch_page` | GET | List all conversations |

## Request Format

```python
payload = {
    "chat_session_id": chat_id,     # UUID of conversation
    "parent_message_id": None,       # For threading
    "model_type": "default",         # Model selection
    "prompt": prompt,                # User message
    "ref_file_ids": [],              # Attached file IDs
    "thinking_enabled": False,       # Extended reasoning
    "search_enabled": False,         # Web search
    "action": None,
    "preempt": False
}
```

## Streaming Response Parsing

DeepSeek uses SSE (Server-Sent Events). Response parsing handles 3 formats:

**Format 1: Patch update with path**
```json
{ "p": "/response/content", "o": "APPEND", "v": "Hello" }
```
→ Check if path contains "content" and op is APPEND/SET

**Format 2: Nested fragments**
```json
{ "v": { "response": { "fragments": [{ "content": "Hello" }] } } }
```
→ Iterate fragments array

**Format 3: Direct string value**
```json
{ "v": "Hello" }
```
→ Use `v` directly if it's a string

**Completion signal:**
```json
{ "status": "FINISHED" }
```

## Authentication

Session uses two auth mechanisms:

1. **Bearer token** (Authorization header)
   ```
   Authorization: Bearer <jwt_token>
   ```

2. **Browser cookies** (session, thumbcache)
   ```python
   cookies = {
       'ds_session_id': '...',
       'smidV2': '...',
   }
   ```

3. **PoW header** (anti-bot)
   ```
   x-ds-pow-response: <base64 proof-of-work>
   ```
   > This expires regularly and must be refreshed from browser DevTools.

## Known Limitations

1. **Token expiry:** `x-ds-pow-response` header expires (browser PoW challenge). App will return partial/empty responses when stale.
2. **Session dependency:** Requires active browser session (can't use standalone).
3. **No official API:** Uses internal endpoints that may change.

## Running the Integration

```bash
pip install requests
python deepseek.py
```

## Expected Output

```
🚀 DeepSeek AI Chat
==================================================
📋 Your Chats:
  • Previous conversation (9fde014c...) - 2026-08-07

📜 Chat History:
👤 You: What is Python used for?
🤖 DeepSeek: Python is used for...

💬 Sending: What is Python used for?
🤖 DeepSeek: Python is a versatile...
✅ Complete!
```

## Reuse in TypeScript

To replicate in `agent-core/llm-client.ts` if needed:

```typescript
async function sendDeepSeek(prompt: string, chatId: string): Promise<string> {
  const res = await fetch('https://chat.deepseek.com/api/v0/chat/completion', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_session_id: chatId,
      prompt,
      model_type: 'default',
      thinking_enabled: false,
      search_enabled: false,
      ref_file_ids: [],
      parent_message_id: null,
      action: null,
      preempt: false
    })
  });
  // Parse SSE stream...
}
```

## See Also

- [Qwen Integration](./qwen-integration.md) — similar pattern, different endpoint
- [API Overview](./README.md) — when to use which service
