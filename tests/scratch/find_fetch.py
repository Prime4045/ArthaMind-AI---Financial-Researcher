with open("frontend/src/app/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "fetch(" in line or "fetch " in line:
        print(f"=== Match at line {idx+1} ===")
        # Print 3 lines before and after
        start = max(0, idx - 4)
        end = min(len(lines), idx + 5)
        for i in range(start, end):
            print(f"{i+1}: {lines[i].strip()}")
        print("-" * 40)
