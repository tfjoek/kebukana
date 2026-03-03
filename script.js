let masterMode = 'hiragana';
let currentSubTab = 'main';
let currentKana = {};

// Single source of truth for each kana type
let selections = {
    hiragana: ['あ', 'い', 'う', 'え', 'お'],
    katakana: ['ア', 'イ', 'ウ', 'エ', 'オ']
};

const display = document.getElementById('kana-display');
const input = document.getElementById('answer-input');
const grid = document.getElementById('kana-selection-grid');
const prefsSection = document.getElementById('prefs-content');
const toggleBtn = document.getElementById('toggle-prefs');

function saveSettings() {
    const settings = {
        mode: masterMode,
        tab: currentSubTab,
        selections: selections
    };
    localStorage.setItem('kebukana_prefs', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('kebukana_prefs');
    if (saved) {
        const parsed = JSON.parse(saved);
        masterMode = parsed.mode || 'hiragana';
        currentSubTab = parsed.tab || 'main';
        selections = parsed.selections || selections;
    }
}

// Helper to get the correct list based on the character type
function getListForChar(char) {
    // Check if it's Katakana (range check)
    return (char.charCodeAt(0) >= 12449 && char.charCodeAt(0) <= 12538) ? 'katakana' : 'hiragana';
}

function renderGrid() {
    grid.innerHTML = '';
    let activeRows = (masterMode === 'both') 
        ? [...kanaSets['hiragana'][currentSubTab], ...kanaSets['katakana'][currentSubTab]] 
        : kanaSets[masterMode][currentSubTab];

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
            
            // Link: Check the specific list for that character type
            const listKey = getListForChar(item.char);
            if (selections[listKey].includes(item.char)) tile.classList.add('active');
            
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
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    saveSettings();
    renderGrid();
    nextQuestion();
}

function toggleKana(char) {
    const listKey = getListForChar(char);
    let currentList = selections[listKey];
    
    if (currentList.includes(char)) {
        // Prevent clearing everything
        const totalSelected = selections.hiragana.length + selections.katakana.length;
        if (totalSelected > 1) {
            selections[listKey] = currentList.filter(k => k !== char);
        }
    } else {
        selections[listKey].push(char);
    }
    saveSettings();
    renderGrid();
}

function toggleRow(row) {
    const listKey = getListForChar(row.items[0].char);
    const rowChars = row.items.map(i => i.char);
    let currentList = selections[listKey];
    const allSelected = rowChars.every(c => currentList.includes(c));
    
    if (allSelected) {
        const totalSelected = selections.hiragana.length + selections.katakana.length;
        if (totalSelected > rowChars.length) {
            selections[listKey] = currentList.filter(c => !rowChars.includes(c));
        }
    } else {
        rowChars.forEach(c => {
            if (!selections[listKey].includes(c)) selections[listKey].push(c);
        });
    }
    saveSettings();
    renderGrid();
}

function nextQuestion() {
    let pool = [];
    
    if (masterMode === 'both' || masterMode === 'hiragana') {
        const hiraItems = Object.values(kanaSets['hiragana']).flat().flatMap(r => r.items);
        pool.push(...hiraItems.filter(k => selections.hiragana.includes(k.char)));
    }
    
    if (masterMode === 'both' || masterMode === 'katakana') {
        const kataItems = Object.values(kanaSets['katakana']).flat().flatMap(r => r.items);
        pool.push(...kataItems.filter(k => selections.katakana.includes(k.char)));
    }

    let nextIndex;
    do { 
        nextIndex = Math.floor(Math.random() * pool.length); 
    } while (pool.length > 1 && pool[nextIndex].char === currentKana.char);
    
    currentKana = pool[nextIndex];
    display.textContent = currentKana.char;
    display.setAttribute('data-romaji', currentKana.romaji);
    input.value = '';
}

// ... rest of the button listeners (Select All, Clear All, etc.) stay the same ...
// Note: Ensure the Clear All / Select All also use the getListForChar logic.

document.querySelectorAll('.mode-btn').forEach(btn => btn.onclick = () => switchMasterMode(btn.dataset.mode));
document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSubTab = btn.dataset.tab;
    saveSettings();
    renderGrid();
});

toggleBtn.onclick = () => { 
    const isOpen = prefsSection.classList.toggle('open'); 
    toggleBtn.textContent = isOpen ? 'Preferences ▴' : 'Preferences ▾';
    if (isOpen) renderGrid(); 
};

document.getElementById('select-all').onclick = () => {
    if (masterMode === 'both' || masterMode === 'hiragana') {
        kanaSets['hiragana'][currentSubTab].flatMap(r => r.items).forEach(i => {
            if (!selections.hiragana.includes(i.char)) selections.hiragana.push(i.char);
        });
    }
    if (masterMode === 'both' || masterMode === 'katakana') {
        kanaSets['katakana'][currentSubTab].flatMap(r => r.items).forEach(i => {
            if (!selections.katakana.includes(i.char)) selections.katakana.push(i.char);
        });
    }
    saveSettings();
    renderGrid();
};

document.getElementById('clear-all').onclick = () => {
    if (masterMode === 'both' || masterMode === 'hiragana') {
        const chars = kanaSets['hiragana'][currentSubTab].flatMap(r => r.items).map(i => i.char);
        selections.hiragana = selections.hiragana.filter(c => !chars.includes(c));
    }
    if (masterMode === 'both' || masterMode === 'katakana') {
        const chars = kanaSets['katakana'][currentSubTab].flatMap(r => r.items).map(i => i.char);
        selections.katakana = selections.katakana.filter(c => !chars.includes(c));
    }
    // Fallback if empty
    if (selections.hiragana.length === 0 && selections.katakana.length === 0) {
        selections.hiragana = ['あ'];
    }
    saveSettings();
    renderGrid();
};

input.addEventListener('input', (e) => { 
    if (e.target.value.toLowerCase().trim() === currentKana.romaji) nextQuestion(); 
});

window.onload = () => {
    loadSettings();
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === masterMode));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === currentSubTab));
    renderGrid();
    nextQuestion();
};