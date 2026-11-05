document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic for SPA feel
    const navBtns = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state on nav buttons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show target view, hide others
            const targetId = btn.getAttribute('data-target');
            viewSections.forEach(section => {
                if (section.id === targetId) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });

    // Routine Logic
    const addRoutineBtn = document.getElementById('add-routine-btn');
    const routineInput = document.getElementById('routine-input');
    const routineList = document.getElementById('routine-list');

    // Load routine from localStorage
    let myRoutine = JSON.parse(localStorage.getItem('chaecheck_routine')) || [];

    function renderRoutine() {
        routineList.innerHTML = '';
        if (myRoutine.length === 0) {
            routineList.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-muted);">ยังไม่มีรายการสกินแคร์ใน Routine ของคุณ</p>';
            return;
        }

        myRoutine.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'routine-card';
            card.innerHTML = `
                <div class="routine-name">${item}</div>
                <button class="delete-btn" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
            `;
            routineList.appendChild(card);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.getAttribute('data-index');
                myRoutine.splice(index, 1); // Remove item
                saveRoutine();
                renderRoutine();
            });
        });
    }

    function saveRoutine() {
        localStorage.setItem('chaecheck_routine', JSON.stringify(myRoutine));
    }

    addRoutineBtn.addEventListener('click', () => {
        const productName = routineInput.value.trim();
        if (productName) {
            myRoutine.push(productName);
            saveRoutine();
            routineInput.value = ''; // clear input
            renderRoutine();
        }
    });

    // Initial render
    renderRoutine();
});
