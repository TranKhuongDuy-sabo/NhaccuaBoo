// ======================================================================
// 1. KHỞI TẠO CÁC BIẾN VÀ KẾT NỐI DOM
// ======================================================================
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const playlistContainer = document.getElementById('playlistContainer');
const currentListTitle = document.getElementById('currentListTitle');
const listActions = document.getElementById('listActions');

const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const currentTimeDisplay = document.getElementById('currentTimeDisplay');
const totalTimeDisplay = document.getElementById('totalTimeDisplay');

const API_URL = 'https://nhaccuaboo-production.up.railway.app/api/music';
const PLAYLIST_API = 'https://nhaccuaboo-production.up.railway.app/api/playlist';

let currentPlaylist = [];
let currentSongIndex = -1;
let myPlaylists = []; 
let songIndexToSave = -1; 
let currentViewMode = 'search'; 
let currentPlayingVideoId = null; 

// THÊM BIẾN NÀY ĐỂ NHỚ ID CỦA PLAYLIST ĐANG MỞ (Dùng để lưu thứ tự)
let currentPlaylistId = null; 

let currentTheme = 'light';
let isShuffle = false; 
let repeatMode = 0; 
let hasRepeatedOnce = false; 

loadPlaylists();
audioPlayer.volume = 1; 
volumeBar.style.setProperty('--progress', '100%');


// ======================================================================
// 2. CÁC TÍNH NĂNG VIP (GIAO DIỆN, PHÍM TẮT, TRỘN, LẶP)
// ======================================================================
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    document.getElementById('themeToggle').innerText = currentTheme === 'light' ? '🌙' : '☀️';
}

document.addEventListener('keydown', (e) => {
    if(e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); } 
    else if (e.code === 'ArrowRight') { if(audioPlayer.duration) audioPlayer.currentTime += 5; } 
    else if (e.code === 'ArrowLeft') { if(audioPlayer.duration) audioPlayer.currentTime -= 5; }
});

function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('shuffleBtn');
    if (isShuffle) btn.classList.add('active'); 
    else btn.classList.remove('active');
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3; 
    const btn = document.getElementById('repeatBtn');
    const iconRepeatAll = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;
    const iconRepeatOne = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><text x="12" y="15.5" font-size="10" font-family="sans-serif" stroke="none" fill="currentColor" text-anchor="middle" font-weight="bold">1</text></svg>`;

    if (repeatMode === 0) {
        btn.classList.remove('active'); btn.innerHTML = iconRepeatAll; btn.title = "Lặp lại: TẮT";
    } else if (repeatMode === 1) {
        btn.classList.add('active'); btn.innerHTML = iconRepeatAll; btn.title = "Lặp lại: HÁT LẠI 1 LẦN";
    } else if (repeatMode === 2) {
        btn.classList.add('active'); btn.innerHTML = iconRepeatOne; btn.title = "Lặp lại: MÃI MÃI";
    }
}


// ======================================================================
// 3. LOGIC VẼ SÓNG NHẠC
// ======================================================================
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const bufferLength = 80; 
    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;
    const time = Date.now() / 150; 

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = 4; 
        if (!audioPlayer.paused && audioPlayer.currentTime > 0) {
            const wave1 = Math.sin(time + i * 0.1) * 20;
            const wave2 = Math.cos(time * 0.8 + i * 0.2) * 15;
            barHeight = Math.abs(wave1 + wave2 + (Math.random() * 10)) + 5;
            if (barHeight > canvas.height) barHeight = canvas.height - 10;
        }
        canvasCtx.fillStyle = `#ff758c`; 
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 3; 
    }
}
drawVisualizer();


// ======================================================================
// 4. LOGIC THANH ĐIỀU KHIỂN PLAYER 
// ======================================================================
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progressPercent;
        progressBar.style.setProperty('--progress', `${progressPercent}%`); 
        currentTimeDisplay.innerText = formatTime(audioPlayer.currentTime);
        totalTimeDisplay.innerText = formatTime(audioPlayer.duration);
    }
});

progressBar.addEventListener('input', () => {
    if (audioPlayer.duration) {
        audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
        progressBar.style.setProperty('--progress', `${progressBar.value}%`);
    }
});

volumeBar.addEventListener('input', () => {
    audioPlayer.volume = volumeBar.value / 100;
    volumeBar.style.setProperty('--progress', `${volumeBar.value}%`);
});

function togglePlay() { audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause(); }
function playPrevious() { if (currentSongIndex > 0) playSong(currentSongIndex - 1); }
audioPlayer.addEventListener('play', () => { playPauseBtn.innerHTML = "⏸&#xFE0E;"; });
audioPlayer.addEventListener('pause', () => { playPauseBtn.innerHTML = "▶&#xFE0E;"; });


// ======================================================================
// 5. LOGIC QUẢN LÝ PLAYLIST VÀ ĐỌC BỘ NHỚ LOCALSTORAGE
// ======================================================================
async function loadPlaylists() {
    try {
        const response = await fetch(PLAYLIST_API);
        myPlaylists = await response.json();
        renderPlaylistsUI();
    } catch (error) { console.error("Lỗi:", error); }
}

async function createPlaylist() {
    const nameInput = document.getElementById('newPlaylistName');
    const name = nameInput.value.trim();
    if (!name) return;
    try {
        const response = await fetch(PLAYLIST_API, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name })
        });
        if (response.ok) { nameInput.value = ""; loadPlaylists(); }
    } catch (e) {}
}

function renderPlaylistsUI() {
    playlistContainer.innerHTML = "";
    myPlaylists.forEach(pl => {
        const btn = document.createElement('button');
        btn.className = "btn-playlist";
        btn.innerHTML = `🎵 ${pl.name} <span style="color:var(--primary-solid); margin-left:5px;">(${pl.songs ? pl.songs.length : 0})</span>`;
        btn.onclick = () => viewMyPlaylist(pl);
        playlistContainer.appendChild(btn);
    });
}

function viewMyPlaylist(playlist) {
    currentViewMode = 'playlist'; 
    currentPlaylistId = playlist.id; // Ghi nhớ ID của Playlist đang mở
    currentListTitle.innerHTML = playlist.name;
    listActions.innerHTML = `
        <button class="btn-primary" onclick="playSong(0)" style="margin-right: 15px; display: inline-flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">▶</span> Phát Playlist
        </button>
        <button class="btn-delete" onclick="deletePlaylist(${playlist.id})">
            <span style="font-size: 16px;">🗑</span> Xóa Playlist
        </button>
    `;

    if (!playlist.songs || playlist.songs.length === 0) {
        resultsDiv.innerHTML = "<p style='color: var(--text-sub);'>Danh sách này trống.</p>";
        currentPlaylist = []; return;
    }
    
    let songs = playlist.songs.map(s => ({
        dbId: s.id, id: s.videoId, title: s.title, author: s.author, thumbnail: s.thumbnail, duration: s.duration
    }));

    // --- PHÉP THUẬT Ở ĐÂY: ĐỌC THỨ TỰ TỪ LOCALSTORAGE ---
    const savedOrderStr = localStorage.getItem(`playlist_order_${playlist.id}`);
    if (savedOrderStr) {
        const savedOrder = JSON.parse(savedOrderStr);
        // Sắp xếp lại danh sách bài hát dựa trên bộ nhớ
        songs.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.dbId);
            const indexB = savedOrder.indexOf(b.dbId);
            // Nếu bài mới thêm vào chưa có trong bộ nhớ, đẩy nó xuống cuối cùng (999)
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
    }

    currentPlaylist = songs;
    renderPlaylistUI();
}

async function deletePlaylist(playlistId) {
    if (!confirm("Xóa hoàn toàn Playlist này?")) return;
    try {
        const response = await fetch(`${PLAYLIST_API}/${playlistId}`, { method: 'DELETE' });
        if (response.ok) {
            localStorage.removeItem(`playlist_order_${playlistId}`); // Xóa luôn bộ nhớ của nó
            loadPlaylists(); resultsDiv.innerHTML = ""; currentListTitle.innerHTML = "Trang chủ"; listActions.innerHTML = "";
        }
    } catch (e) {}
}

async function deleteSongFromPlaylist(index, songDbId) {
    if (!confirm("Bỏ bài hát này ra khỏi danh sách?")) return;
    try {
        const response = await fetch(`${PLAYLIST_API}/song/${songDbId}`, { method: 'DELETE' });
        if (response.ok) {
            currentPlaylist.splice(index, 1);
            
            // Xóa xong thì Cập nhật lại bộ nhớ ngay lập tức
            const newOrder = currentPlaylist.map(song => song.dbId);
            localStorage.setItem(`playlist_order_${currentPlaylistId}`, JSON.stringify(newOrder));

            if (currentPlaylist.length === 0) resultsDiv.innerHTML = "<p style='color: gray;'>Danh sách đã trống.</p>";
            else renderPlaylistUI();
            
            loadPlaylists();
        }
    } catch (e) {}
}


// ======================================================================
// 6. LOGIC TÌM KIẾM VÀ LƯU NHẠC
// ======================================================================
async function searchMusic() {
    const query = searchInput.value;
    if (!query) return;

    currentViewMode = 'search'; 
    currentPlaylistId = null; // Khi tìm kiếm thì tắt bộ nhớ
    resultsDiv.innerHTML = "<p style='color:gray;'>Đang tìm kiếm...</p>";
    currentListTitle.innerHTML = "Kết quả tìm kiếm";
    listActions.innerHTML = "";

    try {
        const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`);
        currentPlaylist = await response.json();
        renderPlaylistUI();
    } catch (error) {}
}

searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); searchMusic(); }
});

function openSaveModal(index) {
    songIndexToSave = index;
    const modal = document.getElementById('playlistModal');
    const modalList = document.getElementById('modalPlaylistList');
    modalList.innerHTML = ""; 
    const songToAdd = currentPlaylist[index];
    
    if (myPlaylists.length === 0) {
        modalList.innerHTML = "<p style='color: gray;'>Bạn chưa có Playlist nào.</p>";
    } else {
        myPlaylists.forEach(pl => {
            const btn = document.createElement('button');
            btn.className = "modal-playlist-btn";
            const isAlreadyInList = pl.songs && pl.songs.some(s => s.videoId === songToAdd.id);

            if (isAlreadyInList) {
                btn.innerHTML = `✔ Đã có trong: ${pl.name}`;
                btn.style.background = "var(--hover-bg)"; btn.style.color = "var(--text-sub)"; btn.style.cursor = "not-allowed"; btn.disabled = true;               
            } else {
                btn.innerHTML = `🎧 ${pl.name}`; btn.onclick = () => confirmSaveToPlaylist(pl.id, btn);
            }
            modalList.appendChild(btn);
        });
    }
    modal.style.display = "block";
}

function closeModal() { document.getElementById('playlistModal').style.display = "none"; }
window.onclick = function(e) { const modal = document.getElementById('playlistModal'); if (e.target == modal) modal.style.display = "none"; }

async function confirmSaveToPlaylist(playlistId, btn) {
    const song = currentPlaylist[songIndexToSave];
    const savedData = { videoId: song.id, title: song.title, author: song.author, thumbnail: song.thumbnail, duration: song.duration };
    
    btn.innerHTML = "⏳ Đang lưu...";
    try {
        const response = await fetch(`${PLAYLIST_API}/${playlistId}/songs`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savedData)
        });
        if (response.ok) {
            btn.innerHTML = "✔ Đã thêm!"; btn.style.background = "var(--primary-solid)"; btn.style.color = "white"; 
            loadPlaylists(); setTimeout(closeModal, 1000);
        }
    } catch (err) { btn.innerHTML = "❌ Lỗi"; }
}


// ======================================================================
// 7. RENDER GIAO DIỆN & LƯU VỊ TRÍ KHI KÉO THẢ
// ======================================================================
function renderPlaylistUI() {
    resultsDiv.innerHTML = "";
    if (currentPlaylist.length === 0) return;

    currentPlaylist.forEach((item, index) => {
        const isPlaying = (item.id === currentPlayingVideoId);
        const songDiv = document.createElement('div');
        
        songDiv.className = `song-item ${isPlaying ? 'playing' : ''}`;
        songDiv.onclick = () => playSong(index);
        
        let actionBtnHtml = currentViewMode === 'search' 
            ? `<button class="btn-icon" title="Thêm vào Playlist" style="font-size: 26px; font-weight: 300;" onclick="event.stopPropagation(); openSaveModal(${index})">+</button>`
            : `<button class="btn-icon" title="Xóa khỏi Playlist" style="color: #ff4d85; font-size: 18px;" onclick="event.stopPropagation(); deleteSongFromPlaylist(${index}, ${item.dbId})">🗑</button>`;

        songDiv.innerHTML = `
            <img src="${item.thumbnail}" alt="thumb">
            <div class="song-info ${isPlaying ? 'playing' : ''}">
                <h3>${item.title}</h3>
                <p>${item.author} • ${item.duration}</p>
            </div>
            <div class="song-actions">
                ${actionBtnHtml}
                <button class="btn-play-small" onclick="event.stopPropagation(); playSong(${index})">
                    ${isPlaying ? '🔊' : '▶'}
                </button>
            </div>
        `;
        resultsDiv.appendChild(songDiv);
    });

    // KÍCH HOẠT KÉO THẢ VÀ LƯU BỘ NHỚ
    if (currentViewMode === 'playlist') {
        Sortable.create(resultsDiv, {
            animation: 250, 
            ghostClass: 'dragging-ghost', 
            onEnd: function (evt) {
                // Di chuyển bài hát trong mảng
                const movedItem = currentPlaylist.splice(evt.oldIndex, 1)[0];
                currentPlaylist.splice(evt.newIndex, 0, movedItem);

                // Cập nhật mốc phát nhạc
                if (currentSongIndex === evt.oldIndex) { currentSongIndex = evt.newIndex; } 
                else if (currentSongIndex > evt.oldIndex && currentSongIndex <= evt.newIndex) { currentSongIndex--; } 
                else if (currentSongIndex < evt.oldIndex && currentSongIndex >= evt.newIndex) { currentSongIndex++; }

                // --- GHI NHỚ VỊ TRÍ MỚI VÀO LOCALSTORAGE ---
                const newOrder = currentPlaylist.map(song => song.dbId);
                localStorage.setItem(`playlist_order_${currentPlaylistId}`, JSON.stringify(newOrder));

                renderPlaylistUI();
            }
        });
    }
}


// ======================================================================
// 8. LOGIC PHÁT NHẠC VÀ THUẬT TOÁN TỰ CHUYỂN BÀI
// ======================================================================
async function playSong(index, isAutoRepeat = false) {
    currentSongIndex = index;
    const song = currentPlaylist[index];
    currentPlayingVideoId = song.id;

    if (!isAutoRepeat) hasRepeatedOnce = false;

    audioPlayer.pause();
    renderPlaylistUI(); 

    document.getElementById('playerThumb').src = song.thumbnail;
    document.getElementById('playerThumb').style.display = 'block';
    document.getElementById('playerTitle').innerText = song.title;
    document.getElementById('playerAuthor').innerText = song.author;

    try {
        const response = await fetch(`${API_URL}/stream?videoId=${song.id}`);
        if (!response.ok) return autoPlayNext();
        
        const data = await response.json();
        audioPlayer.src = data.url;
        audioPlayer.play();

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title, artist: song.author,
                artwork: [{ src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', togglePlay);
            navigator.mediaSession.setActionHandler('pause', togglePlay);
            navigator.mediaSession.setActionHandler('nexttrack', () => autoPlayNext()); 
            navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
        }
    } catch (error) { autoPlayNext(); }
}

audioPlayer.addEventListener('ended', autoPlayNext);

async function autoPlayNext(event) {
    const isEndedNaturally = (event && event.type === 'ended');

    if (isEndedNaturally) {
        if (repeatMode === 2) { playSong(currentSongIndex, true); return; }
        if (repeatMode === 1) {
            if (!hasRepeatedOnce) {
                hasRepeatedOnce = true; 
                playSong(currentSongIndex, true); 
                return;
            } else { hasRepeatedOnce = false; }
        }
    } else { hasRepeatedOnce = false; }

    let nextIndex = currentSongIndex + 1;
    if (isShuffle) nextIndex = Math.floor(Math.random() * currentPlaylist.length);

    if (nextIndex < currentPlaylist.length) {
        playSong(nextIndex);
    } else {
        const lastSong = currentPlaylist[currentSongIndex];
        try {
            const response = await fetch(`${API_URL}/related?artist=${encodeURIComponent(lastSong.author)}&currentVideoId=${lastSong.id}`);
            const relatedItems = await response.json();
            if (relatedItems && relatedItems.length > 0) {
                currentPlaylist.push(...relatedItems); 
                playSong(currentSongIndex + 1);
            }
        } catch (err) {}
    }
}

// ======================================================================
// 9. ĐĂNG KÝ SERVICE WORKER (ĐỂ CÀI ĐẶT PWA LÊN ĐIỆN THOẠI)
// ======================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('✅ Service Worker đăng ký thành công!'))
            .catch((err) => console.log('❌ Lỗi đăng ký Service Worker:', err));
    });
}