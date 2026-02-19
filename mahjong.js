// Data game
let tiles = [];
let selectedTile = null;
let gameActive = false;
let stats = {
    win: 0,
    lose: 0,
    totalPrize: 0
};

// Inisialisasi game
function initGame() {
    updateSaldo();
    loadStats();
    createBoard();
}

// Update saldo
function updateSaldo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('saldo').textContent = formatRupiah(user.saldo);
        
        // Update VIP badge
        const vipBadge = document.getElementById('vipBadge');
        if (user.vip) {
            vipBadge.style.display = 'inline';
            vipBadge.className = `game-vip-badge vip-badge vip${user.vip.level}`;
            vipBadge.textContent = `VIP ${user.vip.level}`;
        } else {
            vipBadge.style.display = 'none';
        }
    } else {
        window.location.href = 'index.html';
    }
}

// Load stats dari localStorage
function loadStats() {
    const user = getCurrentUser();
    if (user) {
        const gameStats = JSON.parse(localStorage.getItem(`stats_${user.id}_mahjong`)) || {
            win: 0,
            lose: 0,
            totalPrize: 0
        };
        stats = gameStats;
        updateStatsDisplay();
    }
}

// Save stats ke localStorage
function saveStats() {
    const user = getCurrentUser();
    if (user) {
        localStorage.setItem(`stats_${user.id}_mahjong`, JSON.stringify(stats));
    }
}

// Update tampilan stats
function updateStatsDisplay() {
    document.getElementById('winCount').textContent = stats.win;
    document.getElementById('loseCount').textContent = stats.lose;
    document.getElementById('totalPrize').textContent = `Rp ${formatRupiah(stats.totalPrize)}`;
    
    const totalGames = stats.win + stats.lose;
    const winRate = totalGames > 0 ? Math.round((stats.win / totalGames) * 100) : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
}

// Buat board
function createBoard() {
    const board = document.getElementById('mahjongBoard');
    const uangKertas = ['1000', '2000', '5000', '10000', '20000', '50000', '100000'];
    
    // Buat 8 pasang (16 kartu)
    tiles = [];
    for (let i = 0; i < 8; i++) {
        const nilai = uangKertas[Math.floor(Math.random() * uangKertas.length)];
        tiles.push({ nilai, matched: false, id: i * 2 });
        tiles.push({ nilai, matched: false, id: i * 2 + 1 });
    }
    
    // Acak urutan
    tiles = shuffleArray(tiles);
    
    // Render board
    renderBoard();
}

// Acak array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Render board
function renderBoard() {
    const board = document.getElementById('mahjongBoard');
    board.innerHTML = '';
    
    tiles.forEach((tile, index) => {
        const tileDiv = document.createElement('div');
        tileDiv.className = `mahjong-tile ${tile.matched ? 'matched' : ''}`;
        if (selectedTile === index && !tile.matched) {
            tileDiv.classList.add('selected');
        }
        if (!tile.matched) {
            tileDiv.textContent = '?';
            tileDiv.onclick = () => selectTile(index);
        } else {
            tileDiv.textContent = '✓';
        }
        board.appendChild(tileDiv);
    });
}

// Pilih kartu
function selectTile(index) {
    if (!gameActive) {
        showNotification('Mulai game terlebih dahulu!', 'warning');
        return;
    }
    
    if (tiles[index].matched) return;
    
    if (selectedTile === null) {
        selectedTile = index;
        renderBoard();
        showTile(index);
    } else if (selectedTile === index) {
        selectedTile = null;
        renderBoard();
    } else {
        // Cek pasangan
        checkMatch(selectedTile, index);
    }
}

// Tampilkan kartu
function showTile(index) {
    const tile = tiles[index];
    const tileElement = document.querySelectorAll('.mahjong-tile')[index];
    tileElement.textContent = `Rp ${tile.nilai}`;
}

// Cek pasangan
function checkMatch(index1, index2) {
    const tile1 = tiles[index1];
    const tile2 = tiles[index2];
    
    // Tampilkan kedua kartu
    const tileElement1 = document.querySelectorAll('.mahjong-tile')[index1];
    const tileElement2 = document.querySelectorAll('.mahjong-tile')[index2];
    tileElement1.textContent = `Rp ${tile1.nilai}`;
    tileElement2.textContent = `Rp ${tile2.nilai}`;
    
    if (tile1.nilai === tile2.nilai) {
        // Match
        setTimeout(() => {
            tile1.matched = true;
            tile2.matched = true;
            selectedTile = null;
            renderBoard();
            
            // Cek apakah semua sudah match
            if (tiles.every(t => t.matched)) {
                gameWin();
            }
        }, 500);
    } else {
        // Tidak match
        setTimeout(() => {
            selectedTile = null;
            renderBoard();
        }, 500);
    }
}

// Mulai game
function spinMahjong() {
    const betAmount = parseInt(document.getElementById('betAmount').value);
    const user = getCurrentUser();
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    if (betAmount < 1000 || betAmount > 100000) {
        showNotification('Taruhan minimal Rp 1.000 dan maksimal Rp 100.000', 'error');
        return;
    }
    
    if (user.saldo < betAmount) {
        showNotification('Saldo tidak mencukupi!', 'error');
        return;
    }
    
    // Kurangi saldo
    user.saldo -= betAmount;
    updateUser(user);
    updateSaldo();
    
    // Reset game
    gameActive = true;
    selectedTile = null;
    createBoard();
    document.getElementById('resultMessage').style.display = 'none';
    document.getElementById('spinBtn').disabled = true;
}

// Game menang
function gameWin() {
    const betAmount = parseInt(document.getElementById('betAmount').value);
    const winAmount = betAmount * 2; // Menang 2x lipat
    
    const user = getCurrentUser();
    user.saldo += winAmount;
    updateUser(user);
    updateSaldo();
    
    // Update stats
    stats.win++;
    stats.totalPrize += winAmount;
    saveStats();
    updateStatsDisplay();
    
    document.getElementById('resultMessage').textContent = `🎉 SELAMAT! Anda menang Rp ${formatRupiah(winAmount)}! 🎉`;
    document.getElementById('resultMessage').className = 'result-message win';
    document.getElementById('resultMessage').style.display = 'block';
    
    gameActive = false;
    document.getElementById('spinBtn').disabled = false;
}

// Reset game
function resetGame() {
    gameActive = false;
    selectedTile = null;
    createBoard();
    document.getElementById('resultMessage').style.display = 'none';
    document.getElementById('spinBtn').disabled = false;
}

// Inisialisasi saat halaman dimuat
window.onload = function() {
    // Cek login
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    initGame();
};
