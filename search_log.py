import json

log_path = r'C:\Users\Wisithbhol S\.gemini\antigravity\brain\2886f8d1-2a1e-4383-a104-93477aba081c\.system_generated\logs\transcript_full.jsonl'
with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(reversed(lines)):
    try:
        data = json.loads(line)
        content = data.get('content', '')
        if 'i18n.js' in content and 'AI-Powered Safety Check' in content and '??' not in content:
            print(f'Found at reversed index {i}')
            with open('recovered_i18n.txt', 'w', encoding='utf-8') as out:
                out.write(content)
            break
            
        for call in data.get('tool_calls', []):
            call_str = json.dumps(call)
            if 'i18n.js' in call_str and 'AI-Powered Safety Check' in call_str and '??' not in call_str:
                print(f'Found in tool call at reversed index {i}')
                with open('recovered_tool.json', 'w', encoding='utf-8') as out:
                    out.write(call_str)
                break
    except Exception as e:
        pass
