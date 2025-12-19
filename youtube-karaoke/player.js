// Player Script - Monitor 2
console.log('🎤 Karaoke Player inizializzato');

let currentVideoId = null;
let player = null;
let isReady = false;

const loading = document.getElementById('loading');
const youtubePlayer = document.getElementById('youtubePlayer');
const titleElement = document.getElementById('title');

// Callback chiamato quando l'API è pronta
// Note: This is the official YouTube IFrame API callback name
window.onYouTubeIframeAPIReady = function() {
  console.log('✅ YouTube IFrame API pronta');
  isReady = true;
  
  // Carica il video dall'URL se presente
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  if (videoId) {
    loadVideo(videoId);
  } else {
    loading.querySelector('div:last-child').textContent = 'In attesa di un video...';
  }
};

// Carica un video
function loadVideo(videoId, autoplay = true) {
  console.log('🎬 Caricamento video:', videoId);
  currentVideoId = videoId;
  
  if (player) {
    // Player già esistente, cambia video
    if (autoplay) {
      player.loadVideoById(videoId);
    } else {
      player.cueVideoById(videoId);
    }
  } else {
    // Crea nuovo player
    player = new YT.Player('youtubePlayer', {
      videoId: videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 1,
        fs: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    });
  }
}

// Player pronto
function onPlayerReady(event) {
  console.log('✅ Player YouTube pronto');
  loading.classList.add('hidden');
  
  // Autoplay
  event.target.playVideo();
  
  // Entra in fullscreen automaticamente
  requestFullscreen();
}

// Cambio stato player
function onPlayerStateChange(event) {
  console.log('🔄 Stato player:', event.data);
  
  // YT.PlayerState.ENDED = 0
  if (event.data === 0) {
    console.log('✅ Video terminato');
    // Notifica il control panel
    chrome.runtime.sendMessage({
      action: 'videoEnded',
      videoId: currentVideoId
    });
  }
}

// Errore player
function onPlayerError(event) {
  console.error('❌ Errore player:', event.data);
  loading.classList.remove('hidden');
  loading.querySelector('div:last-child').textContent = 'Errore caricamento video';
}

// Richiedi fullscreen
function requestFullscreen() {
  const elem = document.documentElement;
  
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(err => {
      console.warn('Impossibile attivare fullscreen automaticamente. Premi F11 manualmente.', err.message);
    });
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

// Gestisci comandi dal control panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Messaggio ricevuto nel player:', request);
  
  if (request.action === 'playerControl') {
    handlePlayerControl(request);
    sendResponse({ success: true });
  }
  
  if (request.action === 'loadVideo') {
    if (request.videoData && request.videoData.videoId) {
      loadVideo(request.videoData.videoId, true);
      titleElement.textContent = `🎤 ${request.videoData.title}`;
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Video ID mancante' });
    }
  }
  
  return true;
});

// Gestisci controlli
function handlePlayerControl(request) {
  if (!player || !isReady) {
    console.error('Player non pronto');
    return;
  }
  
  switch (request.command) {
    case 'playPause':
      const state = player.getPlayerState();
      if (state === 1) { // Playing
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      break;
      
    case 'play':
      player.playVideo();
      break;
      
    case 'pause':
      player.pauseVideo();
      break;
      
    case 'stop':
      player.stopVideo();
      break;
      
    case 'seekTo':
      if (request.time !== undefined) {
        player.seekTo(request.time, true);
      }
      break;
      
    case 'setVolume':
      if (request.volume !== undefined) {
        player.setVolume(request.volume);
      }
      break;
      
    default:
      console.warn('Comando non riconosciuto:', request.command);
  }
}

// Ascolta il tasto F11 per fullscreen
document.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault();
    requestFullscreen();
  }
});

console.log('✅ Player pronto per ricevere comandi!');
