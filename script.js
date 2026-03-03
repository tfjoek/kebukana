let masterMode = 'hiragana';
let currentSubTab = 'main';
let selectedKanas = ['あ', 'い', 'う', 'え', 'お'];
let currentKana = {};

const display = document.getElementById('kana-display');
const input = document.getElementById('answer-input');
const grid = document.getElementById('kana-selection-grid');
const prefsSection = document.getElementById('prefs-content');
const toggleBtn = document.getElementById('toggle-prefs');

function renderGrid() {
    grid.innerHTML = '';
    
    // Determine which datasets to show
    let activeRows = [];
    if (masterMode === 'both') {
        activeRows = [...kanaSets['hiragana'][currentSubTab], ...kanaSets['katakana'][currentSubTab]];
    } else {
        activeRows = kanaSets[masterMode][currentSubTab];
    }

    activeRows.forEach(row => {
        const group = document.createElement('div');
        group.className = 'row-group';
        const label = document.createElement('div');
        label.className = 'row-label';
        label.textContent = row.label;
        label.onclick = () => toggleRow(row);
        group.appendChild(label);

        const tilesContainer = document.createElement('div');
        tilesContainer.className = 'tiles-container';
        row.items.forEach(item => {
            const tile = document.createElement('div');
            tile.className = 'kana-tile';
            if (selectedKanas.includes(item.char)) tile.classList.add('active');
            tile.innerHTML = `<span>${item.char}</span><span>${item.romaji}</span>`;
            tile.onclick = () => toggleKana(item.char);
            tilesContainer.appendChild(tile);
        });
        group.appendChild(tilesContainer);
        grid.appendChild(group);
    });
}

function switchMasterMode(mode) {
    masterMode = mode;
    
    // Set default selections when switching modes
    if (mode === 'hiragana') {
        selectedKanas = ['あ', 'い', 'う', 'え', 'お'];
    } else if (mode === 'katakana') {
        selectedKanas = ['ア', 'イ', 'ウ', 'エ', 'オ'];
    } else {
        selectedKanas = ['あ', 'い', 'う', 'え', 'お', 'ア', 'イ', 'ウ', 'エ', 'オ'];
    }

    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    renderGrid();
    nextQuestion();
}

function toggleKana(char) {
    if (selectedKanas.includes(char)) {
        if (selectedKanas.length > 1) selectedKanas = selectedKanas.filter(k => k !== char);
    } else { selectedKanas.push(char); }
    renderGrid();
}

function toggleRow(row) {
    const rowChars = row.items.map(i => i.char);
    const allSelected = rowChars.every(c => selectedKanas.includes(c));
    if (allSelected) {
        if (selectedKanas.length > rowChars.length) selectedKanas = selectedKanas.filter(c => !rowChars.includes(c));
    } else {
        rowChars.forEach(c => { if (!selectedKanas.includes(c)) selectedKanas.push(c); });
    }
    renderGrid();
}

function nextQuestion() {
    let allItems = [];
    if (masterMode === 'both') {
        allItems = [...Object.values(kanaSets['hiragana']).flat(), ...Object.values(kanaSets['katakana']).flat()].flatMap(r => r.items);
    } else {
        allItems = Object.values(kanaSets[masterMode]).flat().flatMap(r => r.items);
    }

    const pool = allItems.filter(k => selectedKanas.includes(k.char));
    let nextIndex;
    do { 
        nextIndex = Math.floor(Math.random() * pool.length); 
    } while (pool.length > 1 && pool[nextIndex].char === currentKana.char);
    
    currentKana = pool[nextIndex];
    display.textContent = currentKana.char;
    display.setAttribute('data-romaji', currentKana.romaji);
    input.value = '';
}

document.querySelectorAll('.mode-btn').forEach(btn => btn.onclick = () => switchMasterMode(btn.dataset.mode));

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSubTab = btn.dataset.tab;
        renderGrid();
    };
});

toggleBtn.onclick = () => { 
    const isOpen = prefsSection.classList.toggle('open'); 
    toggleBtn.textContent = isOpen ? 'Preferences ▴' : 'Preferences ▾';
    if (isOpen) renderGrid(); 
};

document.getElementById('select-all').onclick = () => {
    let activeRows = [];
    if (masterMode === 'both') {
        activeRows = [...kanaSets['hiragana'][currentSubTab], ...kanaSets['katakana'][currentSubTab]];
    } else {
        activeRows = kanaSets[masterMode][currentSubTab];
    }

    activeRows.flatMap(r => r.items).forEach(i => {
        if (!selectedKanas.includes(i.char)) selectedKanas.push(i.char);
    });
    renderGrid();
};

document.getElementById('clear-all').onclick = () => {
    let activeRows = [];
    if (masterMode === 'both') {
        activeRows = [...kanaSets['hiragana'][currentSubTab], ...kanaSets['katakana'][currentSubTab]];
    } else {
        activeRows = kanaSets[masterMode][currentSubTab];
    }

    const activeChars = activeRows.flatMap(r => r.items).map(i => i.char);
    selectedKanas = selectedKanas.filter(c => !activeChars.includes(c));
    
    if (selectedKanas.length === 0) {
        selectedKanas = [masterMode === 'katakana' ? 'ア' : 'あ'];
    }
    renderGrid();
};

input.addEventListener('input', (e) => { 
    if (e.target.value.toLowerCase().trim() === currentKana.romaji) nextQuestion(); 
});

window.onload = () => switchMasterMode('hiragana');