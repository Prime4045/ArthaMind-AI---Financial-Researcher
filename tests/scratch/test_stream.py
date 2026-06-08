import requests
import json
import sys

# Ensure UTF-8 output encoding for Windows command line print compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_research_stream(ticker):
    print(f"=== Testing AI Research Stream for {ticker} ===")
    url = f"http://127.0.0.1:8000/api/stock/{ticker}/research/stream"
    
    try:
        # Use stream=True to read Server-Sent Events (SSE) line-by-line
        res = requests.get(url, stream=True, timeout=60)
        print("Status Code:", res.status_code)
        
        if res.status_code == 200:
            for line in res.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith("data: "):
                        data = json.loads(line_str[6:])
                        status = data.get("status")
                        logs = data.get("logs", [])
                        if logs:
                            print(f"[{status.upper()}] Log: {logs[-1]}")
                        
                        if status == "completed":
                            print("\n=== Research Complete! ===")
                            state = data.get("state", {})
                            print("Master Report Sample:")
                            print(state.get("master_report", "")[:1000])
                            break
        else:
            print("Error:", res.text)
    except Exception as e:
        print("Request Failed:", str(e))

if __name__ == "__main__":
    # We will query TCS.NS
    test_research_stream("TCS.NS")
