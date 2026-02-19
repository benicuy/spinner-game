// Data game
let stats = {
    win: 0,
    lose: 0,
    totalPrize: 0
};

// Simbol Zeus
const symbols = ['⚡', '👑', '🏛️', '🦅', '🌩️'];

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
    if (!canAccessGame('zeus')) {
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
        const gameStats = JSON.parse(localStorage.getItem(`stats_${user.id}_zeus`)) || {
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
        localStorage.setItem(`stats_${user.id}_zeus`, JSON.stringify(stats));
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

// Spin slot
function spinZeus() {
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
    
    // Animasi spin
    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    
    reel1.classList.add('spinning');
    reel2.classList.add('spinning');
    reel3.classList.add('spinning');
    
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('resultMessage').style.display = 'none';
    
    // Hasil spin (VIP 2 selalu menang)
    setTimeout(() => {
        reel1.classList.remove('spinning');
        reel2.classList.remove('spinning');
        reel3.classList.remove('spinning');
        
        let result1, result2, result3;
        
        if (user.vip && user.vip.level >= 2) {
            // VIP 2 selalu menang (100%)
            result1 = '⚡';
            result2 = '⚡';
            result3 = '⚡';
        } else {
            // Random normal
            result1 = symbols[Math.floor(Math.random() * symbols.length)];
            result2 = symbols[Math.floor(Math.random() * symbols.length)];
            result3 = symbols[Math.floor(Math.random() * symbols.length)];
        }
        
        reel1.textContent = result1;
        reel2.textContent = result2;
        reel3.textContent = result3;
        
        // Cek kemenangan
        if (result1 === '⚡' && result2 === '⚡' && result3 === '⚡') {
            // Jackpot 3 petir
            const winAmount = betAmount * 5;
            user.saldo += winAmount;
            updateUser(user);
            updateSaldo();
            
            stats.win++;
            stats.totalPrize += winAmount;
            saveStats();
            updateStatsDisplay();
            
            document.getElementById('resultMessage').textContent = `⚡ JACKPOT! Anda menang Rp ${formatRupiah(winAmount)}! ⚡`;
            document.getElementById('resultMessage').className = 'result-message win';
        } else if (result1 === result2 && result2 === result3) {
            // 3 simbol sama (bukan petir)
            const winAmount = betAmount * 3;
            user.saldo += winAmount;
            updateUser(user);
            updateSaldo();
            
            stats.win++;
            stats.totalPrize += winAmount;
            saveStats();
            updateStatsDisplay();
            
            document.getElementById('resultMessage').textContent = `🎉 SELAMAT! Anda menang Rp ${formatRupiah(winAmount)}! 🎉`;
            document.getElementById('resultMessage').className = 'result-message win';
        } else if (result1 === result2 || result2 === result3 || result1 === result3) {
            // 2 simbol sama
            const winAmount = betAmount * 1.5;
            user.saldo += winAmount;
            updateUser(user);
            updateSaldo();
            
            stats.win++;
            stats.totalPrize += winAmount;
            saveStats();
            updateStatsDisplay();
            
            document.getElementById('resultMessage').textContent = `👍 Anda menang Rp ${formatRupiah(winAmount)}!`;
            document.getElementById('resultMessage').className = 'result-message win';
        } else {
            // Kalah
            stats.lose++;
            saveStats();
            updateStatsDisplay();
            
            document.getElementById('resultMessage').textContent = `😢 Coba lagi!`;
            document.getElementById('resultMessage').className = 'result-message lose';
        }
        
        document.getElementById('resultMessage').style.display = 'block';
        document.getElementById('spinBtn').disabled = false;
    }, 1000);
}

// Inisialisasi
window.onload = function() {
    initGame();
};
