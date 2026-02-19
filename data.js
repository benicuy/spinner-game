// ========== DATA GLOBAL ==========

// Inisialisasi data di localStorage
function initData() {
    if (!localStorage.getItem('users')) {
        const adminUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            fullname: 'Administrator',
            saldo: 10000000,
            role: 'admin',
            vip: null,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify([adminUser]));
    }

    if (!localStorage.getItem('topupRequests')) {
        localStorage.setItem('topupRequests', JSON.stringify([]));
    }

    if (!localStorage.getItem('withdrawRequests')) {
        localStorage.setItem('withdrawRequests', JSON.stringify([]));
    }

    if (!localStorage.getItem('vipRequests')) {
        localStorage.setItem('vipRequests', JSON.stringify([]));
    }
}

// Fungsi notifikasi
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Fungsi get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Fungsi update user di localStorage
function updateUser(updatedUser) {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Fungsi format rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

// Fungsi get withdraw limit berdasarkan level VIP
function getWithdrawLimit(level) {
    switch(level) {
        case 1: return 20000; // per minggu
        case 2: return 50000; // per minggu
        case 3: return 350000; // per 3 hari
        default: return 0;
    }
}

// Fungsi get withdraw period dalam hari
function getWithdrawPeriod(level) {
    switch(level) {
        case 1: return 7;
        case 2: return 7;
        case 3: return 3;
        default: return 0;
    }
}

// Fungsi cek akses game
function canAccessGame(gameName) {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Game gratis
    if (gameName === 'mahjong' || gameName === 'money-spinner') {
        return true;
    }
    
    // Game VIP 2 required
    if (gameName === 'zeus' || gameName === 'duo-facai') {
        return user.vip && user.vip.level >= 2;
    }
    
    return false;
}

// Fungsi cek saldo cukup
function hasEnoughBalance(amount) {
    const user = getCurrentUser();
    return user && user.saldo >= amount;
}

// Fungsi kurangi saldo
function deductBalance(amount) {
    const user = getCurrentUser();
    if (user && user.saldo >= amount) {
        user.saldo -= amount;
        updateUser(user);
        return true;
    }
    return false;
}

// Fungsi tambah saldo
function addBalance(amount) {
    const user = getCurrentUser();
    if (user) {
        user.saldo += amount;
        updateUser(user);
        return true;
    }
    return false;
}

// Fungsi cek withdraw limit
function canWithdraw(amount) {
    const user = getCurrentUser();
    if (!user || !user.vip) return amount <= 50000; // Non VIP max 50rb
    
    const limit = getWithdrawLimit(user.vip.level);
    const used = user.vip.usedWithdraw || 0;
    
    return (used + amount) <= limit;
}

// Fungsi update used withdraw
function updateUsedWithdraw(amount) {
    const user = getCurrentUser();
    if (user && user.vip) {
        user.vip.usedWithdraw = (user.vip.usedWithdraw || 0) + amount;
        updateUser(user);
    }
}

// Fungsi cek VIP expired
function checkVIPExpiry() {
    const user = getCurrentUser();
    if (!user || !user.vip) return false;
    
    const now = new Date();
    const expiry = new Date(user.vip.expiry);
    
    if (expiry <= now) {
        user.vip = null;
        updateUser(user);
        return true;
    }
    return false;
}

// Inisialisasi data saat file dimuat
initData();
