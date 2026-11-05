document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('scan-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const ocrInput = document.getElementById('ocr-input');
    const manualInput = document.getElementById('manual-input');
    
    const uploadSection = document.getElementById('upload-section');
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');

    function getBadgeHTML(safety) {
        switch(safety) {
            case 'safe':
                return '<span class="badge badge-safe"><i class="fa-solid fa-check-circle"></i> Safe</span>';
            case 'warning':
                return '<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Warning</span>';
            case 'danger':
                return '<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> Danger</span>';
            default:
                return '';
        }
    }

    scanBtn.addEventListener('click', () => {
        const ocrText = ocrInput.value;
        const manualText = manualInput.value;
        
        // Combine text from both inputs
        const combinedText = [ocrText, manualText].filter(Boolean).join(', ');
        
        if (!combinedText.trim()) {
            alert('กรุณากรอกข้อมูลส่วนผสม หรืออัปโหลดรูปภาพจำลอง');
            return;
        }

        const results = findMatchingIngredients(combinedText);
        
        // Clear previous results
        resultsGrid.innerHTML = '';

        if (results.length === 0) {
            resultsGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-muted);">ไม่พบข้อมูลส่วนผสมในฐานข้อมูล (ระบบกรองข้อมูลที่ไม่รู้จักออกโดยอัตโนมัติ)</p>';
        } else {
            results.forEach(item => {
                const card = document.createElement('div');
                card.className = 'ingredient-card';
                card.innerHTML = `
                    ${getBadgeHTML(item.safety)}
                    <div class="ingredient-name">${item.name}</div>
                    <p class="ingredient-desc">${item.description}</p>
                `;
                resultsGrid.appendChild(card);
            });
        }

        // Switch view to results
        uploadSection.style.display = 'none';
        resultsSection.style.display = 'block';
    });

    tryAgainBtn.addEventListener('click', () => {
        // Reset DOM and inputs
        ocrInput.value = '';
        manualInput.value = '';
        resultsGrid.innerHTML = '';
        
        // Return to upload screen without refreshing the page
        resultsSection.style.display = 'none';
        uploadSection.style.display = 'block';
    });
});
