// Control Panel Script - Monitor 1
console.log('🎤 Karaoke Control Panel inizializzato');

let playlist = [];
let currentIndex = -1;
let playerWindowId = null;
let isPlaying = false;

// Elementi DOM
const currentTitle = document.getElementById('currentTitle');
const currentChannel = document.getElementById('currentChannel');
const progressBar = document.getElementById('progressBar');
const playlistItems = document.getElementById('playlistItems');
const playlistCount = document.getElementById('playlistCount');
const statusBar = document.getElementById('statusBar');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const playPauseText = document.getElementById('playPauseText');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const addSongBtn = document.getElementById('addSongBtn');
const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');

// Carica playlist dal storage
async function loadPlaylist() {
  const result = await chrome.storage.local.get(['playlist', 'currentIndex', 'playerWindowId']);
  
  if (result.playlist) {
    playlist = result.playlist;
    currentIndex = result.currentIndex || -1;
    playerWindowId = result.playerWindowId || null;
    
    renderPlaylist();
    updateCurrentSong();
    updateControls();
  }
}

// Salva playlist nel storage
async function savePlaylist() {
  await chrome.storage.local.set({
    playlist: playlist,
    currentIndex: currentIndex,
    playerWindowId: playerWindowId
  });
}

// Renderizza la playlist
function renderPlaylist() {
  if (playlist.length === 0) {
    playlistItems.innerHTML = `
      <div class="empty-playlist">
        La playlist è vuota. Aggiungi canzoni dalla pagina YouTube!
      </div>
    `;
    playlistCount.textContent = '(0 canzoni)';
    return;
  }

  playlistCount.textContent = `(${playlist.length} canzon${playlist.length === 1 ? 'e' : 'i'})`;

  playlistItems.innerHTML = playlist.map((song, index) => `
    <div class="playlist-item ${index === currentIndex ? 'playing' : ''}" data-index="${index}">
      <div class="playlist-item-info">
        <div class="playlist-item-title">
          ${index === currentIndex ? '▶️ ' : ''}${song.title}
        </div>
        <div class="playlist-item-channel">📺 ${song.channel}</div>
      </div>
      <div class="playlist-item-actions">
        <button class="btn-primary" onclick="playSong(${index})">▶️</button>
        <button class="btn-danger" onclick="removeSong(${index})">❌</button>
      </div>
    </div>
  `).join('');
}

// Aggiorna la visualizzazione della canzone corrente
function updateCurrentSong() {
  if (currentIndex >= 0 && currentIndex < playlist.length) {
    const song = playlist[currentIndex];
    currentTitle.textContent = song.title;
    currentChannel.textContent = `📺 ${song.channel}`;
  } else {
    currentTitle.textContent = 'Nessun video in riproduzione';
    currentChannel.textContent = '';
  }
}

// Aggiorna lo stato dei controlli
function updateControls() {
  const hasPlaylist = playlist.length > 0;
  const hasCurrentSong = currentIndex >= 0 && currentIndex < playlist.length;
  
  playPauseBtn.disabled = !hasCurrentSong;
  prevBtn.disabled = currentIndex <= 0;
  nextBtn.disabled = currentIndex >= playlist.length - 1;
  clearPlaylistBtn.disabled = !hasPlaylist;
  
  if (isPlaying) {
    playPauseIcon.textContent = '⏸️';
    playPauseText.textContent = 'Pausa';
  } else {
    playPauseIcon.textContent = '▶️';
    playPauseText.textContent = 'Play';
  }
}

// Aggiorna la status bar
function updateStatus(message) {
  statusBar.textContent = message;
}

// Play/Pause
playPauseBtn.addEventListener('click', async () => {
  if (!playerWindowId) return;
  
  try {
    // Invia messaggio al player window
    await chrome.runtime.sendMessage({
      action: 'playerControl',
      command: 'playPause',
      windowId: playerWindowId
    });
    
    isPlaying = !isPlaying;
    updateControls();
    updateStatus(isPlaying ? '▶️ Riproduzione' : '⏸️ In pausa');
  } catch (error) {
    console.error('Errore play/pause:', error);
    updateStatus('❌ Errore controllo player');
  }
});

// Precedente
prevBtn.addEventListener('click', async () => {
  if (currentIndex > 0) {
    currentIndex--;
    await playSong(currentIndex);
  }
});

// Successivo
nextBtn.addEventListener('click', async () => {
  if (currentIndex < playlist.length - 1) {
    currentIndex++;
    await playSong(currentIndex);
  }
});

// Riproduci canzone specifica
async function playSong(index) {
  if (index < 0 || index >= playlist.length) return;
  
  currentIndex = index;
  const song = playlist[currentIndex];
  
  updateStatus(`🎵 Caricamento: ${song.title}...`);
  
  try {
    // Invia messaggio per cambiare video nel player
    await chrome.runtime.sendMessage({
      action: 'playerControl',
      command: 'loadVideo',
      windowId: playerWindowId,
      videoData: song
    });
    
    isPlaying = true;
    updateCurrentSong();
    renderPlaylist();
    updateControls();
    await savePlaylist();
    
    updateStatus(`▶️ In riproduzione: ${song.title}`);
  } catch (error) {
    console.error('Errore riproduzione:', error);
    updateStatus('❌ Errore riproduzione video');
  }
}

// Rimuovi canzone
async function removeSong(index) {
  if (index < 0 || index >= playlist.length) return;
  
  const wasPlaying = (index === currentIndex);
  
  playlist.splice(index, 1);
  
  // Aggiusta l'indice corrente
  if (index < currentIndex) {
    currentIndex--;
  } else if (index === currentIndex) {
    // Se era in riproduzione, passa alla prossima (o ferma)
    if (currentIndex >= playlist.length) {
      currentIndex = playlist.length - 1;
    }
    if (wasPlaying && currentIndex >= 0) {
      await playSong(currentIndex);
    } else {
      currentIndex = -1;
      updateCurrentSong();
    }
  }
  
  renderPlaylist();
  updateControls();
  await savePlaylist();
  
  updateStatus('🗑️ Canzone rimossa dalla playlist');
}

// Aggiungi canzone
addSongBtn.addEventListener('click', async () => {
  try {
    // Ottieni la tab YouTube attiva
    const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/watch*' });
    
    if (tabs.length === 0) {
      updateStatus('❌ Apri un video YouTube per aggiungerlo');
      return;
    }
    
    const tab = tabs[0];
    
    // Richiedi info video
    chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, async (response) => {
      if (response && response.success && response.data) {
        const videoData = response.data;
        
        // Verifica se già in playlist
        const exists = playlist.some(song => song.videoId === videoData.videoId);
        if (exists) {
          updateStatus('⚠️ Video già presente in playlist');
          return;
        }
        
        playlist.push(videoData);
        
        // Se è il primo, impostalo come corrente
        if (playlist.length === 1) {
          currentIndex = 0;
        }
        
        renderPlaylist();
        updateControls();
        await savePlaylist();
        
        updateStatus(`✅ Aggiunto: ${videoData.title}`);
      } else {
        updateStatus('❌ Impossibile ottenere info video');
      }
    });
  } catch (error) {
    console.error('Errore aggiunta canzone:', error);
    updateStatus('❌ Errore aggiunta canzone');
  }
});

// Svuota playlist
clearPlaylistBtn.addEventListener('click', async () => {
  if (confirm('Vuoi davvero svuotare la playlist?')) {
    playlist = [];
    currentIndex = -1;
    isPlaying = false;
    
    renderPlaylist();
    updateCurrentSong();
    updateControls();
    await savePlaylist();
    
    updateStatus('🗑️ Playlist svuotata');
  }
});

// Ascolta messaggi dal background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Messaggio ricevuto nel control panel:', request);
  
  if (request.action === 'updatePlaylist') {
    loadPlaylist();
    sendResponse({ success: true });
  }
  
  if (request.action === 'videoEnded') {
    // Video terminato, passa al successivo
    if (currentIndex < playlist.length - 1) {
      nextBtn.click();
    } else {
      isPlaying = false;
      updateControls();
      updateStatus('✅ Playlist terminata');
    }
    sendResponse({ success: true });
  }
  
  return true;
});

// Ascolta la chiusura del player window
chrome.windows.onRemoved.addListener(async (windowId) => {
  if (windowId === playerWindowId) {
    playerWindowId = null;
    isPlaying = false;
    updateControls();
    updateStatus('⚠️ Player chiuso');
    await savePlaylist();
  }
});

// Inizializzazione
loadPlaylist();
updateStatus('🎵 Pronto per il karaoke!');

// Esponi funzioni globali per gli onclick inline
window.playSong = playSong;
window.removeSong = removeSong;

console.log('✅ Control Panel pronto!');
