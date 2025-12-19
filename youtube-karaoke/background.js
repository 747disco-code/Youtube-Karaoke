// Background Service Worker v2
console.log('🎤 YouTube Karaoke Helper v2 - Background Service avviato');

chrome.runtime.onInstalled.addListener((details) => {
  console.log('✅ Estensione installata/aggiornata');
  
  chrome.storage.sync.set({
    adSkipEnabled: true
  });

  if (details.reason === 'install') {
    console.log('🎉 Prima installazione! ');
  }
});

// Gestisce apertura dual monitor
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Messaggio ricevuto nel background:', request);
  
  if (request. action === 'openDualMonitor') {
    openDualMonitorMode(request.videoData)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function openDualMonitorMode(videoData) {
  console.log('🎬 Apertura modalità dual monitor... ', videoData);
  
  // Apri finestra fullscreen su secondo monitor
  const fullscreenWindow = await chrome.windows.create({
    url: videoData.pageUrl,
    type: 'popup',
    state: 'fullscreen'
  });

  console.log('✅ Finestra fullscreen creata:', fullscreenWindow.id);
  
  // Invia notifica
  chrome.notifications.create({
    type: 'basic',
    iconUrl:  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🎤</text></svg>',
    title: 'Modalità Karaoke Attivata! ',
    message: 'Trascina la finestra fullscreen sul secondo monitor.  La pagina originale funziona come player di controllo.',
    priority: 2
  });
  
  return true;
}