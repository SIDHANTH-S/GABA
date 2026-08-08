import requests
import json
import time
import sys
import warnings

# Suppress minor dependency warnings
warnings.filterwarnings("ignore")

# Ensure UTF-8 output encoding for Windows console compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Your extracted cookies and headers
cookies = {
    'ds_session_id': '2c416d513979401183667215c7a36e18',
    'smidV2': '20260630203404235f191ab2c2cabf2589851ac0fb55f70036b0977706049b0',
    '.thumbcache_6b2e5483f9d858d7c661c5e276b6a6ae': 'QdI6+0qlA3OLleIlQ8oCW3UVvuXYzUXQo6MhjI6AQRI6M1FzRJAZDEUZmzgGEiGefMTWsvq48JPoW2PNBX8j9A%3D%3D'
}

headers = {
    'Authorization': 'Bearer 9O/hchHAEV591uL05l4+qxeIf37mJnNE+DBpr39MH+IJyQGegquakfUGAySa2gwG',
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'x-client-bundle-id': 'com.deepseek.chat',
    'x-client-locale': 'en_US',
    'x-client-platform': 'web',
    'x-client-timezone-offset': '19800',
    'x-client-version': '2.3.0',
    'x-ds-pow-response': 'eyJhbGdvcml0aG0iOiJEZWVwU2Vla0hhc2hWMSIsImNoYWxsZW5nZSI6ImMxMzU4NjcwZmRjMGYxNzQ4YWU0NWE5YTU3NjE5ZGE0NDJhMDdhZGQ3Zjc4MDYxM2FmNzMzM2FlZjUwMzExYjUiLCJzYWx0IjoiM2Y1OTIwOTI0MWFmMTRkNWEwMzciLCJhbnN2ZXIiOjM1MjUzLCJzaWduYXR1cmUiOiIxMWRjZjBmYTczNWZhYTkzNmZlMTllNTA5MDVmNjMxYmYyNDU3ODAzNGZkYWIwNGY0NTIwNDJiNmVkOWEzOGQ3IiwidGFyZ2V0X3BhdGgiOiIvYXBpL3YwL2NoYXQvY29tcGxldGlvbiJ9',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Origin': 'https://chat.deepseek.com',
    'Referer': 'https://chat.deepseek.com/a/chat/s/9fde014c-9856-4ecc-bbf3-ef2e0ed40ef4',
    'x-hif-dliq': '3Qhn+G8Xy8YZFwVU4MRUnHLiRaUX3JTs6mBULbiv3ElomBbrzQqc8mg=.pVT8uy3W2MOpsJtN',
    'x-hif-leim': 'sKc6nREY1dAOnsGyTUaULytVx+hy2FfuoCbGEheH+HSORD9TysHHBFw=.3ukvObLx2n9Hoq8D'
}

# Your chat session ID
CHAT_ID = "9fde014c-9856-4ecc-bbf3-ef2e0ed40ef4"

def send_message_deepseek(prompt, chat_id=CHAT_ID):
    """Send a message to DeepSeek and stream the response"""
    
    url = "https://chat.deepseek.com/api/v0/chat/completion"
    
    payload = {
        "chat_session_id": chat_id,
        "parent_message_id": None,
        "model_type": "default",
        "prompt": prompt,
        "ref_file_ids": [],
        "thinking_enabled": False,
        "search_enabled": False,
        "action": None,
        "preempt": False
    }
    
    print(f"\n💬 Sending: {prompt}")
    print("🤖 DeepSeek: ", end='', flush=True)
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            cookies=cookies,
            stream=True
        )
        
        if response.status_code == 200:
            full_response = ""
            
            for line in response.iter_lines(decode_unicode=True):
                if line:
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str.strip():
                            try:
                                data = json.loads(data_str)
                                if not isinstance(data, dict):
                                    continue
                                
                                # Check if error or ban in response
                                if 'error_code' in data or 'err_msg' in data:
                                    print(f"[API Error: {data}]", end='', flush=True)
                                
                                # Check fragments inside initial response object
                                if 'v' in data and isinstance(data['v'], dict):
                                    resp_obj = data['v'].get('response', {})
                                    if isinstance(resp_obj, dict) and 'fragments' in resp_obj:
                                        for frag in resp_obj['fragments']:
                                            if isinstance(frag, dict) and frag.get('content'):
                                                print(frag['content'], end='', flush=True)
                                                full_response += frag['content']
                                
                                # 1. Check patch update format with path ('p')
                                if 'p' in data and 'v' in data:
                                    path = str(data.get('p', ''))
                                    if ('content' in path or 'fragment' in path) and (data.get('o') == 'APPEND' or data.get('o') == 'SET'):
                                        content = data['v']
                                        if isinstance(content, str):
                                            print(content, end='', flush=True)
                                            full_response += content
                                # 2. Direct content updates without path
                                elif 'v' in data and 'p' not in data:
                                    content = data['v']
                                    if isinstance(content, str):
                                        print(content, end='', flush=True)
                                        full_response += content
                                # 3. Choices format
                                elif 'choices' in data and len(data['choices']) > 0:
                                    delta = data['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        print(content, end='', flush=True)
                                        full_response += content
                                
                                # Check if complete
                                if data.get('status') == 'FINISHED' or data.get('quasi_status') == 'FINISHED':
                                    break
                                        
                            except json.JSONDecodeError:
                                pass
                    
                    elif line.startswith('event: close'):
                        break
            
            if full_response:
                print("\n✅ Complete!")
            else:
                print("\n⚠️ Request completed (Note: DeepSeek chat stream requires an active browser PoW header x-ds-pow-response)")
            return full_response
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"Response: {response.text[:300]}")
            return None
            
    except Exception as e:
        print(f"\n❌ Exception: {str(e)}")
        return None

def get_chat_history_deepseek(chat_id=CHAT_ID):
    """Get conversation history"""
    url = f"https://chat.deepseek.com/api/v0/chat_session/get_chat_session?chat_session_id={chat_id}"
    
    try:
        response = requests.get(url, headers=headers, cookies=cookies)
        
        if response.status_code == 200:
            data = response.json()
            print("\n📜 Chat History:")
            
            messages = []
            if isinstance(data, dict):
                biz_data = data.get('data', {}).get('biz_data', {}) if 'data' in data else data
                chat_session = biz_data.get('chat_session', {}) if isinstance(biz_data, dict) else {}
                messages = biz_data.get('chat_messages', []) or chat_session.get('messages', [])
            
            for msg in messages:
                if isinstance(msg, dict):
                    role = msg.get('role', '')
                    content = msg.get('content', '')
                    if role == 'USER' or role == 'user':
                        print(f"👤 You: {content}")
                    elif role == 'ASSISTANT' or role == 'assistant':
                        print(f"🤖 DeepSeek: {content}")
            return data
        else:
            print(f"Error fetching history ({response.status_code}): {response.text[:200]}")
            return None
    except Exception as e:
        print(f"Exception in get_chat_history_deepseek: {e}")
        return None

def create_new_chat_deepseek():
    """Create a new conversation"""
    url = "https://chat.deepseek.com/api/v0/chat_session/create"
    
    payload = {}
    
    try:
        response = requests.post(url, json=payload, headers=headers, cookies=cookies)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                chat_session = data.get('data', {}).get('biz_data', {}).get('chat_session', {})
                new_chat_id = chat_session.get('id') or data.get('conversation_id')
                if new_chat_id:
                    print(f"✅ New chat created: {new_chat_id}")
                    return new_chat_id
            print(f"❌ Could not parse conversation_id from response: {data}")
            return None
        else:
            print(f"❌ Error creating chat: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception in create_new_chat_deepseek: {e}")
        return None

def list_all_chats_deepseek():
    """Get all conversations"""
    url = "https://chat.deepseek.com/api/v0/chat_session/fetch_page?page=1&page_size=20"
    
    try:
        response = requests.get(url, headers=headers, cookies=cookies)
        
        if response.status_code == 200:
            data = response.json()
            print("\n📋 Your Chats:")
            
            sessions = []
            if isinstance(data, dict):
                biz_data = data.get('data', {}).get('biz_data', {}) if 'data' in data else data
                sessions = biz_data.get('chat_sessions', []) or data.get('sessions', [])
            
            for chat in sessions:
                if isinstance(chat, dict):
                    title = chat.get('title', 'Untitled')
                    chat_id = chat.get('id', '')
                    updated = chat.get('updated_at', '')
                    print(f"  • {title} ({chat_id[:8]}...) - {updated}")
            return data
        else:
            print(f"Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception in list_all_chats_deepseek: {e}")
        return None

def stream_response_manual(prompt, chat_id=CHAT_ID):
    """Manual SSE parsing - more control"""
    
    url = "https://chat.deepseek.com/api/v0/chat/completion"
    
    payload = {
        "chat_session_id": chat_id,
        "parent_message_id": None,
        "model_type": "default",
        "prompt": prompt,
        "ref_file_ids": [],
        "thinking_enabled": False,
        "search_enabled": False,
        "action": None,
        "preempt": False
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, cookies=cookies, stream=True)
        
        print(f"\n💬 {prompt}")
        print("🤖 ", end='', flush=True)
        
        full_text = ""
        
        for line in response.iter_lines(decode_unicode=True):
            if not line:
                continue
                
            if line.startswith('data: '):
                data_str = line[6:]
                
                try:
                    data = json.loads(data_str)
                    if not isinstance(data, dict):
                        continue
                    
                    if 'p' in data and 'v' in data:
                        path = str(data.get('p', ''))
                        if 'content' in path and (data.get('o') == 'APPEND' or data.get('o') == 'SET'):
                            text = data['v']
                            if isinstance(text, str):
                                print(text, end='', flush=True)
                                full_text += text
                    elif 'response' in data and isinstance(data['response'], dict):
                        resp = data['response']
                        if 'fragments' in resp and isinstance(resp['fragments'], list):
                            for frag in resp['fragments']:
                                if isinstance(frag, dict) and frag.get('type') == 'RESPONSE':
                                    text = frag.get('content', '')
                                    if text:
                                        print(text, end='', flush=True)
                                        full_text += text
                    elif 'v' in data and 'p' not in data:
                        text = data['v']
                        if isinstance(text, str):
                            print(text, end='', flush=True)
                            full_text += text
                    
                    if data.get('status') == 'FINISHED' or data.get('quasi_status') == 'FINISHED':
                        print("\n✅ Done!")
                        break
                        
                except json.JSONDecodeError:
                    pass
        
        return full_text
    except Exception as e:
        print(f"Exception in stream_response_manual: {e}")
        return ""

# ========== TEST IT OUT ==========

if __name__ == "__main__":
    print("🚀 DeepSeek AI Chat")
    print("=" * 50)
    
    # 1. List all chats
    list_all_chats_deepseek()
    
    # 2. Get current chat history
    get_chat_history_deepseek()
    
    # 3. Send a message
    response = send_message_deepseek("What is Python used for?")
    
    # 4. Send another message
    time.sleep(1)
    response2 = send_message_deepseek("Tell me more about web development")
    
    # 5. Create a new chat
    new_chat = create_new_chat_deepseek()
    if new_chat:
        send_message_deepseek("Hello! This is a new chat", chat_id=new_chat)