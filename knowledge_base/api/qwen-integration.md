# Qwen API Integration

Reference implementation for Alibaba's Qwen Chat API. Source: `qwen.py`.

## What It Does

Python HTTP client that replicates Qwen's web chat interface, using extracted JWT token and cookies for authentication. Supports streaming responses and conversation management.

> **Note:** Uses extracted browser session credentials, not an official API key. Use the official Qwen API (`dashscope.aliyuncs.com`) for production.

## Key Functions

### `send_message(prompt, chat_id)`
Sends a message and streams the response.

```python
response = send_message("What's the capital of France?")
```

### `get_chat_history(chat_id)`
Fetches conversation history including assistant's content list items.

### `create_new_chat()`
Generates a new UUID as a chat ID.

### `list_all_chats(page)`
Paginated list of all conversations.

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/chat/completions?chat_id=...` | POST | Send message (streaming) |
| `/api/v2/chats/{chat_id}?direction=up&limit=10` | GET | Fetch history |
| `/api/v2/chats/` | GET | List all conversations |

Base URL: `https://chat.qwen.ai`

## Request Format

```python
payload = {
    "model": "qwen3.8-max",      # Model selection
    "messages": [
        { "role": "user", "content": prompt }
    ],
    "feature_config": {
        "thinking_enabled": False,  # Extended reasoning off
        "output_schema": "phase",   # Structured output
        "research_mode": "normal",  # Search depth
        "auto_thinking": False,
        "thinking_mode": "Fast",    # Fast | Deep
        "auto_search": True         # Enable web search
    },
    "chat_type": "t2t",
    "sub_chat_type": "t2t"
}
```

## Streaming Response Parsing

SSE-based streaming with two response formats:

**Format 1: Direct content field**
```json
{ "content": "Paris", "done": false }
```
→ Use `data['content']` directly

**Format 2: OpenAI-compatible choices**
```json
{ 
  "choices": [{ "delta": { "content": "Paris" } }]
}
```
→ Use `data['choices'][0]['delta']['content']`

**Completion signal:**
```json
{ "done": true }
```
Also, SSE stream ends with `data: [DONE]` line.

## Authentication

Uses JWT token in cookies:
```python
cookies = {
    'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  # JWT
    'qwen-locale': 'en-US',
    'qwen-theme': 'dark',
    'x-ap': 'ap-southeast-1',   # Routing to Asia-Pacific datacenter
    'aui': '...',                # User ID
}
```

Required headers:
```python
headers = {
    'version': '0.2.82',     # Client version
    'source': 'web',
    'Origin': 'https://chat.qwen.ai',
    'Referer': 'https://chat.qwen.ai/',
}
```

## History Parsing

The history response structure varies. The implementation handles both:

```python
# Pattern 1: messages dict
messages_data = chat_info.get('history', {}).get('messages')
if isinstance(messages_data, dict):
    messages = list(messages_data.values())  # dict → list

# Pattern 2: messages list
elif isinstance(messages_data, list):
    messages = messages_data
```

Assistant messages have a `content_list` for rich content:
```python
if msg.get('content_list'):
    for item in msg['content_list']:
        if isinstance(item, dict) and item.get('content'):
            print(f"Qwen: {item['content']}")
```

## Models Available

| Model ID | Speed | Capability |
|----------|-------|------------|
| `qwen3.8-max` | Fast | General purpose (used in reference) |
| `qwen3-32b` | Medium | Higher capability |
| `qwen-plus` | Slow | Research-grade |

## Running the Integration

```bash
pip install requests
python qwen.py
```

## Expected Output

```
🚀 Qwen AI Chat Replication
========================================

📋 Fetching your chats...
📋 Your Chats (Page 1):
  • Previous conversations...

📜 Fetching chat history...
📜 Chat History:
👤 You: ...
🤖 Qwen: ...

💬 Sending messages...
💬 Sending: What's the capital of France?
🤖 Qwen: The capital of France is Paris...
✅ Complete!

🆕 Creating new chat...
✅ New chat created: <uuid>
```

## Differences from DeepSeek

| Aspect | DeepSeek | Qwen |
|--------|----------|------|
| Auth | Bearer token + PoW header | JWT in cookie |
| Chat ID creation | Server-side (API call) | Client-side (UUID) |
| Streaming format | Complex path-based patches | Simple content/choices |
| History structure | Flat array | Nested dict or list |
| Search support | Optional param | `auto_search: true` |
| Thinking mode | `thinking_enabled: bool` | `thinking_mode: Fast/Deep` |

## Official API Alternative

For production use, replace with the official DashScope API:

```python
import dashscope
from dashscope import Generation

Generation.call(
    model='qwen-max',
    messages=[{ 'role': 'user', 'content': prompt }],
    stream=True,
    api_key='sk-...'
)
```

## See Also

- [DeepSeek Integration](./deepseek-integration.md)
- [API Overview](./README.md)
