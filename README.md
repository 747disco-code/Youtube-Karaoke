# YouTube Karaoke Helper - Estensione Chrome

Una potente estensione Chrome per gestire karaoke con YouTube su due monitor.

## 🎤 Caratteristiche

- **Gestione Playlist**: Aggiungi facilmente video YouTube alla tua playlist karaoke
- **Dual Monitor**: 
  - **Monitor 1**: Control Panel con playlist e controlli (play, pause, next, back)
  - **Monitor 2**: Video fullscreen per il karaoke
- **Controlli Completi**: Play, pause, precedente, successivo
- **Blocco Pubblicità**: Salta automaticamente le pubblicità di YouTube
- **Interfaccia Intuitiva**: Design moderno e facile da usare

## 📦 Installazione

1. Scarica o clona questa repository
2. Apri Chrome e vai su `chrome://extensions/`
3. Attiva la "Modalità sviluppatore" in alto a destra
4. Clicca su "Carica estensione non pacchettizzata"
5. Seleziona la cartella `youtube-karaoke`
6. L'estensione è ora installata! 🎉

## 🚀 Come Usare

### Passo 1: Crea la tua Playlist
1. Apri YouTube e naviga al video karaoke che vuoi aggiungere
2. Clicca sull'icona dell'estensione nella toolbar di Chrome
3. Clicca "Aggiungi alla Playlist"
4. Ripeti per tutti i video che vuoi nella tua playlist

### Passo 2: Avvia la Modalità Karaoke
1. Quando la tua playlist è pronta, clicca "Avvia Modalità Karaoke Dual-Monitor"
2. Si apriranno due finestre:
   - **Control Panel**: Resta sul primo monitor
   - **Player**: Aperto in fullscreen (trascinalo sul secondo monitor se necessario)

### Passo 3: Gestisci il Karaoke
- Usa il Control Panel per:
  - Vedere la playlist completa
  - Controllare play/pause
  - Passare al video successivo o precedente
  - Aggiungere o rimuovere canzoni
  - Svuotare la playlist

## 🎮 Controlli

### Control Panel (Monitor 1)
- **▶️/⏸️ Play/Pause**: Riproduci o metti in pausa il video corrente
- **⏮️ Precedente**: Torna al video precedente
- **⏭️ Successivo**: Passa al video successivo
- **➕ Aggiungi Canzone**: Aggiungi un nuovo video dalla pagina YouTube attiva
- **🗑️ Svuota Playlist**: Rimuovi tutti i video dalla playlist
- **❌ Rimuovi**: Rimuovi singoli video dalla playlist

### Player (Monitor 2)
- **F11**: Entra/Esci dalla modalità fullscreen
- Il video si riproduce automaticamente e passa al successivo quando termina

## 🔧 Caratteristiche Tecniche

- **Manifest V3**: Compatibile con le ultime specifiche Chrome
- **Storage Locale**: La playlist è salvata localmente
- **YouTube IFrame API**: Integrazione nativa con YouTube
- **Comunicazione Cross-Window**: Sincronizzazione tra Control Panel e Player

## 📝 Struttura File

```
youtube-karaoke/
├── manifest.json          # Configurazione estensione
├── popup.html             # Popup principale dell'estensione
├── popup.js               # Script popup
├── control.html           # Control Panel (Monitor 1)
├── control.js             # Script Control Panel
├── player.html            # Player (Monitor 2)
├── player.js              # Script Player
├── background.js          # Service Worker
└── content.js             # Content script per YouTube
```

## 🎯 Funzionalità Bonus

### Blocco Pubblicità
L'estensione include un sistema automatico per saltare le pubblicità di YouTube:
- Accelera le pubblicità a 16x velocità
- Clicca automaticamente sul pulsante "Salta pubblicità"
- Può essere disattivato dal popup

## 🐛 Risoluzione Problemi

### Il video non si carica
- Assicurati di essere su una pagina YouTube valida
- Ricarica la pagina YouTube (F5)
- Controlla che l'estensione abbia i permessi necessari

### Il Control Panel non risponde
- Verifica che il Player sia ancora aperto
- Chiudi entrambe le finestre e riavvia la modalità karaoke

### La playlist è vuota
- Aggiungi almeno un video prima di avviare la modalità karaoke
- Usa il pulsante "Aggiungi alla Playlist" dal popup

## 📜 Licenza

Questo progetto è open source e disponibile per uso personale e educativo.

## 🤝 Contributi

I contributi sono benvenuti! Sentiti libero di aprire issue o pull request.

## 📧 Supporto

Per problemi o domande, apri un issue su GitHub.

---

**Buon Karaoke! 🎤🎵**
