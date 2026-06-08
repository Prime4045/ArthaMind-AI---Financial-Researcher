import requests
import sys
import os

# Ensure UTF-8 output encoding for Windows command line print compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

api_key = os.environ.get("GROQ_API_KEY") or "your_groq_api_key_here"

print("Testing Groq HTTP API...")
url = "https://api.groq.com/openai/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}
data = {
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Explain quantum computing in one sentence."}],
    "temperature": 0.2
}

try:
    res = requests.post(url, headers=headers, json=data, timeout=10)
    print("Status Code:", res.status_code)
    if res.status_code == 200:
        res_json = res.json()
        print("Response:")
        print(res_json["choices"][0]["message"]["content"])
    else:
        print("Raw Error Response:", res.text)
except Exception as e:
    print("HTTP Request Failed:", str(e))
