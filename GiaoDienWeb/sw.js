// Đây là Service Worker cơ bản để vượt qua bài kiểm tra PWA của trình duyệt
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Đã cài đặt thành công!');
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Không làm gì cả, cứ để mạng trôi qua bình thường
});