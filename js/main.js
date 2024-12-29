// Global değişkenler
const COOLDOWN_TIME = 3 * 60 * 1000; // 3 dakika (milisaniye cinsinden)
let lastRequestTime = {};

// Sayfa yüklendiğinde son talep zamanlarını yükle
window.addEventListener('load', function() {
    const savedTimes = localStorage.getItem('lastRequestTimes');
    if (savedTimes) {
        lastRequestTime = JSON.parse(savedTimes);
    }
});

function requestTicket() {
    const username = document.getElementById('username').value;
    const ticketNumber = document.getElementById('ticketNumber').value;

    if (!username || !ticketNumber) {
        showMessage('Lütfen tüm alanları doldurunuz.', 'error');
        return;
    }

    // Son talep zamanını kontrol et
    const currentTime = new Date().getTime();
    if (lastRequestTime[username] && (currentTime - lastRequestTime[username]) < COOLDOWN_TIME) {
        const remainingTime = Math.ceil((COOLDOWN_TIME - (currentTime - lastRequestTime[username])) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        showMessage(`Yeni bir talep oluşturmak için ${minutes} dakika ${seconds} saniye beklemelisiniz.`, 'error');
        return;
    }

    // Bilet talebini kaydet
    const requests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    
    // Bilet numarasının daha önce talep edilip edilmediğini kontrol et
    if (requests.some(request => request.ticketNumber === ticketNumber)) {
        showMessage('Bu bilet numarası daha önce talep edilmiş.', 'error');
        return;
    }
    
    requests.push({
        username: username,
        ticketNumber: ticketNumber,
        date: new Date().toISOString(),
        status: 'pending'
    });
    
    localStorage.setItem('ticketRequests', JSON.stringify(requests));
    
    // Son talep zamanını güncelle
    lastRequestTime[username] = currentTime;
    localStorage.setItem('lastRequestTimes', JSON.stringify(lastRequestTime));

    // Formu temizle
    document.getElementById('username').value = '';
    document.getElementById('ticketNumber').value = '';
    
    showMessage('Bilet talebiniz alınmıştır.', 'success');
}

// Bilet numarası input alanını sadece rakam girişine izin verecek şekilde ayarla
document.getElementById('ticketNumber').addEventListener('input', function(e) {
    // Sadece rakamları tut, diğer karakterleri temizle
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Bilet numarası input alanına paste işlemini kontrol et
document.getElementById('ticketNumber').addEventListener('paste', function(e) {
    e.preventDefault();
    // Yapıştırılan metinden sadece rakamları al
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    this.value = this.value + pastedText.replace(/[^0-9]/g, '');
});

function showMessage(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
    
    // 5 saniye sonra mesajı gizle
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
} 