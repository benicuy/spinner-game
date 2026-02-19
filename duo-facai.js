// Data game
let stats = {
    win: 0,
    lose: 0,
    totalPrize: 0
};

// Nilai kartu
const cardValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Inisialisasi game
function initGame() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    updateSaldo();
    loadStats();
    
    // Cek akses VIP
    if (!canAccessGame('duo-facai')) {
        document.getElementById('vipWarning').style.display = 'block';
        document.getElementById('gameContent').style.display = 'none';
    } else {
        document.getElementById('vipWarning').style.display = 'none';
        document.getElementById('gameContent').style.display = 'block';
    }
    
    // Update VIP badge
    const vipBadge = document.getElementById('vipBadge');
    if (user.vip) {
        vipBadge.style.display = 'inline';
        vipBadge.className = `game-vip-badge vip-badge vip${user.vip.level}`;
        vipBadge.textContent = `VIP ${user.vip.level}`;
    } else {
        vipBadge.style.display = 'none';
    }
}

// Update saldo
function updateSaldo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('saldo').textContent = formatRupiah(user.saldo);
    }
}

// Load stats
function loadStats() {
    const user = getCurrentUser();
    if (user) {
        const gameStats = JSON.parse(localStorage.getItem(`stats_${user.id}_duo`)) || {
            win: 0,
            lose: 0,
            totalPrize: 0
        };
        stats = gameStats;
        updateStatsDisplay();
    }
}

// Save stats
function saveStats() {
    const user = getCurrentUser();
    if (user) {
        localStorage.setItem(`stats_${user.id}_duo`, JSON.stringify(stats));
    }
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('winCount').textContent = stats.win;
    document.getElementById('loseCount').textContent = stats.lose;
    document.getElementById('totalPrize').textContent = `Rp ${formatRupiah(stats.totalPrize)}`;
    
    const totalGames = stats.win + stats.lose;
    const winRate = totalGames > 0 ? Math.round((stats.win / totalGames) * 100) : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
}

// Main game
function playDuoFacai() {
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
    
    document.getElementById('playBtn').disabled = true;
    document.getElementById('resultMessage').style.display = 'none';
    
    // Reset kartu
    document.getElementById('playerCard').textContent = '?';
    document.getElementById('opponentCard').textContent = '?';
    document.getElementById('player1').classList.remove('winner');
    document.getElementById('player2').classList.remove('winner');
    
    // Animasi
    setTimeout(() => {
        let playerCard, opponentCard;
        
        if (user.vip && user.vip.level >= 2) {
            // VIP 2 selalu menang (100%)
            playerCard = 10;
            opponentCard = Math.floor(Math.random() * 5) + 1; // 1-5
        } else {
            // Random normal
            playerCard = cardValues[Math.floor(Math.random() * cardValues.length)];
            opponentCard = cardValues[Math.floor(Math.random() * cardValues.length)];
        }
        
        document.getElementById('playerCard').textContent = playerCard;
        document.getElementById('opponentCard').textContent = opponentCard;
        
        // Animasi highlight
        document.getElementById('playerCard').classList.add('highlight');
        document.getElementById('opponentCard').classList.add('highlight');
        
        setTimeout(() => {
            document.getElementById('playerCard').classList.remove('highlight');
            document.getElementById('opponentCard').classList.remove('highlight');
        }, 500);
        
        // Tentukan pemenang
        let winAmount = 0;
        
        if (playerCard > opponentCard) {
            // Menang
            winAmount = betAmount * 2;
            user.saldo += winAmount;
            updateUser(user);
            updateSaldo();
            
            document.getElementById('player1').classList.add('winner');
            stats.win++;
            stats.totalPrize += winAmount;
            
            document.getElementById('resultMessage').textContent = `🎉 SELAMAT! Anda menang Rp ${formatRupiah(winAmount)}! 🎉`;
            document.getElementById('resultMessage').className = 'result-message win';
        } else if (playerCard < opponentCard) {
            // Kalah
            document.getElementById('player2').classList.add('winner');
            stats.lose++;
            
            document.getElementById('resultMessage').textContent = `😢 Coba lagi!`;
            document.getElementById('resultMessage').className = 'result-message lose';
        } else {
            // Seri
            user.saldo += betAmount; // Kembalikan taruhan
            updateUser(user);
            updateSaldo();
            
            document.getElementById('resultMessage').textContent = `🤝 Seri! Taruhan dikembalikan.`;
            document.getElementById('resultMessage').className = 'result-message';
        }
        
        saveStats();
        updateStatsDisplay();
        document.getElementById('resultMessage').style.display = 'block';
        document.getElementById('playBtn').disabled = false;
    }, 1000);
}

// Inisialisasi
window.onload = function() {
    initGame();
};
