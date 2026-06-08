import os

def search_files(dir_path, query):
    matches = []
    for root, dirs, files in os.walk(dir_path):
        if "venv" in root or "node_modules" in root or ".git" in root or ".next" in root:
            continue
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if query.lower() in content.lower():
                        matches.append(file_path)
            except Exception:
                pass
    return matches

if __name__ == "__main__":
    print("Searching for 'grok' in codebase:")
    grok_files = search_files(".", "grok")
    for f in grok_files:
        print("  Grok match:", f)
        
    print("\nSearching for 'xai' in codebase:")
    xai_files = search_files(".", "xai")
    for f in xai_files:
        print("  xAI match:", f)
