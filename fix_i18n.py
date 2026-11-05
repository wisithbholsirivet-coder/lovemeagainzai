
with open('js/i18n.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
lines[100] = "      'scanner.analyzing':             '?????????????????????...',\n"
with open('js/i18n.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

