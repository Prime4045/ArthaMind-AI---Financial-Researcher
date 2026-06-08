import os
import requests
import json
import dotenv

dotenv.load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

print("Testing Gemini HTTP API...")
print("API Key:", api_key)

if not api_key:
    print("No GEMINI_API_KEY found.")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
headers = {"Content-Type": "application/json"}
data = {
    "contents": [{"parts": [{"text": "Explain quantum computing in one sentence."}]}]
}

try:
    res = requests.post(url, headers=headers, json=data, timeout=10)
    print("Status Code:", res.status_code)
    try:
        print("Response:", json.dumps(res.json(), indent=2))
    except Exception:
        print("Raw Response:", res.text)
except Exception as e:
    print("HTTP Request Failed:", str(e))
