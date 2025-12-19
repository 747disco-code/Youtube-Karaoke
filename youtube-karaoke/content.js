// YouTube Karaoke Helper v2 - Content Script
console.log('🎤 YouTube Karaoke Helper v2 attivato');

let adCheckInterval = null;

// Funzione per estrarre informazioni video
function getVideoInfo() {
  const video = document. querySelector('video');
  const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
  const channelElement = document.querySelector('ytd-channel-name a');
  
  if (!video) {
    return null;
  }

  return {
    videoId: new URLSearchParams(window.location.search).get('v'),
    title: titleElement ?  titleElement.textContent : 'Video YouTube',
    channel: channelElement ? channelElement.textContent :  'Sconosciuto',
    videoUrl: video.src || video.currentSrc,
    pageUrl: window.location.href,
    duration: video.duration,
    currentTime: video.currentTime
  };
}

// Funzione per saltare le pubblicità
function skipAd() {
  const skipButtons = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    'button.ytp-ad-skip-button'
  ];
  
  for (const selector of skipButtons) {
    const button = document.querySelector(selector);
    if (button && button.offsetParent !== null) {
      button.click();
      console.log('✅ Pubblicità saltata automaticamente');
      return true;
    }
  }
  return false;
}

function speedUpAd() {
  const video = document.querySelector('video');
  const adContainer = document.querySelector('.ad-showing, .ytp-ad-player-overlay');
  
  if (video && adContainer) {
    if (video.playbackRate < 16) {
      video.playbackRate = 16;
      video.muted = true;
      console. log('⚡ Pubblicità accelerata a 16x');
    }
  }
}

function restoreNormalSpeed() {
  const video = document.querySelector('video');
  if (video && video.playbackRate !== 1) {
    video.playbackRate = 1;
    video.muted = false;
  }
}

function startAdSkipping() {
  if (adCheckInterval) {
    clearInterval(adCheckInterval);
  }

  adCheckInterval = setInterval(() => {
    const adShowing = document.querySelector('.ad-showing, .ytp-ad-player-overlay, .ytp-ad-text');
    
    if (adShowing) {
      if (! skipAd()) {
        speedUpAd();
      }
    } else {
      restoreNormalSpeed();
    }
  }, 500);
  
  console.log('🚀 Sistema anti-pubblicità avviato');
}

// Listener per i messaggi dal popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Messaggio ricevuto:', request);
  
  if (request.action === 'getVideoInfo') {
    const info = getVideoInfo();
    sendResponse({ success: !!info, data: info });
    return true;
  }
  
  if (request.action === 'activateKaraoke') {
    const info = getVideoInfo();
    if (info) {
      sendResponse({ success: true, data: info });
    } else {
      sendResponse({ success: false, error: 'Video non trovato' });
    }
    return true;
  }
  
  if (request. action === 'toggleAdSkip') {
    if (request.enabled) {
      startAdSkipping();
      sendResponse({ success: true });
    } else {
      if (adCheckInterval) {
        clearInterval(adCheckInterval);
        adCheckInterval = null;
      }
      restoreNormalSpeed();
      sendResponse({ success: true });
    }
    return true;
  }
});

// Avvia automaticamente il blocco pubblicità
startAdSkipping();

window.addEventListener('beforeunload', () => {
  if (adCheckInterval) {
    clearInterval(adCheckInterval);
  }
});

console.log('✅ YouTube Karaoke Helper v2 pronto!');