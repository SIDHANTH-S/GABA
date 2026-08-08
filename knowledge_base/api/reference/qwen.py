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

# Your extracted cookies
cookies = {
    'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZlYzI3NWVkLTRmOTAtNGFiOC1iYWI2LTUxMTE3M2Y5Y2Q5YyIsImxhc3RfcGFzc3dvcmRfY2hhbmdlIjoxNzUwNjYwODczLCJleHAiOjE3ODg2NTgwMjR9.pX5ERvTRb7Txy01DTg9Uq2YUElOBee1I_hPkrte_Bnk',
    'qwen-locale': 'en-US',
    'qwen-theme': 'dark',
    'qwen-thinking_mode': 'Fast',
    'x-ap': 'ap-southeast-1',
    'aui': 'fec275ed-4f90-4ab8-bab6-511173f9cd9c',
    'cna': 'ydLKIqrc0GQCAZ0zCHQ6OV4D',
    'cnaui': 'fec275ed-4f90-4ab8-bab6-511173f9cd9c',
    'sca': 'a45f49ec',
    'xlly_s': '1',
    'isg': 'BN3d53jhawm_UQ8T65vdnmNi7LnX-hFMzLC17p-iGjRjVv2IQUuTHX0OgVLQ3SkE',
    'tfstk': 'g6pZSSTsZAHa6Xgk43Xq8kQ8-lWOKtuSIK_fmnxcfNbiWK6Vmw-45CtXmtkV-EQgSicO0sSAD-fGoje33wsuIGjDjvXhDifGjNfMxwjcclbmDNf4Xp8zhRgt6n2Vht0SPYMWXcBAn4TMZw3CWiKhoD1M9CGsat0SPvs8l24OnnN1o95HxwI4IZ2Do6VhqwjgIZYc-6jlVPXcnEmF-Gs8iGfgnMDh0wbcntYDxDSA-GXcnExnYihcTZb7Lg5iXqrwXXmig1Qkjwy0EyCdsaMR8-2DLG7NrhVUn-vFb1JCXRWNK1OD2_p6qxydC3RhKiJxqS7VaIv1Kd0nE6CDKejH5mNAYI-DeOBzmAxFQN5lb1ZbHUxemQ1ed0DRQObMGOKb4VteQFt9LnZ0tOW6T_JNEYUGlBty3iJxkv8ym3dcTKzN40zAx6PkHCz0g1jdYaiEYGx4sor3XEkgMSC99M7SXcFYM1jdYaiEYSFA69IFPcnO.',
    'ssxmod_itna': '1-QqjxyD0DB7iQqfx4LxRx7I1DfxkxzxC5iOD_xQ5DODLxn4GQDUQeyAm/c7AiGinyGipHYR6xD=gD0Hw=sKx06FDf40Ws8=DbUqY9njxuHKfn07xpltRCiP43Varo_gQyQir84kjwFr0S33oDU4GnG8GHRrrD44DvDBYD74G_DDeDixGmG4DSKxD9DGPdglTi2eDEDYPdv4DmDGYdheDgmDDBDD64x7jTRexD0qh_rGrqzEhFw6085Eyt5Y9K80bDjMeD/8q6r0bCyUkeY=9ELzapGeGyF5GuD1mbhfy7RnniHZwHFwVN3SP3Bqlgx9A45xxPYotDoYBPP0QinDk0d5h5VMqKY57eDiZxPWhZ6NxPmN0UyPXgaXNtRSlIx0mNQGmcw=iDKeRzmw1nws7TqCedt03BIwmj=AYDKbO4xBBwHin5I5x62_eRF7I_GDxD',
    'ssxmod_itna2': '1-QqjxyD0DB7iQqfx4LxRx7I1DfxkxzxC5iOD_xQ5DODLxn4GQDUQeyAm/c7AiGinyGipHYR6xD=sDDc5Pr8l22dDLGCuWv=8DGXKTkg10GhkhOARHq5vfTrqekoAi2yxzs1W2GHpZ_78xkW9D51cdXBaqXWr4q/Hd5=DG0xEH6jxxDRHd3GFdvxBDZ6hxsarIMcy_sgeGCZEmiUFfHzadqW365ZBdgUoa6GI71Pk5UUcfs_fA569ph25IDdoz52AGH/Hh5VEHeQMI3ictTFI4HoWgsf=fX9lWXi5hZ6Ilan5ka1WOWrPeqtP02XElvHl66l5Xjxe7G6jvD3EhrGLjhYRp3GULmfylvsef67GQp5=6p3foUPojWPPWAMxqSDwYUEzlpwD=upEdPrr6U830dgj40=CZpHYu/mTg6E7gp1hi4RIKjNGPKBmTV2vGWpw1m/Er/j=4rRwmLk/ierRyARhrpcQr5UaMDH=bDm6F/Yo6I3fAPb/vezGv4IDUN7W5jQc8IFvoab9L_/a5IuUSBbxop9PdvGnRWKbb7lYPZvh1dvoUh8OmlgzZA5Kmfo3X7GCciSBrg3XC6XepdrptT86ZaxSjLQ2A4M59exxXTxLrrZAOxZXA9gEAX7Rggo_U2A5ImW2qGLNDhD97dGI0kDCg0Iz/3YQeQGCAPq3Y1jkMimUlIjKePnPR2ZOqOPhjk9DDfYPiHWx8x2nY=DbWHxxe9QTAx=hQD2YakYC7xixhlxPrrnqg0tnqVDIAKgrtlxerdt_4D'
}

headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'version': '0.2.82',
    'source': 'web',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    'Origin': 'https://chat.qwen.ai',
    'Referer': 'https://chat.qwen.ai/'
}

# Your chat ID from the logs
CHAT_ID = "76adb034-4b5e-4316-9100-131033290f3b"

def get_chat_history(chat_id=CHAT_ID):
    """Fetch conversation history"""
    url = f"https://chat.qwen.ai/api/v2/chats/{chat_id}?direction=up&limit=10"
    try:
        response = requests.get(url, headers=headers, cookies=cookies)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and data.get('success'):
                chat_info = data.get('data', {}).get('chat', {})
                if not isinstance(chat_info, dict):
                    chat_info = {}
                
                # Check history.messages first, then messages
                messages_data = chat_info.get('history', {}).get('messages') or chat_info.get('messages', [])
                
                messages = []
                if isinstance(messages_data, dict):
                    messages = list(messages_data.values())
                elif isinstance(messages_data, list):
                    messages = messages_data
                    
                print("\n📜 Chat History:")
                for msg in messages:
                    if not isinstance(msg, dict):
                        continue
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')
                    if role == 'user':
                        print(f"👤 You: {content}")
                    elif role == 'assistant':
                        if msg.get('content_list'):
                            for item in msg['content_list']:
                                if isinstance(item, dict) and item.get('content'):
                                    print(f"🤖 Qwen: {item['content']}")
                        elif content:
                            print(f"🤖 Qwen: {content}")
            return data
        else:
            print(f"Error fetching chat history: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception in get_chat_history: {e}")
        return None

def send_message(prompt, chat_id=CHAT_ID):
    """Send a message and stream the response"""
    url = f"https://chat.qwen.ai/api/v2/chat/completions?chat_id={chat_id}"
    
    payload = {
        "model": "qwen3.8-max",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "feature_config": {
            "thinking_enabled": False,
            "output_schema": "phase",
            "research_mode": "normal",
            "auto_thinking": False,
            "thinking_mode": "Fast",
            "auto_search": True
        },
        "chat_type": "t2t",
        "sub_chat_type": "t2t"
    }
    
    print(f"\n💬 Sending: {prompt}")
    print("🤖 Qwen: ", end='', flush=True)
    
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
                        if data_str.strip() and data_str != '[DONE]':
                            try:
                                data = json.loads(data_str)
                                text = ""
                                if isinstance(data, dict):
                                    if 'content' in data and data['content']:
                                        text = data['content']
                                    elif 'choices' in data and len(data['choices']) > 0:
                                        delta = data['choices'][0].get('delta', {})
                                        text = delta.get('content', '')
                                
                                if text:
                                    print(text, end='', flush=True)
                                    full_response += text
                                    
                                if isinstance(data, dict) and data.get('done'):
                                    print("\n✅ Complete!")
                                    return full_response
                            except json.JSONDecodeError:
                                pass
            
            print("\n✅ Complete!")
            return full_response
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"\n❌ Exception: {str(e)}")
        return None

import uuid

def create_new_chat():
    """Create a new conversation ID"""
    new_chat_id = str(uuid.uuid4())
    print(f"✅ New chat created: {new_chat_id}")
    return new_chat_id

def list_all_chats(page=1):
    """Get all your conversations"""
    url = f"https://chat.qwen.ai/api/v2/chats/?page={page}&exclude_project=true"
    try:
        response = requests.get(url, headers=headers, cookies=cookies)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and data.get('success'):
                chats_data = data.get('data')
                chats = []
                if isinstance(chats_data, list):
                    chats = chats_data
                elif isinstance(chats_data, dict) and 'list' in chats_data:
                    chats = chats_data['list']
                else:
                    print(f"Unexpected data format: {type(chats_data)}")
                    return None
                
                print(f"\n📋 Your Chats (Page {page}):")
                for chat in chats:
                    if isinstance(chat, dict):
                        title = chat.get('title', 'Untitled')
                        chat_id = chat.get('id', '')
                        updated = chat.get('updated_at', '')
                        print(f"  • {title} ({chat_id[:8]}...) - {updated}")
                return chats
            else:
                print(f"API returned success=false: {data}")
                return None
        else:
            print(f"Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception in list_all_chats: {e}")
        return None

# ========== TEST IT OUT ==========

if __name__ == "__main__":
    print("🚀 Qwen AI Chat Replication")
    print("=" * 40)
    
    # 1. List all chats
    print("\n📋 Fetching your chats...")
    list_all_chats()
    
    # 2. Get current chat history
    print("\n📜 Fetching chat history...")
    get_chat_history()
    
    # 3. Send a new message
    print("\n💬 Sending messages...")
    response = send_message("What's the capital of France?")
    
    if response:
        # 4. Send another message in same conversation
        time.sleep(1)
        response2 = send_message("And what's the population there?")
    
    # 5. Create a new chat
    print("\n🆕 Creating new chat...")
    new_chat = create_new_chat()
    if new_chat:
        send_message("Hello, this is a new chat!", chat_id=new_chat)