// Background Service Worker v3
console.log('🎤 YouTube Karaoke Helper v3 - Background Service avviato');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('✅ Estensione installata/aggiornata');
  
  chrome.storage.sync.set({
    adSkipEnabled: true
  });

  // Inizializza playlist vuota
  chrome.storage.local.set({
    playlist: [],
    currentIndex: -1,
    playerWindowId: null,
    controlWindowId: null
  });

  if (details.reason === 'install') {
    console.log('🎉 Prima installazione!');
  }
});

// Gestisce messaggi
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Messaggio ricevuto nel background:', request);
  
  if (request.action === 'openDualMonitor') {
    openDualMonitorMode(request.videoData)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  
  if (request.action === 'playerControl') {
    forwardToPlayer(request)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  
  if (request.action === 'videoEnded') {
    // Notifica il control panel che il video è terminato
    forwardToControlPanel({ action: 'videoEnded', videoId: request.videoId })
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// Apri modalità dual monitor
async function openDualMonitorMode(videoData) {
  console.log('🎬 Apertura modalità dual monitor...', videoData);
  
  try {
    // Carica la playlist corrente
    const storage = await chrome.storage.local.get(['playlist', 'currentIndex']);
    let playlist = storage.playlist || [];
    let currentIndex = storage.currentIndex || -1;
    
    // Se c'è un video corrente, aggiungilo alla playlist se non c'è già
    if (videoData && videoData.videoId) {
      const exists = playlist.some(song => song.videoId === videoData.videoId);
      if (!exists) {
        playlist.push(videoData);
      }
      
      // Imposta come corrente
      currentIndex = playlist.findIndex(song => song.videoId === videoData.videoId);
    }
    
    // Se la playlist è vuota, non possiamo procedere
    if (playlist.length === 0) {
      throw new Error('Playlist vuota');
    }
    
    // Salva la playlist aggiornata
    await chrome.storage.local.set({
      playlist: playlist,
      currentIndex: currentIndex
    });
    
    // Apri Control Panel (Monitor 1 - finestra normale)
    const controlWindow = await chrome.windows.create({
      url: chrome.runtime.getURL('control.html'),
      type: 'popup',
      width: 800,
      height: 600,
      focused: true
    });
    
    console.log('✅ Control Panel creato:', controlWindow.id);
    
    // Apri Player (Monitor 2 - fullscreen)
    const currentVideo = playlist[currentIndex];
    const playerUrl = chrome.runtime.getURL(`player.html?v=${currentVideo.videoId}`);
    
    const playerWindow = await chrome.windows.create({
      url: playerUrl,
      type: 'popup',
      state: 'fullscreen'
    });
    
    console.log('✅ Player creato:', playerWindow.id);
    
    // Salva gli ID delle finestre
    await chrome.storage.local.set({
      playerWindowId: playerWindow.id,
      controlWindowId: controlWindow.id
    });
    
    // Invia notifica
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🎤</text></svg>',
      title: 'Modalità Karaoke Attivata!',
      message: 'Control Panel sul Monitor 1, Player fullscreen sul Monitor 2. Trascina le finestre se necessario.',
      priority: 2
    });
    
    return true;
  } catch (error) {
    console.error('❌ Errore apertura dual monitor:', error);
    throw error;
  }
}

// Inoltra comando al player
async function forwardToPlayer(request) {
  const storage = await chrome.storage.local.get(['playerWindowId']);
  const playerWindowId = storage.playerWindowId;
  
  if (!playerWindowId) {
    throw new Error('Player window non trovato');
  }
  
  // Ottieni le tabs del player window
  const tabs = await chrome.tabs.query({ windowId: playerWindowId });
  
  if (tabs.length === 0) {
    throw new Error('Player tab non trovato');
  }
  
  // Invia messaggio al player
  await chrome.tabs.sendMessage(tabs[0].id, request);
}

// Inoltra messaggio al control panel
async function forwardToControlPanel(request) {
  const storage = await chrome.storage.local.get(['controlWindowId']);
  const controlWindowId = storage.controlWindowId;
  
  if (!controlWindowId) {
    throw new Error('Control Panel window non trovato');
  }
  
  // Ottieni le tabs del control panel window
  const tabs = await chrome.tabs.query({ windowId: controlWindowId });
  
  if (tabs.length === 0) {
    throw new Error('Control Panel tab non trovato');
  }
  
  // Invia messaggio al control panel
  await chrome.tabs.sendMessage(tabs[0].id, request);
}

// Pulisci quando le finestre vengono chiuse
chrome.windows.onRemoved.addListener(async (windowId) => {
  const storage = await chrome.storage.local.get(['playerWindowId', 'controlWindowId']);
  
  if (windowId === storage.playerWindowId) {
    console.log('🔴 Player window chiuso');
    await chrome.storage.local.set({ playerWindowId: null });
  }
  
  if (windowId === storage.controlWindowId) {
    console.log('🔴 Control Panel window chiuso');
    await chrome.storage.local.set({ controlWindowId: null });
  }
});

console.log('✅ Background service pronto!');