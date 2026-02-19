// ========== FUNGSI UTAMA ==========

// Toggle form
function showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

function showLogin() {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginForm').classList.add('active');
    showNotification('Berhasil logout', 'success');
}

// Join VIP
function joinVIP(level) {
    const user = getCurrentUser();
    if (!user) return;
    
    let harga = 0;
    switch(level) {
        case 1: harga = 30000; break;
        case 2: harga = 200000; break;
        case 3: harga = 3000000; break;
    }
    
    if (user.saldo < harga) {
        showNotification('Saldo tidak mencukupi!', 'error');
        return;
    }
    
    // Kurangi saldo
    user.saldo -= harga;
    
    // Set VIP
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1); // 1 bulan
    
    user.vip = {
        level: level,
        expiry: expiry.toISOString(),
        usedWithdraw: 0,
        lastWithdrawReset: new Date().toISOString()
    };
    
    updateUser(user);
    
    // Catat transaksi VIP
    let vipRequests = JSON.parse(localStorage.getItem('vipRequests')) || [];
    vipRequests.push({
        id: Date.now(),
        userId: user.id,
        username: user.username,
        level: level,
        harga: harga,
        status: 'approved',
        tanggal: new Date().toISOString()
    });
    localStorage.setItem('vipRequests', JSON.stringify(vipRequests));
    
    showNotification(`Berhasil join VIP ${level}!`, 'success');
    updateVIPDisplay();
    updateGameAccess();
    loadRiwayat();
}

// Update tampilan VIP
function updateVIPDisplay() {
    const user = getCurrentUser();
    if (!user) return;

    const vipBadge = document.getElementById('vipBadge');
    const vipStatus = document.getElementById('vipStatus');
    const vipLevel = document.getElementById('currentVipLevel');
    const vipExpiry = document.getElementById('vipExpiry');
    const remainingWithdraw = document.getElementById('remainingWithdraw');
    
    if (user.vip) {
        const now = new Date();
        const expiry = new Date(user.vip.expiry);
        
        if (expiry > now) {
            // VIP masih aktif
            vipBadge.style.display = 'inline';
            vipBadge.className = `vip-badge vip${user.vip.level}`;
            vipBadge.textContent = `VIP ${user.vip.level}`;
            
            vipStatus.style.display = 'flex';
            vipLevel.textContent = `VIP ${user.vip.level}`;
            vipExpiry.textContent = expiry.toLocaleDateString('id-ID');
            
            // Hitung sisa withdraw
            const withdrawLimit = getWithdrawLimit(user.vip.level);
            const usedWithdraw = user.vip.usedWithdraw || 0;
            const remaining = withdrawLimit - usedWithdraw;
            remainingWithdraw.textContent = `Rp ${formatRupiah(remaining)}`;
            
            // Update tombol VIP
            document.getElementById('btnVIP1').disabled = true;
            document.getElementById('btnVIP2').disabled = true;
            document.getElementById('btnVIP3').disabled = true;
            
            // Update withdraw limit info
            updateWithdrawLimitInfo();
            
            // Start withdraw timer
            startWithdrawTimer(user);
        } else {
            // VIP expired
            user.vip = null;
            updateUser(user);
            resetVIPDisplay();
        }
    } else {
        resetVIPDisplay();
    }
}

function resetVIPDisplay() {
    document.getElementById('vipBadge').style.display = 'none';
    document.getElementById('vipStatus').style.display = 'none';
    document.getElementById('btnVIP1').disabled = false;
    document.getElementById('btnVIP2').disabled = false;
    document.getElementById('btnVIP3').disabled = false;
    updateGameAccess();
    updateWithdrawLimitInfo();
}

function updateWithdrawLimitInfo() {
    const user = getCurrentUser();
    const limitInfo = document.getElementById('withdrawLimitInfo');
    
    if (!user) return;
    
    if (user.vip) {
        const limit = getWithdrawLimit(user.vip.level);
        const used = user.vip.usedWithdraw || 0;
        const remaining = limit - used;
        const period = getWithdrawPeriod(user.vip.level);
        
        limitInfo.innerHTML = `
            <h4>Limit Withdraw VIP ${user.vip.level}</h4>
            <div class="limit-amount">Rp ${formatRupiah(remaining)} / Rp ${formatRupiah(limit)}</div>
            <div class="limit-note">Periode: ${period} hari</div>
        `;
    } else {
        limitInfo.innerHTML = `
            <h4>Limit Withdraw Non VIP</h4>
            <div class="limit-amount">Rp 50.000 / hari</div>
            <div class="limit-note">Upgrade ke VIP untuk limit lebih besar</div>
        `;
    }
}

function startWithdrawTimer(user) {
    if (!user.vip) return;
    
    const updateTimer = () => {
        const now = new Date();
        const lastWithdraw = user.vip.lastWithdrawReset ? new Date(user.vip.lastWithdrawReset) : new Date();
        const period = getWithdrawPeriod(user.vip.level) * 24 * 60 * 60 * 1000;
        const nextReset = new Date(lastWithdraw.getTime() + period);
        
        if (nextReset > now) {
            const diff = nextReset - now;
            const days = Math.floor(diff / (24 * 60 * 60 * 1000));
            const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
            
            document.getElementById('withdrawTimer').textContent = 
                `Reset dalam: ${days}h ${hours}j ${minutes}m`;
        } else {
            // Reset withdraw limit
            user.vip.usedWithdraw = 0;
            user.vip.lastWithdrawReset = new Date().toISOString();
            updateUser(user);
            updateVIPDisplay();
        }
    };
    
    updateTimer();
    setInterval(updateTimer, 60000); // Update setiap menit
}

// Update akses game
function updateGameAccess() {
    const user = getCurrentUser();
    const zeusGame = document.getElementById('gameZeus');
    const duoGame = document.getElementById('gameDuo');
    
    if (user && user.vip && user.vip.level >= 2) {
        zeusGame.classList.remove('locked');
        duoGame.classList.remove('locked');
    } else {
        zeusGame.classList.add('locked');
        duoGame.classList.add('locked');
    }
}

// Load riwayat transaksi
function loadRiwayat() {
    const user = getCurrentUser();
    if (!user) return;
    
    const topupRequests = JSON.parse(localStorage.getItem('topupRequests')) || [];
    const withdrawRequests = JSON.parse(localStorage.getItem('withdrawRequests')) || [];
    const vipRequests = JSON.parse(localStorage.getItem('vipRequests')) || [];
    
    let userTopup, userWithdraw, userVIP;
    
    if (user.role === 'admin') {
        userTopup = topupRequests;
        userWithdraw = withdrawRequests;
        userVIP = vipRequests;
    } else {
        userTopup = topupRequests.filter(r => r.userId === user.id);
        userWithdraw = withdrawRequests.filter(r => r.userId === user.id);
        userVIP = vipRequests.filter(r => r.userId === user.id);
    }
    
    const allTransaksi = [...userTopup, ...userWithdraw, ...userVIP].sort((a, b) => 
        new Date(b.tanggal) - new Date(a.tanggal)
    );
    
    const riwayatDiv = document.getElementById('riwayatTransaksi');
    
    if (allTransaksi.length === 0) {
        riwayatDiv.innerHTML = '<p class="empty">Belum ada transaksi</p>';
        return;
    }
    
    riwayatDiv.innerHTML = allTransaksi.map(t => {
        let jenis = '';
        let itemClass = '';
        
        if (t.bank) {
            jenis = 'Withdraw';
            itemClass = 'withdraw';
        } else if (t.level) {
            jenis = `VIP ${t.level}`;
            itemClass = 'vip';
        } else {
            jenis = 'Top Up';
            itemClass = 'topup';
        }
        
        const statusClass = t.status === 'pending' ? 'status-pending' : 
                           t.status === 'approved' ? 'status-approved' : 'status-rejected';
        
        return `
            <div class="riwayat-item ${itemClass}">
                <div class="riwayat-header">
                    <span class="riwayat-jenis">${jenis}</span>
                    <span class="riwayat-status ${statusClass}">${t.status}</span>
                </div>
                <div class="riwayat-detail">
                    <span>Rp ${formatRupiah(t.jumlah || t.harga)}</span>
                    <span>${new Date(t.tanggal).toLocaleDateString('id-ID')}</span>
                </div>
                ${t.bank ? `<div class="riwayat-bank">${t.bank} - ${t.nomor}</div>` : ''}
                ${t.level ? `<div class="riwayat-bank">VIP Level ${t.level}</div>` : ''}
                ${user.role === 'admin' ? `<div class="riwayat-bank">User: ${t.fullname || t.username}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Load pending requests untuk admin
function loadPendingRequests() {
    const topupRequests = JSON.parse(localStorage.getItem('topupRequests')) || [];
    const withdrawRequests = JSON.parse(localStorage.getItem('withdrawRequests')) || [];
    const vipRequests = JSON.parse(localStorage.getItem('vipRequests')) || [];
    
    const pendingTopups = topupRequests.filter(r => r.status === 'pending');
    const pendingWithdraws = withdrawRequests.filter(r => r.status === 'pending');
    const pendingVIP = vipRequests.filter(r => r.status === 'pending');
    
    const topupDiv = document.getElementById('pendingTopups');
    const withdrawDiv = document.getElementById('pendingWithdraws');
    const vipDiv = document.getElementById('pendingVIP');
    
    // Top Up Pending
    if (pendingTopups.length === 0) {
        topupDiv.innerHTML = '<p class="empty">Tidak ada top up pending</p>';
    } else {
        topupDiv.innerHTML = pendingTopups.map(t => `
            <div class="riwayat-item topup">
                <div class="riwayat-header">
                    <span class="riwayat-jenis">Top Up Rp ${formatRupiah(t.jumlah)}</span>
                    <span class="riwayat-status status-pending">pending</span>
                </div>
                <div class="riwayat-detail">
                    <span>User: ${t.fullname || t.username}</span>
                    <span>${new Date(t.tanggal).toLocaleDateString('id-ID')}</span>
                </div>
                <img src="${t.bukti}" style="max-width: 100%; margin: 10px 0; border-radius: 5px;">
                <div style="display: flex; gap: 10px;">
                    <button onclick="verifikasiTopup(${t.id}, 'approved')" class="btn-game" style="background: var(--success); color: white; flex: 1;">Setujui</button>
                    <button onclick="verifikasiTopup(${t.id}, 'rejected')" class="btn-game" style="background: var(--danger); color: white; flex: 1;">Tolak</button>
                </div>
            </div>
        `).join('');
    }
    
    // Withdraw Pending
    if (pendingWithdraws.length === 0) {
        withdrawDiv.innerHTML = '<p class="empty">Tidak ada withdraw pending</p>';
    } else {
        withdrawDiv.innerHTML = pendingWithdraws.map(w => `
            <div class="riwayat-item withdraw">
                <div class="riwayat-header">
                    <span class="riwayat-jenis">Withdraw Rp ${formatRupiah(w.jumlah)}</span>
                    <span class="riwayat-status status-pending">pending</span>
                </div>
                <div class="riwayat-detail">
                    <span>User: ${w.fullname || w.username}</span>
                    <span>${new Date(w.tanggal).toLocaleDateString('id-ID')}</span>
                </div>
                <div class="riwayat-bank">${w.bank} - ${w.nomor}</div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="verifikasiWithdraw(${w.id}, 'approved')" class="btn-game" style="background: var(--success); color: white; flex: 1;">Setujui</button>
                    <button onclick="verifikasiWithdraw(${w.id}, 'rejected')" class="btn-game" style="background: var(--danger); color: white; flex: 1;">Tolak</button>
                </div>
            </div>
        `).join('');
    }
    
    // VIP Pending
    if (pendingVIP.length === 0) {
        vipDiv.innerHTML = '<p class="empty">Tidak ada VIP pending</p>';
    } else {
        vipDiv.innerHTML = pendingVIP.map(v => `
            <div class="riwayat-item vip">
                <div class="riwayat-header">
                    <span class="riwayat-jenis">VIP ${v.level} - Rp ${formatRupiah(v.harga)}</span>
                    <span class="riwayat-status status-pending">pending</span>
                </div>
                <div class="riwayat-detail">
                    <span>User: ${v.fullname || v.username}</span>
                    <span>${new Date(v.tanggal).toLocaleDateString('id-ID')}</span>
                </div>
                <img src="${v.bukti}" style="max-width: 100%; margin: 10px 0; border-radius: 5px;">
                <div style="display: flex; gap: 10px;">
                    <button onclick="verifikasiVIP(${v.id}, 'approved')" class="btn-game" style="background: var(--success); color: white; flex: 1;">Setujui</button>
                    <button onclick="verifikasiVIP(${v.id}, 'rejected')" class="btn-game" style="background: var(--danger); color: white; flex: 1;">Tolak</button>
                </div>
            </div>
        `).join('');
    }
}

// Verifikasi Top Up (Admin)
window.verifikasiTopup = function(id, status) {
    let topupRequests = JSON.parse(localStorage.getItem('topupRequests')) || [];
    const requestIndex = topupRequests.findIndex(r => r.id === id);
    
    if (requestIndex !== -1) {
        const request = topupRequests[requestIndex];
        request.status = status;
        
        if (status === 'approved') {
            // Tambah saldo user
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === request.userId);
            
            if (userIndex !== -1) {
                users[userIndex].saldo += request.jumlah;
                
                // Update current user jika sedang login
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.id === request.userId) {
                    currentUser.saldo += request.jumlah;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    document.getElementById('saldo').textContent = formatRupiah(currentUser.saldo);
                }
                
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
        
        localStorage.setItem('topupRequests', JSON.stringify(topupRequests));
        showNotification(`Top up ${status === 'approved' ? 'disetujui' : 'ditolak'}`, 'success');
        loadPendingRequests();
        loadRiwayat();
    }
};

// Verifikasi Withdraw (Admin)
window.verifikasiWithdraw = function(id, status) {
    let withdrawRequests = JSON.parse(localStorage.getItem('withdrawRequests')) || [];
    const requestIndex = withdrawRequests.findIndex(r => r.id === id);
    
    if (requestIndex !== -1) {
        const request = withdrawRequests[requestIndex];
        request.status = status;
        
        if (status === 'rejected') {
            // Kembalikan saldo user jika ditolak
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === request.userId);
            
            if (userIndex !== -1) {
                users[userIndex].saldo += request.jumlah;
                
                // Update current user jika sedang login
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.id === request.userId) {
                    currentUser.saldo += request.jumlah;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    document.getElementById('saldo').textContent = formatRupiah(currentUser.saldo);
                }
                
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
        
        localStorage.setItem('withdrawRequests', JSON.stringify(withdrawRequests));
        showNotification(`Withdraw ${status === 'approved' ? 'disetujui' : 'ditolak'}`, 'success');
        loadPendingRequests();
        loadRiwayat();
    }
};

// Verifikasi VIP (Admin)
window.verifikasiVIP = function(id, status) {
    let vipRequests = JSON.parse(localStorage.getItem('vipRequests')) || [];
    const requestIndex = vipRequests.findIndex(r => r.id === id);
    
    if (requestIndex !== -1) {
        const request = vipRequests[requestIndex];
        request.status = status;
        
        if (status === 'approved') {
            // Update status VIP user
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === request.userId);
            
            if (userIndex !== -1) {
                const expiry = new Date();
                expiry.setMonth(expiry.getMonth() + 1);
                
                users[userIndex].vip = {
                    level: request.level,
                    expiry: expiry.toISOString(),
                    usedWithdraw: 0,
                    lastWithdrawReset: new Date().toISOString()
                };
                
                // Update current user jika sedang login
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.id === request.userId) {
                    currentUser.vip = users[userIndex].vip;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateVIPDisplay();
                }
                
                localStorage.setItem('users', JSON.stringify(users));
            }
        } else if (status === 'rejected') {
            // Kembalikan saldo jika ditolak
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === request.userId);
            
            if (userIndex !== -1) {
                users[userIndex].saldo += request.harga;
                
                // Update current user jika sedang login
                const currentUser = getCurrentUser();
                if (currentUser && currentUser.id === request.userId) {
                    currentUser.saldo += request.harga;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    document.getElementById('saldo').textContent = formatRupiah(currentUser.saldo);
                }
                
                localStorage.setItem('users', JSON.stringify(users));
            }
        }
        
        localStorage.setItem('vipRequests', JSON.stringify(vipRequests));
        showNotification(`VIP ${status === 'approved' ? 'disetujui' : 'ditolak'}`, 'success');
        loadPendingRequests();
        loadRiwayat();
    }
};

// ========== EVENT LISTENERS ==========

// Login
document.getElementById('login').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('userName').textContent = user.fullname || user.username;
        document.getElementById('saldo').textContent = formatRupiah(user.saldo);
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        if (user.role === 'admin') {
            document.getElementById('adminBadge').style.display = 'inline';
            document.getElementById('adminPanel').style.display = 'block';
            loadPendingRequests();
        }
        
        updateVIPDisplay();
        updateGameAccess();
        updateWithdrawLimitInfo();
        loadRiwayat();
        showNotification('Login berhasil!', 'success');
    } else {
        showNotification('Username atau password salah!', 'error');
    }
});

// Register
document.getElementById('register').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const fullname = document.getElementById('regFullname').value;
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.some(u => u.username === username)) {
        showNotification('Username sudah digunakan!', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        username,
        password,
        fullname,
        saldo: 0,
        role: 'user',
        vip: null,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showNotification('Registrasi berhasil! Silakan login.', 'success');
    showLogin();
});

// Top Up
document.getElementById('topupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const jumlah = parseInt(document.getElementById('jumlahTopup').value);
    const bukti = document.getElementById('buktiTransfer').files[0];
    
    if (!bukti) {
        showNotification('Pilih file bukti transfer!', 'error');
        return;
    }
    
    const user = getCurrentUser();
    
    let topupRequests = JSON.parse(localStorage.getItem('topupRequests')) || [];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const request = {
            id: Date.now(),
            userId: user.id,
            username: user.username,
            fullname: user.fullname,
            jumlah: jumlah,
            bukti: e.target.result,
            status: 'pending',
            tanggal: new Date().toISOString()
        };
        
        topupRequests.push(request);
        localStorage.setItem('topupRequests', JSON.stringify(topupRequests));
        
        showNotification('Bukti pembayaran terkirim! Menunggu verifikasi admin.', 'success');
        document.getElementById('topupForm').reset();
        loadRiwayat();
    };
    
    reader.readAsDataURL(bukti);
});

// Withdraw
document.getElementById('withdrawForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const jumlah = parseInt(document.getElementById('jumlahWithdraw').value);
    const bank = document.getElementById('bankTujuan').value;
    const nomor = document.getElementById('nomorRekening').value;
    
    const user = getCurrentUser();
    
    if (jumlah > user.saldo) {
        showNotification('Saldo tidak mencukupi!', 'error');
        return;
    }
    
    if (!canWithdraw(jumlah)) {
        showNotification('Melebihi limit withdraw!', 'error');
        return;
    }
    
    // Simpan request withdraw
    let withdrawRequests = JSON.parse(localStorage.getItem('withdrawRequests')) || [];
    
    const request = {
        id: Date.now(),
        userId: user.id,
        username: user.username,
        fullname: user.fullname,
        jumlah: jumlah,
        bank: bank,
        nomor: nomor,
        status: 'pending',
        tanggal: new Date().toISOString()
    };
    
    withdrawRequests.push(request);
    localStorage.setItem('withdrawRequests', JSON.stringify(withdrawRequests));
    
    // Kurangi saldo
    user.saldo -= jumlah;
    if (user.vip) {
        updateUsedWithdraw(jumlah);
    }
    updateUser(user);
    
    document.getElementById('saldo').textContent = formatRupiah(user.saldo);
    showNotification('Permintaan withdraw terkirim!', 'success');
    document.getElementById('withdrawForm').reset();
    updateVIPDisplay();
    loadRiwayat();
});

// Cek session login saat halaman dimuat
window.onload = function() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.fullname || user.username;
        document.getElementById('saldo').textContent = formatRupiah(user.saldo);
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        if (user.role === 'admin') {
            document.getElementById('adminBadge').style.display = 'inline';
            document.getElementById('adminPanel').style.display = 'block';
            loadPendingRequests();
        }
        
        updateVIPDisplay();
        updateGameAccess();
        updateWithdrawLimitInfo();
        loadRiwayat();
    }
};
