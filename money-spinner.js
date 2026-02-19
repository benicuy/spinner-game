// Data game
let stats = {
    totalSpin: 0,
    totalWin: 0,
    totalPrize: 0,
    jackpotCount: 0
};

// Hadiah dan probabilitas
const prizes = [
    { amount: 2000, probability: 70, name: 'Rp 2.000' },
    { amount: 3000, probability: 20, name: 'Rp 3.000' },
    { amount: 20000, probability: 5, name: 'Rp 20.000' },
    { amount: 100000, probability: 3, name: 'Rp 100.000' },
    { amount: 2000000, probability: 2, name: 'Rp 2.000.000' }
];

let isSpinning = false;

// Inisialisasi game
function initGame() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    updateSaldo();
    loadStats();
    
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
        const gameStats = JSON.parse(localStorage.getItem(`stats_${user.id}_spinner`)) || {
            totalSpin: 0,
            totalWin: 0,
            totalPrize: 0,
            jackpotCount: 0
        };
        stats = gameStats;
        updateStatsDisplay();
    }
}

// Save stats
function saveStats() {
    const user = getCurrentUser();
    if (user) {
        localStorage.setItem(`stats_${user.id}_spinner`, JSON.stringify(stats));
    }
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('totalSpin').textContent = stats.totalSpin;
    document.getElementById('totalWin').textContent = stats.totalWin;
    document.getElementById('totalPrize').textContent = `Rp ${formatRupiah(stats.totalPrize)}`;
    document.getElementById('jackpotCount').textContent = stats.jackpotCount;
}

// Spin wheel
function spinWheel() {
    if (isSpinning) return;
    
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const spinCost = 1000;
    
    if (user.saldo < spinCost) {
        showNotification('Saldo tidak mencukupi!', 'error');
        return;
    }
    
    // Kurangi saldo
    user.saldo -= spinCost;
    updateUser(user);
    updateSaldo();
    
    // Update stats
    stats.totalSpin++;
    saveStats();
    updateStatsDisplay();
    
    // Spin animation
    isSpinning = true;
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('resultMessage').style.display = 'none';
    
    const wheel = document.getElementById('wheel');
    wheel.classList.add('spinning');
    
    // Random prize based on probability
    setTimeout(() => {
        wheel.classList.remove('spinning');
        
        const prize = getRandomPrize();
        let winAmount = prize.amount;
        
        // Bonus VIP
        if (user.vip) {
            if (user.vip.level === 1) winAmount = Math.floor(winAmount * 1.05); // +5%
            if (user.vip.level === 2) winAmount = Math.floor(winAmount * 1.1);  // +10%
            if (user.vip.level === 3) winAmount = Math.floor(winAmount * 1.2);  // +20%
        }
        
        // Tambah saldo
        user.saldo += winAmount;
        updateUser(user);
        updateSaldo();
        
        // Update stats
        stats.totalWin++;
        stats.totalPrize += winAmount;
        if (prize.amount === 2000000) stats.jackpotCount++;
        saveStats();
        updateStatsDisplay();
        
        // Highlight prize
        const prizeElements = document.querySelectorAll('.prize-item');
        prizeElements.forEach((el, index) => {
            el.classList.remove('win-rare');
            if (prizes[index].amount === prize.amount) {
                el.classList.add('win-rare');
            }
        });
        
        // Show result
        document.getElementById('resultMessage').textContent = `🎉 SELAMAT! Anda mendapatkan ${prize.name}! 🎉`;
        document.getElementById('resultMessage').className = 'result-message win';
        document.getElementById('resultMessage').style.display = 'block';
        
        isSpinning = false;
        document.getElementById('spinBtn').disabled = false;
    }, 3000);
}

// Get random prize based on probability
function getRandomPrize() {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const prize of prizes) {
        cumulative += prize.probability;
        if (random < cumulative) {
            return prize;
        }
    }
    
    return prizes[0]; // Default
}

// Inisialisasi
window.onload = function() {
    initGame();
};
