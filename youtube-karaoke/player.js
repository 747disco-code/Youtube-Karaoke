// Player Script - Monitor 2 (Simple Embed Version)
console.log('🎤 Karaoke Player inizializzato');

const loading = document.getElementById('loading');
const youtubePlayer = document.getElementById('youtubePlayer');
const titleElement = document.getElementById('title');

// Carica il video dall'URL
function loadVideo() {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  if (videoId) {
    console.log('🎬 Caricamento video:', videoId);
    
    // Usa l'embed URL di YouTube con autoplay
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&fs=1&modestbranding=1&rel=0&controls=1`;
    youtubePlayer.src = embedUrl;
    
    // Nascendi loading dopo un breve delay
    setTimeout(() => {
      loading.classList.add('hidden');
    }, 1000);
    
    // Prova ad entrare in fullscreen automaticamente
    setTimeout(() => {
      requestFullscreen();
    }, 1500);
  } else {
    loading.querySelector('div:last-child').textContent = 'In attesa di un video...';
  }
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

// Gestisci messaggi dal control panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Messaggio ricevuto nel player:', request);
  
  if (request.action === 'loadVideo') {
    if (request.videoData && request.videoData.videoId) {
      const videoId = request.videoData.videoId;
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&fs=1&modestbranding=1&rel=0&controls=1`;
      youtubePlayer.src = embedUrl;
      titleElement.textContent = `🎤 ${request.videoData.title}`;
      loading.classList.add('hidden');
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Video ID mancante' });
    }
  }
  
  return true;
});

// Ascolta il tasto F11 per fullscreen
document.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault();
    requestFullscreen();
  }
});

// Inizializza
loadVideo();

console.log('✅ Player pronto!');
