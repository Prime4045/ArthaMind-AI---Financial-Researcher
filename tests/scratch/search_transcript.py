import json

log_path = r"C:\Users\HP\.gemini\antigravity\brain\6ad81aa4-9d9a-4e08-ad6a-1cdbf12e1555\.system_generated\logs\transcript.jsonl"
print("Searching for 'grok' in transcript logs...")

try:
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                content = data.get("content", "")
                if not content and "tool_calls" in data:
                    content = str(data["tool_calls"])
                if "grok" in content.lower():
                    print(f"Step: {data.get('step_index')} | Type: {data.get('type')}")
                    print("Content:", content[:500])
                    print("-" * 50)
            except Exception as line_err:
                pass
except Exception as e:
    print("Failed to read transcript:", str(e))
