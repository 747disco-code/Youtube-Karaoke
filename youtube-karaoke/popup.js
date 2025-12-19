// Popup Script v2
document.addEventListener('DOMContentLoaded', async function() {
  const karaokeBtn = document.getElementById('karaokeBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const adSkipToggle = document.getElementById('adSkipToggle');
  const status = document.getElementById('status');
  const videoInfo = document. getElementById('videoInfo');
  const videoTitle = document.getElementById('videoTitle');
  const videoChannel = document.getElementById('videoChannel');

  let currentVideoData = null;

  // Carica le impostazioni salvate
  chrome.storage.sync.get(['adSkipEnabled'], function(result) {
    adSkipToggle.checked = result.adSkipEnabled !== false;
  });

  // Carica info video
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes('youtube. com/watch')) {
      chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' }, function(response) {
        if (response && response.success && response.data) {
          currentVideoData = response.data;
          videoTitle.textContent = response.data.title;
          videoChannel.textContent = `📺 ${response.data.channel}`;
          videoInfo.classList.add('show');
        }
      });
    }
  } catch (error) {
    console.error('Errore caricamento info:', error);
  }

  // Download video
  downloadBtn.addEventListener('click', async function() {
    status.textContent = '⚠️ NOTA: Per scaricare video usa yt-dlp o 4K Video Downloader';
    status.style.color = '#ffa502';
    
    // Apri pagina con istruzioni download
    if (currentVideoData) {
      const downloadUrl = `https://www.y2mate.com/youtube/${currentVideoData.videoId}`;
      chrome.tabs.create({ url: downloadUrl });
    }
  });

  // Gestisce il click sul pulsante karaoke
  karaokeBtn.addEventListener('click', async function() {
    console.log('🎤 Pulsante karaoke cliccato');
    status.textContent = '🔄 Attivazione modalità karaoke...';
    status.style.color = 'white';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (! tab.url || !tab.url.includes('youtube.com')) {
        status.textContent = '❌ Apri un video YouTube prima! ';
        status.style.color = '#ff4757';
        return;
      }

      // Ottieni info video
      chrome.tabs.sendMessage(tab. id, { action: 'activateKaraoke' }, async function(response) {
        if (chrome.runtime.lastError) {
          console.error('Errore:', chrome.runtime.lastError);
          status.textContent = '❌ Ricarica la pagina YouTube (F5)';
          status. style.color = '#ff4757';
          return;
        }
        
        if (response && response.success) {
          // Invia messaggio al background per aprire dual monitor
          chrome.runtime.sendMessage({
            action: 'openDualMonitor',
            videoData: response.data
          }, function(bgResponse) {
            if (bgResponse && bgResponse.success) {
              status.textContent = '✅ Modalità Karaoke attivata!';
              status.style.color = '#2ecc71';
              setTimeout(() => window.close(), 1500);
            } else {
              status.textContent = '❌ Errore apertura finestre';
              status.style.color = '#ff4757';
            }
          });
        } else {
          status.textContent = '❌ ' + (response.error || 'Errore sconosciuto');
          status.style.color = '#ff4757';
        }
      });
    } catch (error) {
      console.error('Errore:', error);
      status.textContent = '❌ Errore:  ' + error.message;
      status.style.color = '#ff4757';
    }
  });

  // Gestisce il toggle del blocco pubblicità
  adSkipToggle.addEventListener('change', async function() {
    const enabled = adSkipToggle. checked;
    
    chrome.storage.sync.set({ adSkipEnabled: enabled });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url && tab.url. includes('youtube.com')) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'toggleAdSkip', 
          enabled:  enabled 
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