// Popup Script v3
// Helper function to validate YouTube URL
function isValidYouTubeUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com' || urlObj.hostname === 'm.youtube.com';
  } catch (e) {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  const karaokeBtn = document.getElementById('karaokeBtn');
  const addToPlaylistBtn = document.getElementById('addToPlaylistBtn');
  const adSkipToggle = document.getElementById('adSkipToggle');
  const status = document.getElementById('status');
  const videoInfo = document.getElementById('videoInfo');
  const videoTitle = document.getElementById('videoTitle');
  const videoChannel = document.getElementById('videoChannel');

  let currentVideoData = null;

  // Carica le impostazioni salvate
  chrome.storage.sync.get(['adSkipEnabled'], function(result) {
    adSkipToggle.checked = result.adSkipEnabled !== false;
  });

  // Carica info video e playlist
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (isValidYouTubeUrl(tab.url) && tab.url.includes('/watch')) {
      chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, function(response) {
        if (response && response.success && response.data) {
          currentVideoData = response.data;
          videoTitle.textContent = response.data.title;
          videoChannel.textContent = `📺 ${response.data.channel}`;
          videoInfo.classList.add('show');
        }
      });
    }

    // Mostra informazioni playlist
    const storage = await chrome.storage.local.get(['playlist']);
    const playlistLength = (storage.playlist || []).length;
    if (playlistLength > 0) {
      status.textContent = `📋 Playlist: ${playlistLength} canzon${playlistLength === 1 ? 'e' : 'i'}`;
    }
  } catch (error) {
    console.error('Errore caricamento info:', error);
  }

  // Aggiungi alla playlist
  addToPlaylistBtn.addEventListener('click', async function() {
    if (!currentVideoData) {
      status.textContent = '❌ Apri un video YouTube prima!';
      status.style.color = '#ff4757';
      return;
    }

    try {
      // Carica playlist corrente
      const storage = await chrome.storage.local.get(['playlist']);
      let playlist = storage.playlist || [];

      // Verifica se già presente
      const exists = playlist.some(song => song.videoId === currentVideoData.videoId);
      if (exists) {
        status.textContent = '⚠️ Video già presente in playlist';
        status.style.color = '#ffa502';
        return;
      }

      // Aggiungi alla playlist
      playlist.push(currentVideoData);

      // Salva
      await chrome.storage.local.set({ playlist: playlist });

      status.textContent = `✅ Aggiunto! Playlist: ${playlist.length} canzon${playlist.length === 1 ? 'e' : 'i'}`;
      status.style.color = '#2ecc71';

      // Notifica il control panel se aperto
      chrome.runtime.sendMessage({ action: 'updatePlaylist' });
    } catch (error) {
      console.error('Errore:', error);
      status.textContent = '❌ Errore aggiunta: ' + error.message;
      status.style.color = '#ff4757';
    }
  });

  // Gestisce il click sul pulsante karaoke
  karaokeBtn.addEventListener('click', async function() {
    console.log('🎤 Pulsante karaoke cliccato');
    status.textContent = '🔄 Attivazione modalità karaoke...';
    status.style.color = 'white';
    
    try {
      // Verifica se c'è una playlist
      const storage = await chrome.storage.local.get(['playlist']);
      const playlist = storage.playlist || [];

      if (playlist.length === 0 && !currentVideoData) {
        status.textContent = '❌ Aggiungi almeno un video alla playlist!';
        status.style.color = '#ff4757';
        return;
      }

      // Se c'è un video corrente ma non è in playlist, aggiungilo
      if (currentVideoData && !playlist.some(s => s.videoId === currentVideoData.videoId)) {
        playlist.push(currentVideoData);
        await chrome.storage.local.set({ playlist: playlist, currentIndex: playlist.length - 1 });
      }

      // Invia messaggio al background per aprire dual monitor
      chrome.runtime.sendMessage({
        action: 'openDualMonitor',
        videoData: currentVideoData
      }, function(bgResponse) {
        if (bgResponse && bgResponse.success) {
          status.textContent = '✅ Modalità Karaoke attivata!';
          status.style.color = '#2ecc71';
          setTimeout(() => window.close(), 1500);
        } else {
          status.textContent = '❌ Errore: ' + (bgResponse.error || 'Sconosciuto');
          status.style.color = '#ff4757';
        }
      });
    } catch (error) {
      console.error('Errore:', error);
      status.textContent = '❌ Errore: ' + error.message;
      status.style.color = '#ff4757';
    }
  });

  // Gestisce il toggle del blocco pubblicità
  adSkipToggle.addEventListener('change', async function() {
    const enabled = adSkipToggle.checked;
    
    chrome.storage.sync.set({ adSkipEnabled: enabled });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (isValidYouTubeUrl(tab.url)) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'toggleAdSkip', 
          enabled: enabled 
        }, function(response) {
          if (response && response.success) {
            status.textContent = enabled ? '✅ Blocco pubblicità attivo' : '⏸️ Blocco pubblicità disattivato';
            status.style.color = enabled ? '#2ecc71' : '#ffa502';
          }
        });
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  });
});