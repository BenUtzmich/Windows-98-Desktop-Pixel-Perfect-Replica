/* ============================================
   Windows 98 Desktop - Complete Application Logic
   ============================================ */

// ==================== GLOBAL STATE ====================
let windowZIndex = 10;
let activeWindow = null;
let openWindows = {};
let windowStates = {};
let dragState = null;
let resizeState = null;
let selectedDesktopIcon = null;

// Minesweeper state
let msGame = {
  rows: 9,
  cols: 9,
  mines: 10,
  board: [],
  revealed: [],
  flagged: [],
  gameOver: false,
  gameWon: false,
  firstClick: true,
  timer: 0,
  timerInterval: null,
  minesLeft: 10
};

// DOS state
let dosHistory = [];
let dosHistoryIndex = -1;
let dosCurrentDir = 'C:\\WINDOWS';
let dosFileSystem = {
  'C:': {
    type: 'dir',
    children: {
      'WINDOWS': {
        type: 'dir',
        children: {
          'SYSTEM': { type: 'dir', children: {
            'KERNEL32.DLL': { type: 'file', size: 458752 },
            'USER32.DLL': { type: 'file', size: 262144 },
            'GDI32.DLL': { type: 'file', size: 131072 },
            'SHELL32.DLL': { type: 'file', size: 819200 },
            'ADVAPI32.DLL': { type: 'file', size: 196608 }
          }},
          'SYSTEM32': { type: 'dir', children: {} },
          'TEMP': { type: 'dir', children: {} },
          'DESKTOP': { type: 'dir', children: {} },
          'WIN.INI': { type: 'file', size: 2048 },
          'SYSTEM.INI': { type: 'file', size: 1024 },
          'NOTEPAD.EXE': { type: 'file', size: 65536 },
          'EXPLORER.EXE': { type: 'file', size: 262144 },
          'CALC.EXE': { type: 'file', size: 32768 },
          'COMMAND.COM': { type: 'file', size: 93890 }
        }
      },
      'PROGRAMME': {
        type: 'dir',
        children: {
          'ZUBEHÖR': { type: 'dir', children: {} },
          'INTERNET EXPLORER': { type: 'dir', children: {} }
        }
      },
      'EIGENE DATEIEN': {
        type: 'dir',
        children: {
          'BRIEF.TXT': { type: 'file', size: 512, content: 'Sehr geehrte Damen und Herren,\n\ndies ist ein Beispielbrief.\n\nMit freundlichen Grüßen' },
          'NOTIZEN.TXT': { type: 'file', size: 256, content: 'Meine Notizen:\n- Windows 98 installieren\n- Treiber aktualisieren\n- Minesweeper spielen' }
        }
      },
      'AUTOEXEC.BAT': { type: 'file', size: 128, content: '@ECHO OFF\nPATH C:\\WINDOWS;C:\\WINDOWS\\COMMAND\nSET TEMP=C:\\WINDOWS\\TEMP' },
      'CONFIG.SYS': { type: 'file', size: 64, content: 'DEVICE=C:\\WINDOWS\\HIMEM.SYS\nDOS=HIGH,UMB' },
      'IO.SYS': { type: 'file', size: 222390 },
      'MSDOS.SYS': { type: 'file', size: 1024 }
    }
  }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initDesktopIcons();
  initWindowDragging();
  initWindowResizing();
  initStartMenu();
  initDosEmulator();
  initNotepad();
  addResizeHandles();
  
  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
      closeStartMenu();
    }
  });
  
  // Desktop click to deselect icons
  document.getElementById('desktop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('desktop') || e.target === document.getElementById('desktop-icons')) {
      deselectAllIcons();
    }
  });

  // Prevent context menu
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.minesweeper-grid')) {
      e.preventDefault();
    }
  });
});

// ==================== CLOCK ====================
function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}`;
}

// ==================== DESKTOP ICONS ====================
function initDesktopIcons() {
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      deselectAllIcons();
      icon.classList.add('selected');
      selectedDesktopIcon = icon;
    });
  });
}

function deselectAllIcons() {
  document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  selectedDesktopIcon = null;
}

// ==================== START MENU ====================
function initStartMenu() {
  // Nothing extra needed, HTML handles hover submenus
}

function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  const btn = document.getElementById('start-button');
  if (menu.style.display === 'none' || menu.style.display === '') {
    menu.style.display = 'flex';
    btn.classList.add('active');
  } else {
    closeStartMenu();
  }
}

function closeStartMenu() {
  document.getElementById('start-menu').style.display = 'none';
  document.getElementById('start-button').classList.remove('active');
}

// ==================== WINDOW MANAGEMENT ====================
function openWindow(appId) {
  const win = document.getElementById(`window-${appId}`);
  if (!win) return;
  
  if (openWindows[appId]) {
    // Already open, bring to front and restore if minimized
    if (windowStates[appId] === 'minimized') {
      win.style.display = 'flex';
      windowStates[appId] = 'normal';
      updateTaskbarItem(appId, true);
    }
    bringToFront(appId);
    return;
  }
  
  // Position window
  if (!win.dataset.positioned) {
    const offsetX = Object.keys(openWindows).length * 30 + 50;
    const offsetY = Object.keys(openWindows).length * 30 + 30;
    win.style.left = offsetX + 'px';
    win.style.top = offsetY + 'px';
    win.dataset.positioned = 'true';
  }
  
  win.style.display = 'flex';
  openWindows[appId] = true;
  windowStates[appId] = 'normal';
  
  bringToFront(appId);
  addTaskbarItem(appId);
  
  // App-specific initialization
  if (appId === 'network') {
    fetchNetworkInfo();
  }
  if (appId === 'minesweeper') {
    minesweeperNewGame();
  }
  if (appId === 'msdos') {
    initDosSession();
  }
}

function closeWindow(appId) {
  const win = document.getElementById(`window-${appId}`);
  if (!win) return;
  
  win.style.display = 'none';
  delete openWindows[appId];
  delete windowStates[appId];
  removeTaskbarItem(appId);
  
  // Cleanup
  if (appId === 'minesweeper' && msGame.timerInterval) {
    clearInterval(msGame.timerInterval);
    msGame.timerInterval = null;
  }
  
  // Reset maximized state
  win.classList.remove('maximized');
  
  // Activate next window
  const remaining = Object.keys(openWindows);
  if (remaining.length > 0) {
    bringToFront(remaining[remaining.length - 1]);
  } else {
    activeWindow = null;
  }
}

function minimizeWindow(appId) {
  const win = document.getElementById(`window-${appId}`);
  if (!win) return;
  
  win.style.display = 'none';
  windowStates[appId] = 'minimized';
  updateTaskbarItem(appId, false);
  
  // Activate next window
  const visible = Object.keys(openWindows).filter(id => windowStates[id] !== 'minimized');
  if (visible.length > 0) {
    bringToFront(visible[visible.length - 1]);
  } else {
    activeWindow = null;
    updateAllTitleBars();
  }
}

function maximizeWindow(appId) {
  const win = document.getElementById(`window-${appId}`);
  if (!win) return;
  
  if (win.classList.contains('maximized')) {
    // Restore
    win.classList.remove('maximized');
    if (win.dataset.restoreLeft) {
      win.style.left = win.dataset.restoreLeft;
      win.style.top = win.dataset.restoreTop;
      win.style.width = win.dataset.restoreWidth;
      win.style.height = win.dataset.restoreHeight;
    }
    windowStates[appId] = 'normal';
  } else {
    // Save current position
    win.dataset.restoreLeft = win.style.left;
    win.dataset.restoreTop = win.style.top;
    win.dataset.restoreWidth = win.style.width;
    win.dataset.restoreHeight = win.style.height;
    
    win.classList.add('maximized');
    windowStates[appId] = 'maximized';
  }
}

function bringToFront(appId) {
  windowZIndex++;
  const win = document.getElementById(`window-${appId}`);
  if (win) {
    win.style.zIndex = windowZIndex;
  }
  activeWindow = appId;
  updateAllTitleBars();
  updateAllTaskbarItems();
}

function updateAllTitleBars() {
  document.querySelectorAll('.app-window').forEach(win => {
    const id = win.id.replace('window-', '');
    const titleBar = win.querySelector('.title-bar');
    if (titleBar) {
      if (id === activeWindow) {
        titleBar.classList.remove('inactive');
      } else {
        titleBar.classList.add('inactive');
      }
    }
  });
}

// ==================== TASKBAR ITEMS ====================
const appNames = {
  mycomputer: 'Arbeitsplatz',
  notepad: 'Editor',
  msdos: 'MS-DOS',
  minesweeper: 'Minesweeper',
  recyclebin: 'Papierkorb',
  network: 'Netzwerkverbindung',
  run: 'Ausführen',
  calculator: 'Rechner',
  iexplore: 'Internet Explorer'
};

const appIcons = {
  mycomputer: 'icon-mycomputer-sm',
  notepad: 'icon-notepad-sm',
  msdos: 'icon-msdos-sm',
  minesweeper: 'icon-minesweeper-sm',
  recyclebin: 'icon-recyclebin-sm',
  network: 'icon-network-sm',
  run: 'icon-run',
  calculator: 'icon-calculator-sm',
  iexplore: 'icon-ie-sm'
};

function addTaskbarItem(appId) {
  const container = document.getElementById('taskbar-items');
  const existing = document.getElementById(`taskbar-${appId}`);
  if (existing) return;
  
  const item = document.createElement('button');
  item.className = 'taskbar-item active';
  item.id = `taskbar-${appId}`;
  item.onclick = () => toggleWindowFromTaskbar(appId);
  
  const icon = document.createElement('span');
  icon.className = `taskbar-icon ${appIcons[appId] || ''}`;
  item.appendChild(icon);
  
  const text = document.createTextNode(appNames[appId] || appId);
  item.appendChild(text);
  
  container.appendChild(item);
}

function removeTaskbarItem(appId) {
  const item = document.getElementById(`taskbar-${appId}`);
  if (item) item.remove();
}

function updateTaskbarItem(appId, isActive) {
  const item = document.getElementById(`taskbar-${appId}`);
  if (item) {
    if (isActive) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  }
}

function updateAllTaskbarItems() {
  Object.keys(openWindows).forEach(id => {
    updateTaskbarItem(id, id === activeWindow && windowStates[id] !== 'minimized');
  });
}

function toggleWindowFromTaskbar(appId) {
  if (windowStates[appId] === 'minimized') {
    // Restore
    const win = document.getElementById(`window-${appId}`);
    win.style.display = 'flex';
    windowStates[appId] = 'normal';
    bringToFront(appId);
  } else if (activeWindow === appId) {
    // Minimize
    minimizeWindow(appId);
  } else {
    // Bring to front
    bringToFront(appId);
  }
}

// ==================== WINDOW DRAGGING ====================
function initWindowDragging() {
  document.addEventListener('mousedown', (e) => {
    const titleBar = e.target.closest('.title-bar');
    if (!titleBar || e.target.closest('.title-bar-controls')) return;
    
    const win = titleBar.closest('.app-window');
    if (!win || win.classList.contains('maximized')) return;
    
    const appId = win.id.replace('window-', '');
    bringToFront(appId);
    
    const rect = win.getBoundingClientRect();
    dragState = {
      win: win,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top
    };
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (dragState) {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      dragState.win.style.left = (dragState.origLeft + dx) + 'px';
      dragState.win.style.top = (dragState.origTop + dy) + 'px';
    }
    if (resizeState) {
      handleResize(e);
    }
  });
  
  document.addEventListener('mouseup', () => {
    dragState = null;
    resizeState = null;
  });
}

// ==================== WINDOW RESIZING ====================
function addResizeHandles() {
  document.querySelectorAll('.app-window').forEach(win => {
    const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    directions.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${dir}`;
      handle.dataset.direction = dir;
      win.appendChild(handle);
    });
  });
}

function initWindowResizing() {
  document.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.resize-handle');
    if (!handle) return;
    
    const win = handle.closest('.app-window');
    if (!win || win.classList.contains('maximized')) return;
    
    const rect = win.getBoundingClientRect();
    resizeState = {
      win: win,
      direction: handle.dataset.direction,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      origWidth: rect.width,
      origHeight: rect.height
    };
    
    e.preventDefault();
  });
}

function handleResize(e) {
  if (!resizeState) return;
  
  const { win, direction, startX, startY, origLeft, origTop, origWidth, origHeight } = resizeState;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  
  let newLeft = origLeft;
  let newTop = origTop;
  let newWidth = origWidth;
  let newHeight = origHeight;
  
  if (direction.includes('e')) newWidth = Math.max(200, origWidth + dx);
  if (direction.includes('w')) { newWidth = Math.max(200, origWidth - dx); newLeft = origLeft + dx; }
  if (direction.includes('s')) newHeight = Math.max(100, origHeight + dy);
  if (direction.includes('n')) { newHeight = Math.max(100, origHeight - dy); newTop = origTop + dy; }
  
  win.style.left = newLeft + 'px';
  win.style.top = newTop + 'px';
  win.style.width = newWidth + 'px';
  win.style.height = newHeight + 'px';
}

// ==================== NETWORK INFO ====================
function fetchNetworkInfo() {
  document.getElementById('network-useragent').value = navigator.userAgent;
  document.getElementById('network-ip').value = 'Wird geladen...';
  
  // Random packet counts for realism
  document.getElementById('net-sent').textContent = Math.floor(Math.random() * 5000 + 1000) + ' Pakete';
  document.getElementById('net-recv').textContent = Math.floor(Math.random() * 8000 + 2000) + ' Pakete';
  
  fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => {
      document.getElementById('network-ip').value = data.ip;
    })
    .catch(() => {
      document.getElementById('network-ip').value = 'Nicht verfügbar';
    });
}

// ==================== MS-DOS EMULATOR ====================
function initDosEmulator() {
  // Will be initialized when window opens
}

function initDosSession() {
  const output = document.getElementById('dos-output');
  const input = document.getElementById('dos-input');
  
  if (!output.dataset.initialized) {
    output.dataset.initialized = 'true';
    output.innerHTML = '';
    dosAppendOutput('Microsoft(R) Windows 98\n   (C)Copyright Microsoft Corp 1981-1998.\n\n');
    dosCurrentDir = 'C:\\WINDOWS';
    updateDosPrompt();
  }
  
  input.focus();
  
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value;
      dosHistory.push(cmd);
      dosHistoryIndex = dosHistory.length;
      dosAppendOutput(document.getElementById('dos-prompt').textContent + cmd + '\n');
      input.value = '';
      executeDosCommand(cmd.trim());
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (dosHistoryIndex > 0) {
        dosHistoryIndex--;
        input.value = dosHistory[dosHistoryIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (dosHistoryIndex < dosHistory.length - 1) {
        dosHistoryIndex++;
        input.value = dosHistory[dosHistoryIndex];
      } else {
        dosHistoryIndex = dosHistory.length;
        input.value = '';
      }
    }
  };
}

function focusDosInput() {
  document.getElementById('dos-input').focus();
}

function updateDosPrompt() {
  document.getElementById('dos-prompt').textContent = dosCurrentDir + '>';
}

function dosAppendOutput(text) {
  const output = document.getElementById('dos-output');
  output.textContent += text;
  const body = output.closest('.dos-body');
  if (body) body.scrollTop = body.scrollHeight;
}

function resolvePath(path) {
  let parts;
  if (path.includes(':')) {
    parts = path.toUpperCase().split('\\').filter(p => p);
  } else if (path.startsWith('\\')) {
    const drive = dosCurrentDir.split('\\')[0];
    parts = [drive, ...path.split('\\').filter(p => p)].map(p => p.toUpperCase());
  } else {
    const currentParts = dosCurrentDir.split('\\').filter(p => p);
    const newParts = path.split('\\').filter(p => p).map(p => p.toUpperCase());
    parts = [...currentParts];
    newParts.forEach(p => {
      if (p === '..') {
        if (parts.length > 1) parts.pop();
      } else if (p !== '.') {
        parts.push(p);
      }
    });
  }
  return parts;
}

function getNode(parts) {
  let node = dosFileSystem;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i].replace(':', '');
    const lookupKey = i === 0 ? parts[i] : key;
    if (i === 0) {
      node = node[lookupKey];
    } else {
      if (!node || !node.children) return null;
      node = node.children[lookupKey];
    }
    if (!node) return null;
  }
  return node;
}

function executeDosCommand(cmdLine) {
  if (!cmdLine) return;
  
  const parts = cmdLine.split(/\s+/);
  const cmd = parts[0].toUpperCase();
  const args = parts.slice(1).join(' ');
  
  switch (cmd) {
    case 'DIR': {
      const targetPath = args ? resolvePath(args) : dosCurrentDir.split('\\').filter(p => p);
      const node = getNode(targetPath);
      if (!node || node.type !== 'dir') {
        dosAppendOutput('Datei nicht gefunden.\n\n');
        break;
      }
      const dirPath = targetPath.join('\\');
      dosAppendOutput(` Datenträger in Laufwerk ${targetPath[0]} hat keine Bezeichnung.\n`);
      dosAppendOutput(` Verzeichnis von ${dirPath}\n\n`);
      
      let fileCount = 0;
      let dirCount = 0;
      let totalSize = 0;
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getFullYear()).slice(2)}`;
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      
      if (targetPath.length > 1) {
        dosAppendOutput(`.              <DIR>        ${dateStr}  ${timeStr}\n`);
        dosAppendOutput(`..             <DIR>        ${dateStr}  ${timeStr}\n`);
        dirCount += 2;
      }
      
      Object.entries(node.children).forEach(([name, child]) => {
        if (child.type === 'dir') {
          const paddedName = name.padEnd(15);
          dosAppendOutput(`${paddedName}<DIR>        ${dateStr}  ${timeStr}\n`);
          dirCount++;
        } else {
          const paddedName = name.padEnd(15);
          const sizeStr = String(child.size || 0).padStart(10);
          dosAppendOutput(`${paddedName}${sizeStr} ${dateStr}  ${timeStr}\n`);
          fileCount++;
          totalSize += (child.size || 0);
        }
      });
      
      dosAppendOutput(`     ${fileCount} Datei(en)    ${totalSize.toLocaleString('de-DE')} Bytes\n`);
      dosAppendOutput(`     ${dirCount} Verzeichnis(se)   524.288.000 Bytes frei\n\n`);
      break;
    }
    
    case 'CD':
    case 'CHDIR': {
      if (!args) {
        dosAppendOutput(dosCurrentDir + '\n');
        break;
      }
      if (args === '\\' || args === '/') {
        dosCurrentDir = dosCurrentDir.split('\\')[0] + '\\';
        updateDosPrompt();
        break;
      }
      const newParts = resolvePath(args);
      const node = getNode(newParts);
      if (node && node.type === 'dir') {
        dosCurrentDir = newParts.join('\\');
        updateDosPrompt();
      } else {
        dosAppendOutput('Das angegebene Verzeichnis ist ungültig.\n\n');
      }
      break;
    }
    
    case 'CLS':
      document.getElementById('dos-output').textContent = '';
      break;
    
    case 'TYPE': {
      if (!args) {
        dosAppendOutput('Erforderlicher Parameter fehlt.\n\n');
        break;
      }
      const fileParts = resolvePath(args);
      const fileNode = getNode(fileParts);
      if (fileNode && fileNode.type === 'file' && fileNode.content) {
        dosAppendOutput(fileNode.content + '\n\n');
      } else if (fileNode && fileNode.type === 'file') {
        dosAppendOutput('Zugriff verweigert.\n\n');
      } else {
        dosAppendOutput('Datei nicht gefunden - ' + args.toUpperCase() + '\n\n');
      }
      break;
    }
    
    case 'ECHO':
      dosAppendOutput((args || '') + '\n');
      break;
    
    case 'DATE':
      dosAppendOutput('Aktuelles Datum: ' + new Date().toLocaleDateString('de-DE') + '\n\n');
      break;
    
    case 'TIME':
      dosAppendOutput('Aktuelle Zeit: ' + new Date().toLocaleTimeString('de-DE') + '\n\n');
      break;
    
    case 'VER':
      dosAppendOutput('\nWindows 98 [Version 4.10.1998]\n\n');
      break;
    
    case 'HELP':
      dosAppendOutput('Verfügbare Befehle:\n\n');
      dosAppendOutput('  DIR        Zeigt eine Liste der Dateien und Unterverzeichnisse an.\n');
      dosAppendOutput('  CD         Wechselt das Verzeichnis.\n');
      dosAppendOutput('  CLS        Löscht den Bildschirminhalt.\n');
      dosAppendOutput('  TYPE       Zeigt den Inhalt einer Textdatei an.\n');
      dosAppendOutput('  ECHO       Zeigt Meldungen an.\n');
      dosAppendOutput('  DATE       Zeigt das Datum an.\n');
      dosAppendOutput('  TIME       Zeigt die Uhrzeit an.\n');
      dosAppendOutput('  VER        Zeigt die Windows-Version an.\n');
      dosAppendOutput('  MKDIR      Erstellt ein Verzeichnis.\n');
      dosAppendOutput('  TREE       Zeigt die Verzeichnisstruktur an.\n');
      dosAppendOutput('  MEM        Zeigt die Speicherbelegung an.\n');
      dosAppendOutput('  COLOR      Ändert die Konsolenfarben.\n');
      dosAppendOutput('  EXIT       Beendet die MS-DOS-Eingabeaufforderung.\n');
      dosAppendOutput('  HELP       Zeigt diese Hilfe an.\n\n');
      break;
    
    case 'MKDIR':
    case 'MD': {
      if (!args) {
        dosAppendOutput('Erforderlicher Parameter fehlt.\n\n');
        break;
      }
      const parentParts = dosCurrentDir.split('\\').filter(p => p);
      const parentNode = getNode(parentParts);
      if (parentNode && parentNode.type === 'dir') {
        const dirName = args.toUpperCase();
        if (parentNode.children[dirName]) {
          dosAppendOutput('Ein Unterverzeichnis oder eine Datei existiert bereits.\n\n');
        } else {
          parentNode.children[dirName] = { type: 'dir', children: {} };
          dosAppendOutput('');
        }
      }
      break;
    }
    
    case 'TREE': {
      const treeParts = dosCurrentDir.split('\\').filter(p => p);
      const treeNode = getNode(treeParts);
      dosAppendOutput('Verzeichnisliste für ' + dosCurrentDir + '\n');
      if (treeNode && treeNode.type === 'dir') {
        printTree(treeNode, '');
      }
      dosAppendOutput('\n');
      break;
    }
    
    case 'MEM':
      dosAppendOutput('\nSpeichertyp       Gesamt     Verwendet    Frei\n');
      dosAppendOutput('----------------  ---------  ----------  ---------\n');
      dosAppendOutput('Konventionell       640 KB       98 KB     542 KB\n');
      dosAppendOutput('Oberer Bereich      155 KB       62 KB      93 KB\n');
      dosAppendOutput('Erweitert (XMS)  64.512 KB   16.384 KB  48.128 KB\n\n');
      dosAppendOutput('Insgesamt Speicher: 65.536 KB\n');
      dosAppendOutput('Insgesamt frei:     48.763 KB\n\n');
      break;
    
    case 'COLOR': {
      const body = document.querySelector('.dos-body');
      if (args.toLowerCase() === 'a' || args === '0a') {
        body.style.color = '#00ff00';
        document.getElementById('dos-input').style.color = '#00ff00';
      } else if (args.toLowerCase() === 'b' || args === '0b') {
        body.style.color = '#00ffff';
        document.getElementById('dos-input').style.color = '#00ffff';
      } else if (args.toLowerCase() === 'c' || args === '0c') {
        body.style.color = '#ff0000';
        document.getElementById('dos-input').style.color = '#ff0000';
      } else if (args.toLowerCase() === 'e' || args === '0e') {
        body.style.color = '#ffff00';
        document.getElementById('dos-input').style.color = '#ffff00';
      } else if (args.toLowerCase() === 'f' || args === '07') {
        body.style.color = '#c0c0c0';
        document.getElementById('dos-input').style.color = '#c0c0c0';
      } else {
        body.style.color = '#c0c0c0';
        document.getElementById('dos-input').style.color = '#c0c0c0';
      }
      break;
    }
    
    case 'EXIT':
      closeWindow('msdos');
      // Reset DOS state
      document.getElementById('dos-output').dataset.initialized = '';
      document.getElementById('dos-output').textContent = '';
      const dosBody = document.querySelector('.dos-body');
      if (dosBody) {
        dosBody.style.color = '#c0c0c0';
        document.getElementById('dos-input').style.color = '#c0c0c0';
      }
      break;
    
    default:
      dosAppendOutput(`Befehl oder Dateiname nicht gefunden: ${cmd}\n\n`);
  }
}

function printTree(node, prefix) {
  const entries = Object.entries(node.children).filter(([, v]) => v.type === 'dir');
  entries.forEach(([name, child], i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└───' : '├───';
    dosAppendOutput(prefix + connector + name + '\n');
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    printTree(child, newPrefix);
  });
}

// ==================== NOTEPAD ====================
let notepadFileName = 'Unbenannt';
let notepadModified = false;

function initNotepad() {
  const textarea = document.getElementById('notepad-textarea');
  if (textarea) {
    textarea.addEventListener('input', () => {
      notepadModified = true;
      updateNotepadTitle();
      updateNotepadStatus();
    });
    textarea.addEventListener('click', updateNotepadStatus);
    textarea.addEventListener('keyup', updateNotepadStatus);
  }
}

function updateNotepadTitle() {
  const titleText = document.querySelector('#window-notepad .title-bar-text');
  if (titleText) {
    const icon = '<span class="title-icon icon-notepad-sm"></span>';
    titleText.innerHTML = `${icon} ${notepadFileName}${notepadModified ? '*' : ''} - Editor`;
  }
}

function updateNotepadStatus() {
  const textarea = document.getElementById('notepad-textarea');
  const status = document.getElementById('notepad-status');
  if (!textarea || !status) return;
  
  const text = textarea.value.substring(0, textarea.selectionStart);
  const lines = text.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  status.textContent = `Zeile ${line}, Spalte ${col}`;
}

function notepadNew() {
  if (notepadModified) {
    if (!confirm(`Soll der Text in ${notepadFileName} gespeichert werden?`)) {
      // Don't save
    }
  }
  document.getElementById('notepad-textarea').value = '';
  notepadFileName = 'Unbenannt';
  notepadModified = false;
  updateNotepadTitle();
  updateNotepadStatus();
}

function notepadOpen() {
  // Simulate file open dialog
  const files = ['BRIEF.TXT', 'NOTIZEN.TXT', 'AUTOEXEC.BAT', 'CONFIG.SYS'];
  const choice = prompt('Datei öffnen:\n\nVerfügbare Dateien:\n' + files.join('\n') + '\n\nDateiname eingeben:');
  if (!choice) return;
  
  const fileName = choice.toUpperCase();
  // Search in filesystem
  const content = findFileContent(dosFileSystem['C:'], fileName);
  if (content !== null) {
    document.getElementById('notepad-textarea').value = content;
    notepadFileName = fileName;
    notepadModified = false;
    updateNotepadTitle();
    updateNotepadStatus();
  } else {
    alert(`Die Datei "${choice}" wurde nicht gefunden.`);
  }
}

function findFileContent(node, fileName) {
  if (!node || !node.children) return null;
  for (const [name, child] of Object.entries(node.children)) {
    if (name === fileName && child.type === 'file' && child.content) {
      return child.content;
    }
    if (child.type === 'dir') {
      const result = findFileContent(child, fileName);
      if (result !== null) return result;
    }
  }
  return null;
}

function notepadSave() {
  if (notepadFileName === 'Unbenannt') {
    notepadSaveAs();
    return;
  }
  notepadModified = false;
  updateNotepadTitle();
  alert(`${notepadFileName} wurde gespeichert.`);
}

function notepadSaveAs() {
  const name = prompt('Speichern unter:', notepadFileName);
  if (name) {
    notepadFileName = name.toUpperCase();
    notepadModified = false;
    updateNotepadTitle();
    
    // Save to virtual filesystem
    const currentParts = dosCurrentDir.split('\\').filter(p => p);
    const dirNode = getNode(currentParts);
    if (dirNode && dirNode.type === 'dir') {
      dirNode.children[notepadFileName] = {
        type: 'file',
        size: document.getElementById('notepad-textarea').value.length,
        content: document.getElementById('notepad-textarea').value
      };
    }
    
    alert(`${notepadFileName} wurde gespeichert.`);
  }
}

function notepadUndo() {
  document.execCommand('undo');
}

function notepadCut() {
  const ta = document.getElementById('notepad-textarea');
  const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
  navigator.clipboard.writeText(selected).catch(() => {});
  const start = ta.selectionStart;
  ta.value = ta.value.substring(0, ta.selectionStart) + ta.value.substring(ta.selectionEnd);
  ta.selectionStart = ta.selectionEnd = start;
  notepadModified = true;
  updateNotepadTitle();
}

function notepadCopy() {
  const ta = document.getElementById('notepad-textarea');
  const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
  navigator.clipboard.writeText(selected).catch(() => {});
}

function notepadPaste() {
  navigator.clipboard.readText().then(text => {
    const ta = document.getElementById('notepad-textarea');
    const start = ta.selectionStart;
    ta.value = ta.value.substring(0, ta.selectionStart) + text + ta.value.substring(ta.selectionEnd);
    ta.selectionStart = ta.selectionEnd = start + text.length;
    notepadModified = true;
    updateNotepadTitle();
  }).catch(() => {});
}

function notepadDelete() {
  const ta = document.getElementById('notepad-textarea');
  if (ta.selectionStart !== ta.selectionEnd) {
    const start = ta.selectionStart;
    ta.value = ta.value.substring(0, ta.selectionStart) + ta.value.substring(ta.selectionEnd);
    ta.selectionStart = ta.selectionEnd = start;
    notepadModified = true;
    updateNotepadTitle();
  }
}

function notepadSelectAll() {
  const ta = document.getElementById('notepad-textarea');
  ta.select();
}

function notepadTimeDate() {
  const ta = document.getElementById('notepad-textarea');
  const now = new Date();
  const timeDate = `${now.toLocaleTimeString('de-DE')} ${now.toLocaleDateString('de-DE')}`;
  const start = ta.selectionStart;
  ta.value = ta.value.substring(0, ta.selectionStart) + timeDate + ta.value.substring(ta.selectionEnd);
  ta.selectionStart = ta.selectionEnd = start + timeDate.length;
  notepadModified = true;
  updateNotepadTitle();
}

// ==================== MINESWEEPER ====================
function setMinesweeperDifficulty(level) {
  switch (level) {
    case 'beginner':
      msGame.rows = 9;
      msGame.cols = 9;
      msGame.mines = 10;
      break;
    case 'intermediate':
      msGame.rows = 16;
      msGame.cols = 16;
      msGame.mines = 40;
      break;
    case 'expert':
      msGame.rows = 16;
      msGame.cols = 30;
      msGame.mines = 99;
      break;
  }
  minesweeperNewGame();
}

function minesweeperNewGame() {
  // Clear timer
  if (msGame.timerInterval) {
    clearInterval(msGame.timerInterval);
    msGame.timerInterval = null;
  }
  
  msGame.timer = 0;
  msGame.gameOver = false;
  msGame.gameWon = false;
  msGame.firstClick = true;
  msGame.minesLeft = msGame.mines;
  
  // Initialize board
  msGame.board = Array.from({ length: msGame.rows }, () => Array(msGame.cols).fill(0));
  msGame.revealed = Array.from({ length: msGame.rows }, () => Array(msGame.cols).fill(false));
  msGame.flagged = Array.from({ length: msGame.rows }, () => Array(msGame.cols).fill(false));
  
  // Update display
  document.getElementById('ms-mines-counter').textContent = String(msGame.minesLeft).padStart(3, '0');
  document.getElementById('ms-timer').textContent = '000';
  document.getElementById('ms-face-btn').textContent = '🙂';
  
  renderMinesweeperGrid();
}

function placeMines(excludeRow, excludeCol) {
  let placed = 0;
  while (placed < msGame.mines) {
    const r = Math.floor(Math.random() * msGame.rows);
    const c = Math.floor(Math.random() * msGame.cols);
    // Don't place mine on first click or adjacent cells
    if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
    if (msGame.board[r][c] === -1) continue;
    msGame.board[r][c] = -1;
    placed++;
  }
  
  // Calculate numbers
  for (let r = 0; r < msGame.rows; r++) {
    for (let c = 0; c < msGame.cols; c++) {
      if (msGame.board[r][c] === -1) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < msGame.rows && nc >= 0 && nc < msGame.cols && msGame.board[nr][nc] === -1) {
            count++;
          }
        }
      }
      msGame.board[r][c] = count;
    }
  }
}

function renderMinesweeperGrid() {
  const grid = document.getElementById('minesweeper-grid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${msGame.cols}, 18px)`;
  grid.style.gridTemplateRows = `repeat(${msGame.rows}, 18px)`;
  
  for (let r = 0; r < msGame.rows; r++) {
    for (let c = 0; c < msGame.cols; c++) {
      const cell = document.createElement('button');
      cell.className = 'ms-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      
      cell.addEventListener('mousedown', (e) => {
        if (e.button === 0 && !msGame.gameOver && !msGame.gameWon) {
          document.getElementById('ms-face-btn').textContent = '😮';
        }
      });
      
      cell.addEventListener('mouseup', (e) => {
        if (!msGame.gameOver && !msGame.gameWon) {
          document.getElementById('ms-face-btn').textContent = '🙂';
        }
      });
      
      cell.addEventListener('click', () => msRevealCell(r, c));
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        msToggleFlag(r, c);
      });
      
      grid.appendChild(cell);
    }
  }
}

function msRevealCell(r, c) {
  if (msGame.gameOver || msGame.gameWon) return;
  if (msGame.flagged[r][c]) return;
  if (msGame.revealed[r][c]) return;
  
  if (msGame.firstClick) {
    msGame.firstClick = false;
    placeMines(r, c);
    msGame.timerInterval = setInterval(() => {
      msGame.timer++;
      if (msGame.timer > 999) msGame.timer = 999;
      document.getElementById('ms-timer').textContent = String(msGame.timer).padStart(3, '0');
    }, 1000);
  }
  
  if (msGame.board[r][c] === -1) {
    // Hit a mine!
    msGame.gameOver = true;
    clearInterval(msGame.timerInterval);
    document.getElementById('ms-face-btn').textContent = '😵';
    revealAllMines(r, c);
    return;
  }
  
  // Flood fill for empty cells
  floodReveal(r, c);
  
  // Check win
  checkMinesweeperWin();
}

function floodReveal(r, c) {
  if (r < 0 || r >= msGame.rows || c < 0 || c >= msGame.cols) return;
  if (msGame.revealed[r][c] || msGame.flagged[r][c]) return;
  if (msGame.board[r][c] === -1) return;
  
  msGame.revealed[r][c] = true;
  updateCellDisplay(r, c);
  
  if (msGame.board[r][c] === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        floodReveal(r + dr, c + dc);
      }
    }
  }
}

function msToggleFlag(r, c) {
  if (msGame.gameOver || msGame.gameWon) return;
  if (msGame.revealed[r][c]) return;
  
  msGame.flagged[r][c] = !msGame.flagged[r][c];
  msGame.minesLeft += msGame.flagged[r][c] ? -1 : 1;
  
  const cell = getCellElement(r, c);
  if (msGame.flagged[r][c]) {
    cell.classList.add('flagged');
  } else {
    cell.classList.remove('flagged');
  }
  
  document.getElementById('ms-mines-counter').textContent = String(Math.max(0, msGame.minesLeft)).padStart(3, '0');
}

function updateCellDisplay(r, c) {
  const cell = getCellElement(r, c);
  if (!cell) return;
  
  cell.classList.add('revealed');
  
  const value = msGame.board[r][c];
  if (value > 0) {
    const span = document.createElement('span');
    span.className = `ms-${value}`;
    span.textContent = value;
    cell.appendChild(span);
  }
}

function getCellElement(r, c) {
  const grid = document.getElementById('minesweeper-grid');
  return grid.children[r * msGame.cols + c];
}

function revealAllMines(hitR, hitC) {
  for (let r = 0; r < msGame.rows; r++) {
    for (let c = 0; c < msGame.cols; c++) {
      const cell = getCellElement(r, c);
      if (msGame.board[r][c] === -1) {
        cell.classList.add('revealed');
        if (r === hitR && c === hitC) {
          cell.classList.add('mine-exploded');
        }
        if (!msGame.flagged[r][c]) {
          cell.textContent = '💣';
          cell.style.fontSize = '12px';
        }
      } else if (msGame.flagged[r][c]) {
        // Wrong flag
        cell.classList.add('revealed');
        cell.textContent = '❌';
        cell.style.fontSize = '12px';
      }
    }
  }
}

function checkMinesweeperWin() {
  let unrevealedSafe = 0;
  for (let r = 0; r < msGame.rows; r++) {
    for (let c = 0; c < msGame.cols; c++) {
      if (!msGame.revealed[r][c] && msGame.board[r][c] !== -1) {
        unrevealedSafe++;
      }
    }
  }
  
  if (unrevealedSafe === 0) {
    msGame.gameWon = true;
    clearInterval(msGame.timerInterval);
    document.getElementById('ms-face-btn').textContent = '😎';
    
    // Flag all remaining mines
    for (let r = 0; r < msGame.rows; r++) {
      for (let c = 0; c < msGame.cols; c++) {
        if (msGame.board[r][c] === -1 && !msGame.flagged[r][c]) {
          msGame.flagged[r][c] = true;
          getCellElement(r, c).classList.add('flagged');
        }
      }
    }
    document.getElementById('ms-mines-counter').textContent = '000';
  }
}

// ==================== RUN DIALOG ====================
function showRunDialog() {
  openWindow('run');
  document.getElementById('run-input').value = '';
  setTimeout(() => document.getElementById('run-input').focus(), 100);
}

function executeRun() {
  const input = document.getElementById('run-input').value.trim().toLowerCase();
  closeWindow('run');
  
  switch (input) {
    case 'notepad':
    case 'notepad.exe':
      openWindow('notepad');
      break;
    case 'cmd':
    case 'command':
    case 'command.com':
      openWindow('msdos');
      break;
    case 'explorer':
    case 'explorer.exe':
      openWindow('mycomputer');
      break;
    case 'minesweeper':
    case 'winmine':
    case 'winmine.exe':
      openWindow('minesweeper');
      break;
    case 'calc':
    case 'calc.exe':
      openWindow('calculator');
      break;
    case 'iexplore':
    case 'iexplore.exe':
    case 'internet':
      openWindow('iexplore');
      break;
    default:
      if (input) {
        showWin98Error('Ausf\u00fchren', `Windows kann die Datei "${input}" nicht finden. Stellen Sie sicher, dass Sie den Namen richtig eingegeben haben, und wiederholen Sie den Vorgang.`, 'critical');
      }
  }
}

// Enter key in run dialog
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const runWin = document.getElementById('window-run');
    if (runWin && runWin.style.display !== 'none' && document.activeElement === document.getElementById('run-input')) {
      executeRun();
    }
  }
});

// ==================== SHUTDOWN ====================
function showShutdownDialog() {
  document.getElementById('shutdown-overlay').style.display = 'flex';
}

function doShutdown() {
  const select = document.getElementById('shutdown-select');
  const choice = select.value;
  document.getElementById('shutdown-overlay').style.display = 'none';
  
  if (choice === 'Herunterfahren') {
    // Show shutdown screen
    let screen = document.getElementById('shutdown-screen');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'shutdown-screen';
      screen.innerHTML = '<p>Windows wird heruntergefahren...</p>';
      document.body.appendChild(screen);
    }
    screen.classList.add('active');
    screen.style.display = 'flex';
    screen.style.position = 'fixed';
    screen.style.top = '0';
    screen.style.left = '0';
    screen.style.right = '0';
    screen.style.bottom = '0';
    screen.style.background = '#000';
    screen.style.zIndex = '999999';
    screen.style.justifyContent = 'center';
    screen.style.alignItems = 'center';
    
    setTimeout(() => {
      screen.innerHTML = '<p style="color: #ff8c00; font-size: 24px; font-family: Arial, sans-serif;">Sie können den Computer jetzt ausschalten.</p>';
    }, 2000);
    
    // Click to restart
    screen.onclick = () => {
      screen.style.display = 'none';
      location.reload();
    };
  } else if (choice === 'Neu starten' || choice === 'Neu starten im MS-DOS-Modus') {
    location.reload();
  }
}

// ==================== NETWORK TAB SWITCHING ====================
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[role="tab"]');
  if (!tab) return;
  
  const tablist = tab.closest('[role="tablist"]');
  if (!tablist) return;
  
  tablist.querySelectorAll('[role="tab"]').forEach(t => t.setAttribute('aria-selected', 'false'));
  tab.setAttribute('aria-selected', 'true');
});

// ==================== WINDOW CLICK TO FOCUS ====================
document.addEventListener('mousedown', (e) => {
  const win = e.target.closest('.app-window');
  if (win) {
    const appId = win.id.replace('window-', '');
    if (appId !== activeWindow) {
      bringToFront(appId);
    }
  }
});

// ==================== WIN98 ERROR DIALOG ====================
const errorMessages = [
  'Diese Aktion kann nicht ausgeführt werden, da die Datei von einem anderen Programm verwendet wird.',
  'Es ist nicht genügend Speicher vorhanden, um diesen Vorgang abzuschließen.\nSchließen Sie einige Programme, und versuchen Sie es erneut.',
  'Windows kann die angegebene Datei nicht finden. Stellen Sie sicher, dass Pfad und Dateiname richtig angegeben sind.',
  'Auf das angegebene Gerät bzw. den Pfad oder die Datei kann nicht zugegriffen werden.\nSie verfügen eventuell nicht über ausreichende Berechtigungen.',
  'Die Anwendung konnte nicht ordnungsgemäß gestartet werden (0xc0000142).\nKlicken Sie auf "OK", um die Anwendung zu schließen.',
  'Eine unbekannte Ausnahme ist aufgetreten.\nBitte starten Sie den Computer neu.',
  'Das Programm hat einen ungültigen Vorgang ausgeführt und wird geschlossen.\nWenn das Problem weiterhin besteht, wenden Sie sich an den Programmhersteller.',
  'Nicht genügend Systemressourcen vorhanden, um den angeforderten Dienst auszuführen.',
  'Ein Gerätetreiber für dieses Gerät wurde nicht installiert. (Code 28)',
  'Die Datei oder das Verzeichnis ist beschädigt und nicht lesbar.',
  'Schwerwiegender Fehler in der Anwendung.\nDie Ausnahme "Allgemeine Schutzverletzung" ist in Modul KERNEL32.DLL aufgetreten.',
  'Die Prozedur-Einsprungstelle konnte in der Dynamic Link Library nicht gefunden werden.',
  'Fehler beim Laden der DLL.\nDie angegebene Datei wurde nicht gefunden.'
];

const bsodMessages = [
  {
    error: 'ALLGEMEINE_SCHUTZVERLETZUNG',
    detail: 'Ein Fehler ist aufgetreten in VXD VMM(01) + 00010E36. Der aktuelle\nAnwendungsthread wird beendet.\n\n*  Drücken Sie eine beliebige Taste, um die aktuelle Anwendung zu beenden.\n*  Drücken Sie STRG+ALT+ENTF, um den Computer neu zu starten.\n   Alle nicht gespeicherten Daten in allen Anwendungen gehen verloren.\n\nEs wird empfohlen, dass Sie STRG+ALT+ENTF drücken, um den Computer\nneu zu starten.'
  },
  {
    error: 'FATALER_AUSNAHMEFEHLER_0E',
    detail: 'Ein fataler Ausnahmefehler 0E ist aufgetreten an 0028:C0034B03\nin VXD VWIN32(01) + 00010E36. Der aktuelle Anwendungsthread wird beendet.\n\n*  Drücken Sie eine beliebige Taste, um die aktuelle Anwendung zu beenden.\n*  Drücken Sie STRG+ALT+ENTF, um den Computer neu zu starten.\n   Alle nicht gespeicherten Daten in allen Anwendungen gehen verloren.'
  },
  {
    error: 'KERNEL_STACK_INPAGE_ERROR',
    detail: 'Ein Fehler ist aufgetreten beim Lesen der Kernel-Stapelseiten\nvon der Auslagerungsdatei. Die Auslagerungsdatei hat möglicherweise\neinen fehlerhaften Sektor.\n\n*  Drücken Sie eine beliebige Taste, um die aktuelle Anwendung zu beenden.\n*  Drücken Sie STRG+ALT+ENTF, um den Computer neu zu starten.'
  },
  {
    error: 'SEITENFEHLER_IN_NICHT_AUSGELAGERTEM_BEREICH',
    detail: 'Ein Seitenfehler ist aufgetreten in einem nicht ausgelagerten\nBereich von EXPLORER.EXE an Adresse 0028:C001D3A0.\n\n*  Drücken Sie eine beliebige Taste, um die aktuelle Anwendung zu beenden.\n*  Drücken Sie STRG+ALT+ENTF, um den Computer neu zu starten.\n   Alle nicht gespeicherten Daten in allen Anwendungen gehen verloren.'
  },
  {
    error: 'IRQL_NOT_LESS_OR_EQUAL',
    detail: 'Ein Gerätetreiber hat versucht, auf eine ungültige Speicheradresse\nzuzugreifen. Der Fehler trat in NDIS.VXD auf.\n\n*  Drücken Sie eine beliebige Taste, um die aktuelle Anwendung zu beenden.\n*  Drücken Sie STRG+ALT+ENTF, um den Computer neu zu starten.'
  },
  {
    error: 'AUSNAHME_BEI_SYSTEMDIENST',
    detail: 'Windows hat einen Fehler in einem Systemdienst festgestellt.\nDer Fehler trat in WIN32K.SYS auf.\n\nAdresse: 0x80014C2A\nBasis: 0x80010000\nDatum: 17.02.2026\n\n*  Drücken Sie eine beliebige Taste, um die aktuelle Anwendung zu beenden.\n*  Drücken Sie STRG+ALT+ENTF, um den Computer neu zu starten.'
  }
];

function showWin98Error(title, message, type = 'critical') {
  const overlay = document.getElementById('error-overlay');
  const titleEl = document.getElementById('error-title');
  const messageEl = document.getElementById('error-message');
  const iconContainer = document.getElementById('error-icon-container');
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  
  // Set icon based on type
  if (type === 'critical') {
    iconContainer.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#ff0000" stroke="#800000" stroke-width="1"/><rect x="8" y="14" width="16" height="4" fill="#fff" rx="1"/><text x="16" y="20" text-anchor="middle" fill="#fff" font-family="Arial" font-size="20" font-weight="bold">×</text></svg>';
  } else if (type === 'warning') {
    iconContainer.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32"><polygon points="16,2 30,28 2,28" fill="#ffff00" stroke="#000" stroke-width="1"/><text x="16" y="25" text-anchor="middle" fill="#000" font-family="Arial" font-size="20" font-weight="bold">!</text></svg>';
  } else {
    iconContainer.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#0058a8" stroke="#003c75" stroke-width="1"/><text x="16" y="23" text-anchor="middle" fill="#fff" font-family="serif" font-size="22" font-weight="bold" font-style="italic">i</text></svg>';
  }
  
  overlay.style.display = 'flex';
  
  // Play error sound effect (visual flash instead)
  overlay.querySelector('#error-dialog').style.animation = 'none';
  overlay.querySelector('#error-dialog').offsetHeight; // trigger reflow
  overlay.querySelector('#error-dialog').style.animation = 'errorShake 0.15s ease-in-out';
}

function closeErrorDialog() {
  document.getElementById('error-overlay').style.display = 'none';
}

// ==================== BSOD (Blue Screen of Death) ====================
function showBSOD(moduleName) {
  const bsod = document.getElementById('bsod-screen');
  const textEl = document.getElementById('bsod-text');
  
  // Pick a random BSOD message
  const msg = bsodMessages[Math.floor(Math.random() * bsodMessages.length)];
  
  // Build BSOD text with the module name
  let bsodText = `Es ist ein Fehler aufgetreten. Um den Computer zu schützen,\nwurde Windows angehalten.\n\n`;
  bsodText += `${msg.error}\n\n`;
  bsodText += msg.detail.replace('EXPLORER.EXE', moduleName || 'EXPLORER.EXE');
  
  textEl.textContent = bsodText;
  bsod.style.display = 'flex';
  
  // Listen for any key or click to dismiss
  const dismissBSOD = (e) => {
    bsod.style.display = 'none';
    document.removeEventListener('keydown', dismissBSOD);
    document.removeEventListener('click', dismissBSOD);
  };
  
  // Small delay so the click that triggered BSOD doesn't immediately dismiss it
  setTimeout(() => {
    document.addEventListener('keydown', dismissBSOD);
    document.addEventListener('click', dismissBSOD);
  }, 500);
}

// ==================== TRIGGER ERROR OR BSOD ====================
// ~15% chance of BSOD, otherwise shows a standard error dialog
function triggerErrorOrBSOD(appName, moduleName) {
  const rand = Math.random();
  
  if (rand < 0.15) {
    // BSOD!
    showBSOD(moduleName);
  } else {
    // Standard Windows 98 error
    const randomMsg = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    const types = ['critical', 'warning', 'critical', 'critical']; // weighted towards critical
    const type = types[Math.floor(Math.random() * types.length)];
    showWin98Error(appName, randomMsg, type);
  }
}

// ==================== DRIVE C: ====================
function openDriveC() {
  // Try to open the local file system - browsers block file:// for security
  // So we show the virtual filesystem content in a nice explorer view
  try {
    const newWin = window.open('file:///C:/', '_blank');
    // If popup was blocked or returned null, show virtual FS
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      showVirtualDriveC();
    }
  } catch (e) {
    showVirtualDriveC();
  }
  
  // Always also show virtual FS after a short delay (in case popup was blocked silently)
  setTimeout(() => {
    const win = document.getElementById('window-mycomputer');
    const body = win.querySelector('.window-body');
    const statusField = win.querySelector('.status-bar .status-bar-field');
    
    // Check if we're already showing virtual FS
    if (body.querySelector('.explorer-breadcrumb')) return;
    
    showVirtualDriveC();
  }, 300);
}

function showVirtualDriveC() {
  const win = document.getElementById('window-mycomputer');
  const body = win.querySelector('.window-body');
  const titleText = win.querySelector('.title-bar-text');
  const statusFields = win.querySelectorAll('.status-bar .status-bar-field');
  
  // Get C: drive contents from virtual filesystem
  const cDrive = dosFileSystem['C:'];
  const entries = Object.entries(cDrive.children);
  
  // Update title
  titleText.innerHTML = '<span class="title-icon icon-mycomputer-sm"></span> (C:)';
  
  // Build explorer view
  let html = '<div class="explorer-breadcrumb">';
  html += '<button class="explorer-back-btn" onclick="showMyComputerRoot()" title="Zurück">← Zurück</button>';
  html += '<span class="explorer-path">C:\\</span>';
  html += '</div>';
  html += '<div class="mycomputer-content">';
  
  let fileCount = 0;
  let dirCount = 0;
  
  entries.forEach(([name, node]) => {
    if (node.type === 'dir') {
      dirCount++;
      html += `<div class="explorer-icon" ondblclick="browseVirtualDir('C:', '${name}')">`;
      html += '<div class="icon-img icon-folder"></div>';
      html += `<span>${name}</span>`;
      html += '</div>';
    } else {
      fileCount++;
      html += `<div class="explorer-icon" ondblclick="openVirtualFile('${name}')">`;
      html += '<div class="icon-img icon-file"></div>';
      html += `<span>${name}</span>`;
      html += '</div>';
    }
  });
  
  html += '</div>';
  body.innerHTML = html;
  
  // Update status bar
  if (statusFields[0]) statusFields[0].textContent = `${fileCount + dirCount} Objekt(e)`;
  if (statusFields[1]) statusFields[1].textContent = 'C:\\';
}

function showMyComputerRoot() {
  const win = document.getElementById('window-mycomputer');
  const body = win.querySelector('.window-body');
  const titleText = win.querySelector('.title-bar-text');
  const statusFields = win.querySelectorAll('.status-bar .status-bar-field');
  
  titleText.innerHTML = '<span class="title-icon icon-mycomputer-sm"></span> Arbeitsplatz';
  
  body.innerHTML = `
    <div class="mycomputer-content">
      <div class="explorer-icon" ondblclick="openDriveC()">
        <div class="icon-img icon-drive-c"></div>
        <span>(C:)</span>
      </div>
      <div class="explorer-icon" ondblclick="showWin98Error('Laufwerk D:\\\\', 'Auf D:\\\\ kann nicht zugegriffen werden.\\nDas Gerät ist nicht bereit.', 'critical')">
        <div class="icon-img icon-drive-cd"></div>
        <span>(D:) CD-ROM</span>
      </div>
      <div class="explorer-icon" ondblclick="triggerErrorOrBSOD('Systemsteuerung', 'SYSTEMSTEUERUNG.CPL')">
        <div class="icon-img icon-control-panel"></div>
        <span>Systemsteuerung</span>
      </div>
      <div class="explorer-icon" ondblclick="triggerErrorOrBSOD('Drucker', 'DRUCKER')">
        <div class="icon-img icon-printer"></div>
        <span>Drucker</span>
      </div>
      <div class="explorer-icon" ondblclick="triggerErrorOrBSOD('DFÜ-Netzwerk', 'DFUE.EXE')">
        <div class="icon-img icon-dialup"></div>
        <span>DFÜ-Netzwerk</span>
      </div>
    </div>`;
  
  if (statusFields[0]) statusFields[0].textContent = '5 Objekt(e)';
  if (statusFields[1]) statusFields[1].textContent = 'Arbeitsplatz';
}

// Current browse path for virtual filesystem navigation
let currentBrowsePath = [];

function browseVirtualDir(drive, ...pathParts) {
  currentBrowsePath = [drive, ...pathParts];
  
  // Navigate into the virtual filesystem
  let node = dosFileSystem[drive];
  const fullPath = [drive];
  
  for (const part of pathParts) {
    if (node && node.children && node.children[part]) {
      node = node.children[part];
      fullPath.push(part);
    } else {
      showWin98Error('Explorer', `Der Pfad "${fullPath.join('\\')}" wurde nicht gefunden.`, 'critical');
      return;
    }
  }
  
  if (node.type !== 'dir') {
    openVirtualFile(pathParts[pathParts.length - 1]);
    return;
  }
  
  const win = document.getElementById('window-mycomputer');
  const body = win.querySelector('.window-body');
  const titleText = win.querySelector('.title-bar-text');
  const statusFields = win.querySelectorAll('.status-bar .status-bar-field');
  
  const pathStr = fullPath.join('\\');
  titleText.innerHTML = `<span class="title-icon icon-mycomputer-sm"></span> ${pathStr}`;
  
  const entries = Object.entries(node.children);
  
  let html = '<div class="explorer-breadcrumb">';
  html += `<button class="explorer-back-btn" onclick="navigateBack()" title="Zurück">← Zurück</button>`;
  html += `<span class="explorer-path">${pathStr}</span>`;
  html += '</div>';
  html += '<div class="mycomputer-content">';
  
  if (entries.length === 0) {
    html += '<div style="padding: 20px; color: #808080; width: 100%; text-align: center;">Dieser Ordner ist leer.</div>';
  }
  
  let fileCount = 0;
  let dirCount = 0;
  
  entries.forEach(([name, child]) => {
    if (child.type === 'dir') {
      dirCount++;
      const subPath = pathParts.map(p => `'${p}'`).join(', ');
      html += `<div class="explorer-icon" ondblclick="browseVirtualDir('${drive}', ${subPath}, '${name}')">`;
      html += '<div class="icon-img icon-folder"></div>';
      html += `<span>${name}</span>`;
      html += '</div>';
    } else {
      fileCount++;
      const subPath = [...pathParts, name];
      html += `<div class="explorer-icon" ondblclick="openVirtualFileFromPath('${drive}', [${subPath.map(p => `'${p}'`).join(',')}])">`;
      html += '<div class="icon-img icon-file"></div>';
      html += `<span>${name}</span>`;
      html += '</div>';
    }
  });
  
  html += '</div>';
  body.innerHTML = html;
  
  if (statusFields[0]) statusFields[0].textContent = `${fileCount + dirCount} Objekt(e)`;
  if (statusFields[1]) statusFields[1].textContent = pathStr;
}

function navigateBack() {
  if (currentBrowsePath.length <= 1) {
    showMyComputerRoot();
    currentBrowsePath = [];
  } else if (currentBrowsePath.length === 2) {
    showVirtualDriveC();
    currentBrowsePath = ['C:'];
  } else {
    const newPath = currentBrowsePath.slice(0, -1);
    browseVirtualDir(newPath[0], ...newPath.slice(1));
  }
}

function openVirtualFile(fileName) {
  // Search for file content in virtual filesystem
  const content = findFileContent(dosFileSystem['C:'], fileName.toUpperCase());
  if (content !== null) {
    // Open in notepad
    openWindow('notepad');
    document.getElementById('notepad-textarea').value = content;
    notepadFileName = fileName.toUpperCase();
    notepadModified = false;
    updateNotepadTitle();
    updateNotepadStatus();
  } else {
    showWin98Error(fileName, `Die Datei "${fileName}" kann nicht geöffnet werden.\nDer Zugriff wurde verweigert.`, 'critical');
  }
}

function openVirtualFileFromPath(drive, pathParts) {
  let node = dosFileSystem[drive];
  for (const part of pathParts) {
    if (node && node.children && node.children[part]) {
      node = node.children[part];
    } else {
      showWin98Error('Explorer', 'Datei nicht gefunden.', 'critical');
      return;
    }
  }
  
  if (node.type === 'file' && node.content) {
    openWindow('notepad');
    document.getElementById('notepad-textarea').value = node.content;
    notepadFileName = pathParts[pathParts.length - 1];
    notepadModified = false;
    updateNotepadTitle();
    updateNotepadStatus();
  } else {
    showWin98Error(pathParts[pathParts.length - 1], 'Auf diese Datei kann nicht zugegriffen werden.\nDer Zugriff wurde verweigert.', 'critical');
  }
}

// ==================== OPEN README IN NOTEPAD ====================
function openReadmeInNotepad() {
  openWindow('notepad');
  document.getElementById('notepad-textarea').value = 
    'README.TXT - Prompt zur Reproduktion dieser Anwendung\n' +
    '=====================================================\n\n' +
    'Du bist ein Senior Frontend-Entwickler mit einer Leidenschaft für Retro-UI und Pixel-Perfect Design.\n\n' +
    'Kontext: Ich möchte eine Web-Applikation erstellen, die das visuelle Design und das Benutzererlebnis (UX) des Windows 98 Desktops exakt repliziert.\n\n' +
    'Aufgabe: Erstelle eine Single-Page-Application (SPA) mit HTML, CSS (bevorzugt unter Verwendung von 98.css) und Vanilla JavaScript.\n\n' +
    'Funktionale Anforderungen:\n\n' +
    'Desktop-Oberfläche: Ein klassischer petrolfarbener Hintergrund (#008080) mit Desktop-Icons.\n\n' +
    'Startleiste & Menü:\n' +
    'Ein funktionsfähiger "Start"-Button unten links.\n' +
    'Das Startmenü muss sich beim Klicken öffnen und die klassischen Kategorien enthalten: Programme, Favoriten, Dokumente, Einstellungen, Suchen, Hilfe und Ausführen.\n' +
    'Die Menüführung (Hover-Effekte, Untermenüs) soll sich wie im Original verhalten.\n\n' +
    'Taskleiste:\n' +
    'Rechts in der Taskleiste befindet sich eine Echtzeit-Uhr (HH:mm).\n' +
    'Ein interaktives Netzwerk-Icon im System-Tray.\n\n' +
    'Netzwerk-Feature:\n' +
    'Beim Klicken auf das Netzwerk-Icon soll sich ein Windows 98-typisches Dialogfenster öffnen.\n' +
    'In diesem Fenster müssen die öffentliche IP-Adresse des Nutzers (abgerufen über https://api.ipify.org?format=json) und der User-Agent des Browsers (navigator.userAgent) angezeigt werden.\n\n' +
    'Technische Details:\n' +
    'Verwende semantisches HTML für Buttons und Fensterstrukturen.\n' +
    'Stelle sicher, dass die Fenster über die Taskleiste minimiert und wiederhergestellt werden können.\n\n' +
    'Es soll noch ein MS-DOS Emulator, ein Notepad was funktioniert und Minesweeper wie beim Original geben.\n\n' +
    '98.css - A design system for building faithful recreations of old UIs\n\n' +
    'Zusätzliche Anforderungen:\n\n' +
    'Bei Arbeitsplatz wenn man auf C klickt soll sich der Inhalt von dem Standardlaufwerk des User Computers erscheinen, eventuell ein Link auf C:// oder ähnliches.\n' +
    'Wo noch nichts hinterlegt ist, zum Beispiel die Systemsteuerung, soll eine Standard Windows Fehlermeldung aufpoppen. Manchmal könnte aber auch ein klassischer Windows Bluescreen erscheinen.\n' +
    'Bei Dokumente > Readme.txt soll der aktuelle Prompt erscheinen um die Arbeit zu reproduzieren.\n';
  notepadFileName = 'README.TXT';
  notepadModified = false;
  updateNotepadTitle();
  updateNotepadStatus();
}

// ==================== CALCULATOR (calc.exe) ====================
let calcDisplay = '0.';
let calcCurrentValue = 0;
let calcPreviousValue = null;
let calcOperatorPending = null;
let calcNewEntry = true;
let calcMemory = 0;
let calcHasMemory = false;

function calcUpdateDisplay() {
  document.getElementById('calc-display').value = calcDisplay;
  document.getElementById('calc-memory-indicator').textContent = calcHasMemory ? 'M' : '';
}

function calcDigit(d) {
  if (calcNewEntry) {
    calcDisplay = d + '.';
    calcNewEntry = false;
  } else {
    // Remove trailing dot, add digit, add dot back
    let val = calcDisplay;
    if (val.endsWith('.')) {
      val = val.slice(0, -1);
    }
    if (val === '0') {
      val = d;
    } else {
      val = val + d;
    }
    calcDisplay = val + '.';
  }
  calcUpdateDisplay();
}

function calcDecimal() {
  if (calcNewEntry) {
    calcDisplay = '0.';
    calcNewEntry = false;
  }
  // Check if there's already a decimal in the number part
  let val = calcDisplay;
  if (val.endsWith('.')) {
    val = val.slice(0, -1);
  }
  if (!val.includes('.')) {
    calcDisplay = val + '.';
  }
  calcUpdateDisplay();
}

function calcClear() {
  calcDisplay = '0.';
  calcCurrentValue = 0;
  calcPreviousValue = null;
  calcOperatorPending = null;
  calcNewEntry = true;
  calcUpdateDisplay();
}

function calcClearEntry() {
  calcDisplay = '0.';
  calcNewEntry = true;
  calcUpdateDisplay();
}

function calcBackspace() {
  if (calcNewEntry) return;
  let val = calcDisplay;
  if (val.endsWith('.')) val = val.slice(0, -1);
  if (val.length <= 1) {
    calcDisplay = '0.';
    calcNewEntry = true;
  } else {
    calcDisplay = val.slice(0, -1) + '.';
  }
  calcUpdateDisplay();
}

function calcNegate() {
  let val = parseFloat(calcDisplay);
  if (val !== 0) {
    val = -val;
    calcDisplay = formatCalcDisplay(val);
  }
  calcUpdateDisplay();
}

function calcOperator(op) {
  let current = parseFloat(calcDisplay);
  
  if (calcPreviousValue !== null && calcOperatorPending && !calcNewEntry) {
    current = calcPerformOperation(calcPreviousValue, current, calcOperatorPending);
    calcDisplay = formatCalcDisplay(current);
    calcUpdateDisplay();
  }
  
  calcPreviousValue = current;
  calcOperatorPending = op;
  calcNewEntry = true;
}

function calcEquals() {
  if (calcOperatorPending && calcPreviousValue !== null) {
    let current = parseFloat(calcDisplay);
    let result = calcPerformOperation(calcPreviousValue, current, calcOperatorPending);
    calcDisplay = formatCalcDisplay(result);
    calcPreviousValue = null;
    calcOperatorPending = null;
    calcNewEntry = true;
    calcUpdateDisplay();
  }
}

function calcPerformOperation(a, b, op) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) {
        showWin98Error('Rechner', 'Division durch Null ist nicht möglich.', 'critical');
        calcClear();
        return 0;
      }
      return a / b;
    default: return b;
  }
}

function calcSqrt() {
  let val = parseFloat(calcDisplay);
  if (val < 0) {
    showWin98Error('Rechner', 'Die Eingabe ist für diese Funktion ungültig.', 'critical');
    return;
  }
  val = Math.sqrt(val);
  calcDisplay = formatCalcDisplay(val);
  calcNewEntry = true;
  calcUpdateDisplay();
}

function calcPercent() {
  if (calcPreviousValue !== null) {
    let val = parseFloat(calcDisplay);
    val = calcPreviousValue * (val / 100);
    calcDisplay = formatCalcDisplay(val);
    calcNewEntry = true;
    calcUpdateDisplay();
  }
}

function calcReciprocal() {
  let val = parseFloat(calcDisplay);
  if (val === 0) {
    showWin98Error('Rechner', 'Division durch Null ist nicht möglich.', 'critical');
    return;
  }
  val = 1 / val;
  calcDisplay = formatCalcDisplay(val);
  calcNewEntry = true;
  calcUpdateDisplay();
}

function formatCalcDisplay(val) {
  if (Number.isInteger(val) && Math.abs(val) < 1e15) {
    return val.toString() + '.';
  }
  let str = val.toPrecision(15).replace(/0+$/, '');
  if (!str.includes('.')) str += '.';
  return str;
}

// Memory functions
function calcMemoryClear() {
  calcMemory = 0;
  calcHasMemory = false;
  calcUpdateDisplay();
}

function calcMemoryRecall() {
  if (calcHasMemory) {
    calcDisplay = formatCalcDisplay(calcMemory);
    calcNewEntry = true;
    calcUpdateDisplay();
  }
}

function calcMemoryStore() {
  calcMemory = parseFloat(calcDisplay);
  calcHasMemory = true;
  calcNewEntry = true;
  calcUpdateDisplay();
}

function calcMemoryAdd() {
  calcMemory += parseFloat(calcDisplay);
  calcHasMemory = true;
  calcNewEntry = true;
  calcUpdateDisplay();
}

function calcCopy() {
  let val = calcDisplay;
  if (val.endsWith('.')) val = val.slice(0, -1);
  navigator.clipboard.writeText(val).catch(() => {});
}

function calcPaste() {
  navigator.clipboard.readText().then(text => {
    const num = parseFloat(text);
    if (!isNaN(num)) {
      calcDisplay = formatCalcDisplay(num);
      calcNewEntry = true;
      calcUpdateDisplay();
    }
  }).catch(() => {});
}

// Keyboard support for calculator
document.addEventListener('keydown', (e) => {
  const calcWin = document.getElementById('window-calculator');
  if (!calcWin || calcWin.style.display === 'none') return;
  if (activeWindow !== 'calculator') return;
  
  if (e.key >= '0' && e.key <= '9') {
    calcDigit(e.key);
    e.preventDefault();
  } else if (e.key === '.') {
    calcDecimal();
    e.preventDefault();
  } else if (e.key === '+') {
    calcOperator('+');
    e.preventDefault();
  } else if (e.key === '-') {
    calcOperator('-');
    e.preventDefault();
  } else if (e.key === '*') {
    calcOperator('*');
    e.preventDefault();
  } else if (e.key === '/') {
    calcOperator('/');
    e.preventDefault();
  } else if (e.key === 'Enter' || e.key === '=') {
    calcEquals();
    e.preventDefault();
  } else if (e.key === 'Escape') {
    calcClear();
    e.preventDefault();
  } else if (e.key === 'Backspace') {
    calcBackspace();
    e.preventDefault();
  } else if (e.key === 'Delete') {
    calcClearEntry();
    e.preventDefault();
  }
});

// ==================== INTERNET EXPLORER ====================
let ieHistory = [];
let ieHistoryIndex = -1;
let ieCurrentUrl = 'about:blank';
let ieAbortController = null;

// Random year between 1996-2000 for Wayback Machine queries
function getRandomWaybackTimestamp() {
  const year = 1996 + Math.floor(Math.random() * 5); // 1996-2000
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  return `${year}${month}${day}`;
}

function ieNavigate(url) {
  const input = document.getElementById('ie-url-input');
  const targetUrl = url || input.value.trim();
  
  if (!targetUrl || targetUrl === 'about:blank') return;
  
  // Abort previous request if still pending
  if (ieAbortController) {
    ieAbortController.abort();
  }
  ieAbortController = new AbortController();
  
  // Normalize URL
  let normalizedUrl = targetUrl;
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  
  input.value = normalizedUrl;
  ieCurrentUrl = normalizedUrl;
  
  // Add to history
  if (ieHistoryIndex < ieHistory.length - 1) {
    ieHistory = ieHistory.slice(0, ieHistoryIndex + 1);
  }
  ieHistory.push(normalizedUrl);
  ieHistoryIndex = ieHistory.length - 1;
  
  const content = document.getElementById('ie-content');
  const status = document.getElementById('ie-status');
  const hostname = new URL(normalizedUrl).hostname;
  const domain = hostname.replace('www.', '');
  
  // ===== CHECK LOCAL CACHE FIRST =====
  const cachedPage = ieLookupCache(domain);
  if (cachedPage) {
    status.textContent = 'Seite wird aus dem Cache geladen...';
    content.innerHTML = `
      <div class="ie-loading">
        <div class="ie-logo"></div>
        <div class="ie-loading-text">Lade ${hostname} aus dem lokalen Cache...</div>
        <div class="ie-loading-bar-container">
          <div class="ie-loading-bar" style="width:100%;transition:width 0.3s;"></div>
        </div>
      </div>
    `;
    
    // Short delay for visual feedback, then show cached page
    setTimeout(() => {
      ieShowCachedPage(cachedPage, normalizedUrl, content, status, input);
    }, 300);
    return;
  }
  
  // ===== NO CACHE — FETCH FROM WAYBACK MACHINE =====
  status.textContent = 'Webseite wird geöffnet: ' + normalizedUrl + '...';
  
  content.innerHTML = `
    <div class="ie-loading">
      <div class="ie-logo"></div>
      <div class="ie-loading-text">Suche im Webarchiv nach ${hostname} (ca. 1996-2000)...</div>
      <div class="ie-loading-bar-container">
        <div class="ie-loading-bar" id="ie-loading-bar"></div>
      </div>
      <div class="ie-loading-subtext" style="font-size:10px;color:#999;margin-top:8px;">Verbindung mit archive.org wird hergestellt...</div>
    </div>
  `;
  
  // Animate loading bar
  let progress = 0;
  const loadingBar = document.getElementById('ie-loading-bar');
  const loadingInterval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 90) progress = 90;
    if (loadingBar) loadingBar.style.width = progress + '%';
  }, 250);
  
  const waybackTimestamp = getRandomWaybackTimestamp();
  const waybackApiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(domain)}&timestamp=${waybackTimestamp}`;
  
  // Query Wayback Machine API
  fetch(waybackApiUrl, { signal: ieAbortController.signal })
    .then(response => response.json())
    .then(data => {
      clearInterval(loadingInterval);
      if (loadingBar) loadingBar.style.width = '100%';
      
      if (data.archived_snapshots && data.archived_snapshots.closest && data.archived_snapshots.closest.available) {
        const snapshot = data.archived_snapshots.closest;
        const archiveUrl = snapshot.url.replace('/http', 'if_/http');
        const snapshotDate = snapshot.timestamp;
        const year = snapshotDate.substring(0, 4);
        const month = snapshotDate.substring(4, 6);
        const day = snapshotDate.substring(6, 8);
        const formattedDate = `${day}.${month}.${year}`;
        
        setTimeout(() => {
          ieShowArchivePage(archiveUrl, formattedDate, normalizedUrl, content, status, input, false);
        }, 400);
      } else {
        ieLoadOldestVersion(normalizedUrl, domain, content, status, loadingBar, input);
      }
    })
    .catch(err => {
      if (err.name === 'AbortError') return;
      clearInterval(loadingInterval);
      ieLoadOldestVersion(normalizedUrl, domain, content, status, loadingBar, input);
    });
  
  setTimeout(() => {
    clearInterval(loadingInterval);
  }, 20000);
}

// ===== CACHE LOOKUP =====
function ieLookupCache(domain) {
  if (typeof IE_PAGE_CACHE === 'undefined') return null;
  
  // Direct match
  if (IE_PAGE_CACHE[domain]) return IE_PAGE_CACHE[domain];
  
  // Try without subdomain variations
  for (const key of Object.keys(IE_PAGE_CACHE)) {
    if (domain === key || domain === 'www.' + key || domain.endsWith('.' + key)) {
      return IE_PAGE_CACHE[key];
    }
  }
  return null;
}

// ===== SHOW CACHED PAGE =====
function ieShowCachedPage(cachedPage, normalizedUrl, content, status, input) {
  // Decode base64 HTML
  const html = atob(cachedPage.html);
  
  content.innerHTML = '';
  content.style.alignItems = 'stretch';
  content.style.justifyContent = 'stretch';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  
  // Green cache banner
  const banner = document.createElement('div');
  banner.className = 'ie-archive-banner ie-cache-banner';
  banner.innerHTML = `
    <span class="ie-archive-icon">&#9889;</span>
    <span><strong>Aus dem Cache geladen</strong> — ${cachedPage.title}, archiviert am ${cachedPage.date} &nbsp; <span style="font-size:10px;color:#666;">(Sofort geladen, kein Netzwerkzugriff)</span></span>
  `;
  content.appendChild(banner);
  
  // Create iframe with cached HTML via srcdoc
  const iframe = document.createElement('iframe');
  iframe.className = 'ie-archive-iframe';
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
  iframe.srcdoc = html;
  content.appendChild(iframe);
  
  status.textContent = `Fertig — Cache: ${cachedPage.title} (${cachedPage.date})`;
  input.value = normalizedUrl;
}

// ===== SHOW ARCHIVE PAGE (refactored) =====
function ieShowArchivePage(archiveUrl, formattedDate, normalizedUrl, content, status, input, isOldest) {
  content.innerHTML = '';
  content.style.alignItems = 'stretch';
  content.style.justifyContent = 'stretch';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  
  const banner = document.createElement('div');
  banner.className = 'ie-archive-banner' + (isOldest ? ' ie-archive-banner-oldest' : '');
  banner.innerHTML = `
    <span class="ie-archive-icon">&#128218;</span>
    <span>${isOldest ? 'Älteste verfügbare Version' : 'Archivierte Version'} vom <strong>${formattedDate}</strong> — Quelle: Internet Archive Wayback Machine</span>
  `;
  content.appendChild(banner);
  
  const iframe = document.createElement('iframe');
  iframe.src = archiveUrl;
  iframe.className = 'ie-archive-iframe';
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  content.appendChild(iframe);
  
  status.textContent = `Fertig — ${isOldest ? 'Ältestes Archiv' : 'Archiv'}: ${formattedDate}`;
  input.value = normalizedUrl;
}

// Fallback: Try to find the oldest available version via Wayback Machine
function ieLoadOldestVersion(normalizedUrl, domain, content, status, loadingBar, input) {
  if (loadingBar) loadingBar.style.width = '92%';
  status.textContent = 'Kein 90er-Archiv gefunden — suche älteste verfügbare Version...';
  
  const oldestApiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(domain)}&timestamp=19900101`;
  
  fetch(oldestApiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.archived_snapshots && data.archived_snapshots.closest && data.archived_snapshots.closest.available) {
        const snapshot = data.archived_snapshots.closest;
        const archiveUrl = snapshot.url.replace('/http', 'if_/http');
        const snapshotDate = snapshot.timestamp;
        const year = snapshotDate.substring(0, 4);
        const month = snapshotDate.substring(4, 6);
        const day = snapshotDate.substring(6, 8);
        const formattedDate = `${day}.${month}.${year}`;
        
        if (loadingBar) loadingBar.style.width = '100%';
        
        setTimeout(() => {
          ieShowArchivePage(archiveUrl, formattedDate, normalizedUrl, content, status, input, true);
        }, 400);
      } else {
        ieShowNotFoundError(normalizedUrl, content, status);
      }
    })
    .catch(() => {
      ieShowNotFoundError(normalizedUrl, content, status);
    });
}

// Show error page when no archive version exists at all
function ieShowNotFoundError(normalizedUrl, content, status) {
  content.innerHTML = `
    <div class="ie-error-page">
      <h3>Die Seite kann nicht angezeigt werden</h3>
      <p>Für <strong>${new URL(normalizedUrl).hostname}</strong> wurde kein Eintrag im Internet Archive gefunden.</p>
      <hr style="margin: 16px 0;">
      <p style="font-size: 11px;">
        <strong>Versuchen Sie Folgendes:</strong><br>
        • Klicken Sie auf <a href="#" onclick="ieRefresh(); return false;">Aktualisieren</a>, oder versuchen Sie es später erneut.<br>
        • Überprüfen Sie die Schreibweise der URL in der Adressleiste.<br>
        • Versuchen Sie eine bekannte Seite wie
          <a href="#" onclick="document.getElementById('ie-url-input').value='yahoo.com'; ieNavigate(); return false;">yahoo.com</a>,
          <a href="#" onclick="document.getElementById('ie-url-input').value='microsoft.com'; ieNavigate(); return false;">microsoft.com</a> oder
          <a href="#" onclick="document.getElementById('ie-url-input').value='apple.com'; ieNavigate(); return false;">apple.com</a>
      </p>
      <p style="font-size: 10px; color: #808080; margin-top: 16px;">
        Fehler: Seite nicht im Archiv verfügbar<br>
        URL: ${normalizedUrl}
      </p>
    </div>
  `;
  status.textContent = 'Fertig';
}

function ieBack() {
  if (ieHistoryIndex > 0) {
    ieHistoryIndex--;
    const url = ieHistory[ieHistoryIndex];
    document.getElementById('ie-url-input').value = url;
    ieCurrentUrl = url;
    ieNavigate(url);
  }
}

function ieForward() {
  if (ieHistoryIndex < ieHistory.length - 1) {
    ieHistoryIndex++;
    const url = ieHistory[ieHistoryIndex];
    document.getElementById('ie-url-input').value = url;
    ieCurrentUrl = url;
    ieNavigate(url);
  }
}

function ieStop() {
  if (ieAbortController) ieAbortController.abort();
  const status = document.getElementById('ie-status');
  status.textContent = 'Abgebrochen';
}

function ieRefresh() {
  if (ieCurrentUrl && ieCurrentUrl !== 'about:blank') {
    ieNavigate(ieCurrentUrl);
  }
}

function ieHome() {
  document.getElementById('ie-url-input').value = 'https://www.yahoo.com';
  ieNavigate('https://www.yahoo.com');
}

// Enter key in IE address bar
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement === document.getElementById('ie-url-input')) {
    ieNavigate();
    e.preventDefault();
  }
});


// ==================== HILFE-DIALOG MIT API-LINKS ====================
function openHelpDialog() {
  // Create a help window using the window management system
  const helpId = 'help-dialog';
  
  // Remove existing help dialog if present
  const existing = document.getElementById(helpId);
  if (existing) existing.remove();
  const existingTaskBtn = document.getElementById('taskbar-' + helpId);
  if (existingTaskBtn) existingTaskBtn.remove();
  
  const win = document.createElement('div');
  win.id = helpId;
  win.className = 'window';
  win.style.cssText = 'display:flex; width:520px; height:440px; position:absolute; top:60px; left:120px; z-index:' + (++windowZIndex) + ';';
  
  win.innerHTML = `
    <div class="title-bar" onmousedown="startDrag(event, '${helpId}')">
      <div class="title-bar-text">Windows 98 Hilfe — Verwendete APIs & Technologien</div>
      <div class="title-bar-controls">
        <button aria-label="Close" onclick="document.getElementById('${helpId}').remove(); var tb=document.getElementById('taskbar-${helpId}'); if(tb) tb.remove();"></button>
      </div>
    </div>
    <div class="window-body" style="flex:1; overflow:auto; padding:12px; font-family:'Pixelated MS Sans Serif','Microsoft Sans Serif',Arial,sans-serif; font-size:11px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #808080;">
        <div style="font-size:28px;">📖</div>
        <div>
          <div style="font-weight:bold; font-size:13px;">Windows 98 Desktop — Hilfe</div>
          <div style="color:#808080; font-size:10px;">Übersicht aller verwendeten APIs und Technologien</div>
        </div>
      </div>
      
      <fieldset style="margin-bottom:10px; padding:8px;">
        <legend style="font-weight:bold;">🎨 Design-System</legend>
        <table style="width:100%; font-size:11px; border-collapse:collapse;">
          <tr>
            <td style="padding:3px 6px; font-weight:bold; white-space:nowrap; vertical-align:top;">98.css</td>
            <td style="padding:3px 6px;">CSS-Bibliothek für authentisches Windows 98 UI-Design<br>
              <a href="https://jdan.github.io/98.css/" target="_blank" style="color:#0000ff;">https://jdan.github.io/98.css/</a></td>
          </tr>
        </table>
      </fieldset>
      
      <fieldset style="margin-bottom:10px; padding:8px;">
        <legend style="font-weight:bold;">🌐 Internet Explorer — Webarchiv</legend>
        <table style="width:100%; font-size:11px; border-collapse:collapse;">
          <tr>
            <td style="padding:3px 6px; font-weight:bold; white-space:nowrap; vertical-align:top;">Wayback Machine<br>Availability API</td>
            <td style="padding:3px 6px;">Sucht archivierte Versionen von Webseiten (1996-2000). Wird verwendet, um die älteste oder zeitlich passende Version einer URL zu finden.<br>
              <a href="https://archive.org/help/wayback_api.php" target="_blank" style="color:#0000ff;">https://archive.org/help/wayback_api.php</a></td>
          </tr>
          <tr>
            <td style="padding:3px 6px; font-weight:bold; white-space:nowrap; vertical-align:top;">Web Archive<br>(iframe)</td>
            <td style="padding:3px 6px;">Archivierte Seiten werden direkt als interaktive Webseiten im iframe geladen. Die <code>if_</code>-URL-Variante entfernt den Wayback-Banner.<br>
              <a href="https://web.archive.org/" target="_blank" style="color:#0000ff;">https://web.archive.org/</a></td>
          </tr>
        </table>
      </fieldset>
      
      <fieldset style="margin-bottom:10px; padding:8px;">
        <legend style="font-weight:bold;">🔌 Netzwerk-Feature</legend>
        <table style="width:100%; font-size:11px; border-collapse:collapse;">
          <tr>
            <td style="padding:3px 6px; font-weight:bold; white-space:nowrap; vertical-align:top;">ipify API</td>
            <td style="padding:3px 6px;">Ermittelt die öffentliche IP-Adresse des Nutzers für den Netzwerk-Dialog im System-Tray.<br>
              <a href="https://api.ipify.org?format=json" target="_blank" style="color:#0000ff;">https://api.ipify.org/</a></td>
          </tr>
          <tr>
            <td style="padding:3px 6px; font-weight:bold; white-space:nowrap; vertical-align:top;">navigator.userAgent</td>
            <td style="padding:3px 6px;">Nativer Browser-API-Zugriff zur Anzeige des User-Agents im Netzwerk-Dialog.<br>
              <a href="https://developer.mozilla.org/de/docs/Web/API/Navigator/userAgent" target="_blank" style="color:#0000ff;">MDN: Navigator.userAgent</a></td>
          </tr>
        </table>
      </fieldset>
      
      <fieldset style="margin-bottom:10px; padding:8px;">
        <legend style="font-weight:bold;">🛠️ Technologien</legend>
        <table style="width:100%; font-size:11px; border-collapse:collapse;">
          <tr>
            <td style="padding:3px 6px; font-weight:bold; white-space:nowrap; vertical-align:top;">HTML5 / CSS3</td>
            <td style="padding:3px 6px;">Semantisches HTML mit CSS für Layout, Fenster und Desktop-Oberfläche.</td>
          </tr>
          <tr>
            <td style="padding:3px 6px; font-weight:bold; white-space:nowrap; vertical-align:top;">Vanilla JavaScript</td>
            <td style="padding:3px 6px;">Keine externen Frameworks — reines ES6+ JavaScript für alle Interaktionen.</td>
          </tr>
          <tr>
            <td style="padding:3px 6px; font-weight:bold; white-space:nowrap; vertical-align:top;">SVG Icons</td>
            <td style="padding:3px 6px;">Inline-SVG-basierte Icons im Windows 98 Pixel-Stil für maximale Schärfe.</td>
          </tr>
        </table>
      </fieldset>
      
      <div style="text-align:center; margin-top:8px; padding-top:8px; border-top:1px solid #808080;">
        <button onclick="document.getElementById('${helpId}').remove(); var tb=document.getElementById('taskbar-${helpId}'); if(tb) tb.remove();" style="width:80px;">OK</button>
      </div>
    </div>
  `;
  
  document.getElementById('desktop').appendChild(win);
  
  // Add taskbar button
  const taskBtn = document.createElement('button');
  taskBtn.id = 'taskbar-' + helpId;
  taskBtn.className = 'taskbar-button active';
  taskBtn.innerHTML = 'Hilfe';
  taskBtn.onclick = () => {
    const w = document.getElementById(helpId);
    if (w) {
      if (w.style.display === 'none') {
        w.style.display = 'flex';
        taskBtn.classList.add('active');
      } else {
        w.style.display = 'none';
        taskBtn.classList.remove('active');
      }
    }
  };
  document.getElementById('taskbar-items').appendChild(taskBtn);
}
