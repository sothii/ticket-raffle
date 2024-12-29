// Admin bilgileri (gerçek uygulamada backend'de saklanmalı)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Sayfalama için global değişkenler
let currentPage = 1;
const itemsPerPage = 10;

// Global değişkenler
let searchTimeout;
const searchDelay = 300; // milisaniye cinsinden arama gecikmesi

document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'flex';
        switchPage('dashboard');
    } else {
        alert('Hatalı kullanıcı adı veya şifre!');
    }
});

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Bekliyor';
        case 'approved': return 'Onaylandı';
        case 'rejected': return 'Reddedildi';
        default: return status;
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'pending': return 'status-pending';
        case 'approved': return 'status-approved';
        case 'rejected': return 'status-rejected';
        default: return '';
    }
}

function loadTicketRequests() {
    const requests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    const requestsDiv = document.getElementById('ticketRequests');
    const statusFilter = document.getElementById('statusFilter').value;
    const usernameSearch = document.getElementById('usernameSearch').value.toLowerCase();
    const ticketSearch = document.getElementById('ticketSearch').value.toLowerCase();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Filtreleme işlemi
    let filteredRequests = requests;
    
    // Durum filtresi
    if (statusFilter !== 'all') {
        filteredRequests = filteredRequests.filter(r => r.status === statusFilter);
    }
    
    // Kullanıcı adı araması
    if (usernameSearch) {
        filteredRequests = filteredRequests.filter(r => 
            r.username.toLowerCase().includes(usernameSearch)
        );
    }
    
    // Bilet numarası araması
    if (ticketSearch) {
        filteredRequests = filteredRequests.filter(r => 
            r.ticketNumber.toLowerCase().includes(ticketSearch)
        );
    }

    // Tarih filtresi
    if (startDate) {
        const startDateTime = new Date(startDate).getTime();
        filteredRequests = filteredRequests.filter(r => 
            new Date(r.date).getTime() >= startDateTime
        );
    }
    
    if (endDate) {
        const endDateTime = new Date(endDate).setHours(23, 59, 59, 999);
        filteredRequests = filteredRequests.filter(r => 
            new Date(r.date).getTime() <= endDateTime
        );
    }

    // Toplam sayfa sayısını hesapla
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    
    // Sayfa kontrolü
    if (currentPage > totalPages) {
        currentPage = totalPages || 1;
    }
    
    // Mevcut sayfa için talepleri filtrele
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredRequests.slice(startIndex, endIndex);

    // Boş sonuç kontrolü
    if (filteredRequests.length === 0) {
        requestsDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Arama kriterlerine uygun talep bulunamadı.</p>
            </div>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    // Talepleri listele
    requestsDiv.innerHTML = currentRequests.map(request => `
        <div class="table-row">
            <div class="table-cell">${request.username}</div>
            <div class="table-cell">${request.ticketNumber}</div>
            <div class="table-cell">${new Date(request.date).toLocaleString('tr-TR')}</div>
            <div class="table-cell">
                <span class="status-badge status-${request.status}">
                    <i class="fas fa-${getStatusIcon(request.status)}"></i>
                    ${getStatusText(request.status)}
                </span>
                <div class="action-buttons">
                    ${request.status === 'pending' ? `
                        <button onclick="updateStatus('${request.date}', 'approved')" class="btn btn-approve" title="Onayla">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="updateStatus('${request.date}', 'rejected')" class="btn btn-reject" title="Reddet">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : `
                        <button onclick="undoStatus('${request.date}')" class="btn btn-undo" title="Geri Al">
                            <i class="fas fa-undo"></i>
                        </button>
                    `}
                </div>
            </div>
        </div>
    `).join('');

    // Sayfalama kontrollerini güncelle
    updatePagination(totalPages);
}

function getStatusIcon(status) {
    switch(status) {
        case 'pending': return 'clock';
        case 'approved': return 'check-circle';
        case 'rejected': return 'times-circle';
        default: return 'question-circle';
    }
}

document.getElementById('statusFilter').addEventListener('change', loadTicketRequests);

function updateStatus(date, status) {
    const requests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    const requestIndex = requests.findIndex(r => r.date === date);
    
    if (requestIndex !== -1) {
        requests[requestIndex].status = status;
        localStorage.setItem('ticketRequests', JSON.stringify(requests));
        loadTicketRequests();
    }
}

// Geri alma fonksiyonu
function undoStatus(date) {
    const requests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    const requestIndex = requests.findIndex(r => r.date === date);
    
    if (requestIndex !== -1) {
        const previousStatus = requests[requestIndex].status;
        requests[requestIndex].status = 'pending';
        localStorage.setItem('ticketRequests', JSON.stringify(requests));
        
        // Kullanıcıya bilgi ver
        alert(`${previousStatus === 'approved' ? 'Onay' : 'Red'} işlemi geri alındı.`);
        
        loadTicketRequests();
    }
}

function updatePagination(totalPages) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;

    let paginationHtml = '<div class="pagination-buttons">';
    
    // Önceki sayfa butonu
    paginationHtml += `
        <button 
            onclick="changePage(${currentPage - 1})" 
            class="btn btn-page" 
            ${currentPage === 1 ? 'disabled' : ''}
            title="Önceki Sayfa"
        >
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Sayfa numaraları
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <button 
                onclick="changePage(${i})" 
                class="btn btn-page ${currentPage === i ? 'active' : ''}"
                title="${i}. Sayfa"
            >
                ${i}
            </button>
        `;
    }

    // Sonraki sayfa butonu
    paginationHtml += `
        <button 
            onclick="changePage(${currentPage + 1})" 
            class="btn btn-page" 
            ${currentPage === totalPages ? 'disabled' : ''}
            title="Sonraki Sayfa"
        >
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHtml += '</div>';
    paginationDiv.innerHTML = paginationHtml;
}

function changePage(newPage) {
    const requests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    const totalPages = Math.ceil(requests.length / itemsPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadTicketRequests();
    }
}

// Event listener'ları ekle
document.getElementById('usernameSearch').addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadTicketRequests(), searchDelay);
});

document.getElementById('ticketSearch').addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadTicketRequests(), searchDelay);
});

// Tarih filtresi event listener'ları
document.getElementById('startDate').addEventListener('change', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadTicketRequests(), searchDelay);
});

document.getElementById('endDate').addEventListener('change', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadTicketRequests(), searchDelay);
});

// Sayfa değiştirme işlevi
function switchPage(pageName) {
    document.querySelectorAll('.content-page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageName + 'Page').style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // Dashboard'a geçildiğinde filtreleri sıfırla
    if (pageName === 'dashboard') {
        // Tarih filtrelerini sıfırla
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        
        // Diğer filtreleri de sıfırla
        document.getElementById('usernameSearch').value = '';
        document.getElementById('ticketSearch').value = '';
        document.getElementById('statusFilter').value = 'all';
        
        // İstatistikleri güncelle
        updateStats();
    }
}

// Menü tıklama olayları
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage(item.dataset.page);
    });
});

// İstatistikleri güncelle
function updateStats() {
    const requests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    
    // Temel istatistikler
    document.getElementById('totalRequests').textContent = requests.length;
    document.getElementById('pendingRequests').textContent = 
        requests.filter(r => r.status === 'pending').length;
    document.getElementById('approvedRequests').textContent = 
        requests.filter(r => r.status === 'approved').length;
    document.getElementById('rejectedRequests').textContent = 
        requests.filter(r => r.status === 'rejected').length;

    // Benzersiz kullanıcı sayısı
    const uniqueUsers = [...new Set(requests.map(r => r.username))];
    document.getElementById('uniqueUsers').textContent = uniqueUsers.length;

    // En çok bilet alan kullanıcı
    const userCounts = requests.reduce((acc, curr) => {
        acc[curr.username] = (acc[curr.username] || 0) + 1;
        return acc;
    }, {});

    const topUser = Object.entries(userCounts)
        .sort(([,a], [,b]) => b - a)[0];

    if (topUser) {
        document.getElementById('topUser').textContent = topUser[0];
        document.getElementById('topUserCount').textContent = `${topUser[1]} bilet`;
    }

    // Bugünkü talepler
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRequests = requests.filter(r => {
        const requestDate = new Date(r.date);
        requestDate.setHours(0, 0, 0, 0);
        return requestDate.getTime() === today.getTime();
    });
    document.getElementById('todayRequests').textContent = todayRequests.length;

    // Ortalama günlük talep
    const dates = requests.map(r => {
        const d = new Date(r.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    });
    const uniqueDays = [...new Set(dates)].length;
    const avgRequests = uniqueDays ? (requests.length / uniqueDays).toFixed(1) : 0;
    document.getElementById('avgRequests').textContent = avgRequests;
}

// Çıkış yapma işlevi
function logout() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminLoginForm').reset();
} 