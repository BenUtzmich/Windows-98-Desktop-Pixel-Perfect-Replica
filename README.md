# Windows 98 Desktop - Pixel-Perfect Replica

Eine vollständige, interaktive Nachbildung des Windows 98 Desktops als Single-Page-Application mit HTML, CSS und Vanilla JavaScript.

![Windows 98 Desktop](https://img.shields.io/badge/Windows-98-blue?style=flat-square&logo=windows)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

## Features

### Desktop & Startmenü
- Authentischer petrolfarbener Desktop (#008080)
- 8 Desktop-Icons mit Doppelklick-Funktionalität
- Vollständiges Startmenü mit Untermenüs und Hover-Effekten
- Funktionsfähiger "Ausführen"-Dialog

### Taskleiste
- Echtzeit-Uhr (HH:mm)
- Taskbar-Buttons für alle geöffneten Fenster
- System-Tray mit Netzwerk- und Lautstärke-Icons
- Minimieren/Wiederherstellen über Taskleiste

### Fenstermanagement
- Verschiebbare Fenster (Drag via Titelleiste)
- Minimieren, Maximieren, Schließen
- Größenänderung über Resize-Handles an allen Kanten
- Z-Order-Verwaltung (aktive Fenster im Vordergrund)

### Anwendungen

#### Internet Explorer
- Wayback Machine Integration für Webseiten aus den 90ern
- **Lokaler Cache** mit 15 beliebten Seiten für sofortiges Laden:
  - Yahoo! (1996), Google (1998), Microsoft (1996), Apple (1997)
  - Amazon (1999), eBay (1999), AOL (1997), AltaVista (1999)
  - GeoCities (1998), Lycos (1998), Thefacebook (2005), MySpace (2005)
  - Wikipedia (2001), CNN (2000), NASA (1996)
- Vollständige Toolbar (Zurück, Vorwärts, Aktualisieren, Startseite)
- Adressleiste mit Enter-Taste Support
- Browserverlauf mit Navigation
- Animierter Ladebalken

#### MS-DOS Emulator
- Vollständiges virtuelles Dateisystem
- Unterstützte Befehle: `DIR`, `CD`, `CLS`, `TYPE`, `ECHO`, `DATE`, `TIME`, `VER`, `MEM`, `TREE`, `MKDIR`, `COLOR`, `HELP`, `EXIT`
- Befehlshistorie über Pfeiltasten
- Authentische DOS-Optik

#### Editor (Notepad)
- Funktionsfähiger Texteditor mit Menüleiste
- Funktionen: Neu, Öffnen, Speichern, Ausschneiden, Kopieren, Einfügen, Rückgängig, Alles markieren
- Datum/Uhrzeit einfügen
- Statusleiste mit Zeilen- und Spaltenanzeige

#### Minesweeper
- Originalgetreue Implementierung
- 3 Schwierigkeitsgrade: Anfänger (9×9, 10 Minen), Fortgeschritten (16×16, 40 Minen), Experte (16×30, 99 Minen)
- Linksklick zum Aufdecken, Rechtsklick zum Flaggen
- Minenzähler, Timer und Smiley-Button

#### Taschenrechner (calc.exe)
- Windows 98 Taschenrechner-Design
- Grundrechenarten: +, −, ×, ÷
- Erweiterte Funktionen: √, %, 1/x, ±
- Speicherfunktionen: MC, MR, MS, M+
- Bearbeitungsfunktionen: Backspace, CE, C

#### Arbeitsplatz
- Explorer-Ansicht mit Laufwerken (C:, D:)
- Virtuelles Dateisystem mit typischen Windows 98 Ordnern
- Navigation in Unterordner mit Zurück-Button
- Dateien öffnen im Notepad

#### Netzwerk-Dialog
- Zeigt öffentliche IP-Adresse (via ipify.org API)
- Zeigt Browser User-Agent
- Simulierte Paketstatistiken
- Tabs: Allgemein, Statistik

### Besondere Features

#### Windows 98 Fehlerdialoge
- 13 verschiedene deutsche Fehlermeldungen
- 3 Icon-Typen (kritisch, Warnung, Info)
- Erscheinen bei nicht-implementierten Funktionen

#### Bluescreen (BSOD)
- 15% Wahrscheinlichkeit statt Fehlerdialog
- 6 verschiedene BSOD-Typen mit authentischen Fehlermeldungen
- Schließen durch Tastendruck oder Klick

## Technologie

- **Design-System:** [98.css](https://jdan.github.io/98.css/) für authentisches Windows 98 Styling
- **HTML5/CSS3:** Semantisches HTML, Flexbox, CSS Grid
- **Vanilla JavaScript:** Keine externen Abhängigkeiten (außer 98.css)
- **SVG Icons:** Skalierbare Icons für alle Auflösungen
- **APIs:** Internet Archive Wayback Machine, ipify.org

## Deployment

### Option 1: GitHub Pages (Empfohlen)

1. Erstellen Sie ein neues GitHub-Repository
2. Laden Sie alle Dateien hoch (außer `*.txt`, `*.py` und `cache/`-Ordner)
3. Gehen Sie zu **Settings** → **Pages**
4. Wählen Sie **Source: Deploy from a branch** → **Branch: main** → **/ (root)**
5. Klicken Sie auf **Save**
6. Nach wenigen Minuten ist die Seite unter `https://[username].github.io/[repo-name]` verfügbar

### Option 2: Netlify

1. Gehen Sie zu [netlify.com](https://www.netlify.com/)
2. Klicken Sie auf **Add new site** → **Deploy manually**
3. Ziehen Sie den gesamten Ordner in das Upload-Feld
4. Die Seite ist sofort unter einer zufälligen URL verfügbar

### Option 3: Vercel

1. Installieren Sie Vercel CLI: `npm i -g vercel`
2. Führen Sie im Projektordner aus: `vercel`
3. Folgen Sie den Anweisungen
4. Die Seite ist sofort verfügbar

### Option 4: Lokaler Webserver

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve

# PHP
php -S localhost:8080
```

Öffnen Sie dann `http://localhost:8080` im Browser.

## Dateistruktur

```
win98-desktop/
├── index.html          # Haupt-HTML-Datei
├── style.css           # Alle Styles
├── app.js              # Komplette JavaScript-Logik
├── ie-cache.js         # Internet Explorer Cache (887 KB)
├── 98.css              # Windows 98 Design-System
└── README.md           # Diese Datei
```

## Browser-Kompatibilität

- ✅ Chrome/Edge (empfohlen)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer: Nicht unterstützt (ironischerweise)

## Performance

- **Dateigröße:** ~1.2 MB (inkl. 887 KB Cache)
- **Ladezeit:** < 1 Sekunde
- **Gecachte Seiten:** Laden in < 300ms
- **Nicht-gecachte Seiten:** 5-15 Sekunden (Wayback Machine API)

## Credits

- **98.css:** [jdan/98.css](https://github.com/jdan/98.css)
- **Internet Archive Wayback Machine:** [archive.org](https://archive.org/)
- **ipify API:** [ipify.org](https://www.ipify.org/)

## Lizenz

Dieses Projekt ist Open Source und steht unter der MIT-Lizenz.

## Entwicklung

Erstellt mit ❤️ als Hommage an Windows 98 und die frühen Tage des Internets.

---

**Hinweis:** Diese Anwendung ist eine reine Frontend-Simulation. Es werden keine echten Systemdateien verändert oder gelöscht. Alle Daten bleiben im Browser-Speicher.
