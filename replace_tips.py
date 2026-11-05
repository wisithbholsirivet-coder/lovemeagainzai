import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove Glare Tip Banner
glare_start = text.find('<!-- Glare Tip Banner')
glare_end = text.find('</div>', text.find('</ul>', glare_start)) + 6
if glare_start != -1 and glare_end != -1:
    # Also remove trailing whitespace/newlines
    while glare_end < len(text) and text[glare_end] in [' ', '\n', '\r']:
        glare_end += 1
    text = text[:glare_start] + text[glare_end:]

# 2. Replace Curved Label Tip
curved_start = text.find('<!-- Curved Label Tip')
curved_end = text.find('</details>', curved_start) + 10

new_tips = '''<!-- Photography Tips -->
          <details class="curved-label-tip" id="photo-tips">
            <summary class="curved-label-tip__toggle">
              ?? <span data-i18n="tip.photo.title">Photography Tips for Best Results</span>
              <span class="curved-label-tip__arrow">?</span>
            </summary>
            <ul class="curved-label-tip__list">
              <li>?? <strong>Good lighting</strong> – shoot near a window with overcast light; avoid harsh shadows and direct flash</li>
              <li>?? <strong>Lay flat</strong> – press tube/bottle on a flat surface and shoot straight down</li>
              <li>?? <strong>White paper trick</strong> – slide white card next to glossy product to bounce soft fill light</li>
              <li>?? <strong>Tilt slightly</strong> – angle metallic product 5–10° to move specular glare off the text</li>
              <li>?? <strong>Crop tight</strong> – crop so only the ingredient list fills the frame</li>
              <li>?? <strong>Highest resolution</strong> – use your phone's main camera</li>
              <li>?? <strong>Still not working?</strong> – paste the text manually below</li>
            </ul>
          </details>'''

if curved_start != -1 and curved_end != -1:
    text = text[:curved_start] + new_tips + text[curved_end:]

with open('index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print("Done replacing tips")
