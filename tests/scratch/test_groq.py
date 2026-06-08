import os
import requests
import json
import dotenv

dotenv.load_dotenv()
api_key = os.environ.get("GROQ_API_KEY")

print("Testing Groq HTTP API...")
print("API Key:", api_key[:15] + "..." if api_key else "None")

if not api_key:
    print("No GROQ_API_KEY found.")
    exit(1)

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
