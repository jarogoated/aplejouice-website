const COOKIE='__Host-aple_lang';
export function getLanguage(request) {
  const value=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1);
  return value==='en' ? 'en' : 'de';
}
export function languageResponse(request) {
  const url=new URL(request.url);
  if(url.pathname!=='/_language') return null;
  if(request.method!=='GET') return new Response(null,{status:405,headers:{Allow:'GET'}});
  const lang=url.searchParams.get('lang');
  if(!['de','en'].includes(lang)) return new Response('Invalid language',{status:400});
  const requested=url.searchParams.get('returnTo');
  const destination=['/','/downloads','/release-admin'].includes(requested) ? requested : '/';
  return new Response(null,{status:303,headers:{Location:destination,'Cache-Control':'no-store',
    'Set-Cookie':`${COOKIE}=${lang}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`}});
}
export function languageSwitch(lang,path) {
  const label=lang==='en' ? 'Website language' : 'Sprache der Website';
  return `<!-- language-switch:start --><div class="language-switch" role="group" aria-label="${label}">${['de','en'].map(value=>`<a href="/_language?lang=${value}&amp;returnTo=${encodeURIComponent(path)}" lang="${value}" aria-label="${value==='de' ? 'Deutsch' : 'English'}"${value===lang ? ' aria-current="true"' : ''}>${value.toUpperCase()}</a>`).join('')}</div><!-- language-switch:end -->`;
}
const translations={
  'Aplejouice Mod — Item-Tracking für Minecraft':'Aplejouice Mod — Item tracking for Minecraft',
  'Aplejouice Mod — In Bearbeitung · Beta':'Aplejouice Mod — Work in progress · Beta',
  'Item-Tracking über den Köpfen deiner Gegner. Entdecke Aplejouice Mod für Minecraft 1.21.11 und Fabric: Webs, Totems, Perlen und Crystals im Blick.':'Item usage counters above your opponents. Discover Aplejouice Mod for Minecraft 1.21.11 and Fabric: keep webs, totems, pearls and crystals in view.',
  'Zum Inhalt':'Skip to content','Aplejouice Mod Startseite':'Aplejouice Mod home','Hauptnavigation':'Main navigation',
  'Live-Demo':'Live demo','In Bearbeitung · Beta':'Work in progress · Beta','Vorschau sperren':'Lock preview',
  'Item-Tracking':'Item tracking','für':'for','Webs, Totems, Enderperlen und End-Crystals: Die':'Webs, totems, ender pearls and end crystals: the',
  'zeigt erfasste Nutzungen als Zähler über Spielern an.':'shows observed usage counters above players.',
  'Mod herunterladen':'Download mod','Mod herunterladen ↓':'Download mod ↓','Mod herunterladen ↗':'Download mod ↗','Quellcode ↗':'Source code ↗',
  'Mit':'Press','öffnen · Deutsch & Englisch · Open Source':'to open · German & English · Open Source',
  'Menü der Mod in der großen Vorschau ansehen':'View the mod menu in the full preview',
  'Das echte Aplejouice-Menü mit Item-Suche, Watchlist und Spracheinstellungen':'The Aplejouice menu with item search, watchlist and language settings',
  'Das Menü im Spiel. Entwicklungsaufnahme.':'The in-game menu. Development screenshot.',
  'UPDATE-HINWEISE':'UPDATE NOTICES','CLIENTSEITIG':'CLIENT-SIDE','ÖFFNET DAS MENÜ':'OPENS THE MENU',
  'KLEINE MOD. KLARER FOKUS.':'SMALL MOD. CLEAR FOCUS.','Weniger raten.':'Less guessing.','Mehr Überblick.':'More awareness.',
  'Deine Items, dein Gegner, deine Anzeige.':'Your items, your opponent, your display.',
  'Stell genau das ein, was du im Kampf sehen willst.':'Choose exactly what you want to see in a fight.',
  'Deine Watchlist.':'Your watchlist.',
  'Suche Items nach Namen oder ID und füge bis zu acht zur Liste hinzu. Webs, Totems, Enderperlen und End-Crystals sind mit dabei.':'Search by item name or ID and add up to eight items. Webs, totems, ender pearls and end crystals are supported.',
  'Bis zu 8 Item-Typen':'Up to 8 item types','02 / SPIELER':'02 / PLAYERS','Dein Gegner.':'Your opponent.',
  'Wähle einen geladenen Spieler aus der Liste oder greife ihn an. Im Gegner-Modus zählt nur dein ausgewähltes Ziel.':'Select a loaded player from the list or attack them. Opponent mode tracks only your selected target.',
  'Auswählen oder angreifen':'Select or attack','03 / ANZEIGE':'03 / DISPLAY','Deine Übersicht.':'Your overview.',
  'Behalte nahe Spieler im Blick oder fokussiere einen Gegner. Nullwerte und Reichweite stellst du selbst ein.':'Watch nearby players or focus on one opponent. Choose whether to show zero counts and set your display range.',
  'Bis zu 8 nahe Spieler · max. 64 m':'Up to 8 nearby players · max. 64 m',
  "PROBIER'S AUS":'TRY IT OUT','Ein Pop.':'One pop.','Eine Zahl mehr.':'One more on the counter.',
  'So liest sich das Tracking: Item nutzen, Zähler sehen. Klicke auf ein Item und teste die Anzeige in dieser Website-Demo.':'Use an item, see the counter change. Click an item to try the display in this website demo.',
  'Illustrative Demo. Im Spiel hängen die Zähler von den empfangenen Server-Ereignissen ab.':'Illustrative demo. In-game counters depend on the server events your client receives.',
  'Wie genau ist das Tracking? ↗':'How accurate is the tracking? ↗','INTERAKTIVE DEMO':'INTERACTIVE DEMO','RUNDE':'ROUND',
  'Spinnennetze':'Cobwebs','Enderperlen':'Ender pearls','Perlen':'Pearls','DeinGegner':'YourOpponent',
  'Erfasste Nutzungen':'Observed usage','Mit den Buttons unten ausprobieren':'Try the buttons below',
  'Item-Nutzung simulieren':'Simulate item usage','Web setzen':'Place web','Totem poppen':'Pop totem','Perle werfen':'Throw pearl','Crystal setzen':'Place crystal',
  'Runde zurücksetzen':'Reset round','EIN TASTENDRUCK ENTFERNT':'ONE KEYPRESS AWAY','Drück':'Press',
  "Mach's zu deinem.":'Make it yours.','Ein aufgeräumtes Menü im Aplejouice-Stil.':'A clean menu in the Aplejouice style.',
  'Deutsch oder Englisch. Deine Einstellungen bleiben.':'German or English. Your settings stay saved.',
  'Mod-Menü Vorschau':'Mod menu preview','Item-Track':'Item Track','Anzeige':'Display',
  'Aplejouice-Menü mit Item-Suche und einer Watchlist für Spinnennetze und Enderperlen':'Aplejouice menu with item search and a watchlist for cobwebs and ender pearls',
  'Aufnahmen aus der Entwicklung. Einzelne Details können von der aktuellen Version abweichen.':'Development screenshots. Some details may differ from the current version.',
  'Im Spiel: Item-Icons und Zähler stehen über dem Namen des Gegners':'In game: item icons and counters appear above the opponent’s name',
  'Direkt über dem Kopf.':'Right above their head.','So sieht das Tracking im Spiel aus. Entwicklungsaufnahme.':'How tracking looks in game. Development screenshot.',
  'Neue Runde? Reset.':'New round? Reset.',
  'Manuell zurücksetzen oder automatisch, wenn du den Tod eines Spielers mitbekommst.':'Reset manually or automatically when your client observes a player’s death.',
  'Deutsch & Englisch.':'German & English.',
  'Wechsle direkt im Menü. Sprache, Item-Liste und Einstellungen werden gespeichert.':'Switch in the menu. Language, item list and settings are saved.',
  'Du entscheidest.':'Your choice.','Gegner-Modus aus: nahe Spieler. Gegner-Modus an: erst auswählen oder angreifen.':'Opponent mode off: nearby players. Opponent mode on: select or attack first.',
  'BEREIT FÜR DIE NÄCHSTE RUNDE?':'READY FOR THE NEXT ROUND?','Rein in den':'Drop it in the','mods-Ordner.':'mods folder.',
  'Für Minecraft Java 1.21.11.':'For Minecraft Java 1.21.11.','Mit Fabric Loader ≥ 0.18.4, Fabric API und Java 21.':'Requires Fabric Loader ≥ 0.18.4, Fabric API and Java 21.',
  'Die aktuelle Version findest du auf unserer Downloadseite.':'Find the current version on our download page.',
  'Fabric vorbereiten':'Set up Fabric','Installiere':'Install','für 1.21.11 und die passende':'for 1.21.11 and the matching',
  'Mod hinzufügen':'Add the mod','Lege die Aplejouice-Mod-JAR zusammen mit Fabric API in den':'Put the Aplejouice mod JAR together with Fabric API in your game instance’s',
  '-Ordner deiner Spielinstanz.':'folder.','Mit J loslegen':'Get started with J',
  'Aktiviere Tracking im Menü und füge Items hinzu. Im Gegner-Modus wählst du zusätzlich einen Spieler aus.':'Enable tracking in the menu and add items. In opponent mode, also select a player.',
  'NOCH KURZ':'GOOD TO KNOW','Gut zu wissen.':'Good to know.',
  'Wird wirklich jede Nutzung gezählt?':'Does it count every use?',
  'Die Mod erfasst das, was dein Client vom Server mitbekommt. Totem-Pops und Perlen nutzen Server-Ereignisse. Bei Webs und Crystals wird der Platzierer aus gehaltenem Item, Reichweite und Blickrichtung abgeleitet. Ist die Zuordnung mehrdeutig, kann eine Nutzung fehlen. Die Zahlen sind keine garantiert vollständige Server-Statistik.':'The mod records what your client receives from the server. Totem pops and pearls use server events. For webs and crystals, ownership is inferred from held items, reach and view direction. Ambiguous uses may be missed. The counters are not guaranteed complete server statistics.',
  'Braucht der Server die Mod auch?':'Does the server need the mod?',
  'Für das clientseitige Beobachten nicht. Optional kann dieselbe JAR auf einem Fabric-Server Vanilla-ITEM_USED-Statistiken an passende Clients senden.':'Not for client-side observation. Optionally, the same JAR on a Fabric server can send vanilla ITEM_USED statistics to compatible clients.',
  'Bleiben meine Einstellungen gespeichert?':'Are my settings saved?',
  'Ja. Einstellungen und Item-Liste bleiben beim Serverwechsel und Neustart gespeichert. Ziele und Rundenzähler werden beim Serverwechsel zurückgesetzt; im Gegner-Modus wählst du dann erneut einen Spieler aus.':'Yes. Settings and your item list are saved across server changes and restarts. Targets and round counters reset when changing servers; select a new player in opponent mode.',
  'Welche Minecraft-Versionen werden unterstützt?':'Which Minecraft versions are supported?',
  'Aktuell Minecraft Java 1.21.11 mit Fabric. Neuere Versionen benötigen eine eigene Anpassung und sind nicht automatisch kompatibel. Die Taste J lässt sich in der Minecraft-Steuerung umbelegen.':'Currently Minecraft Java 1.21.11 with Fabric. Newer versions need a separate update and are not automatically compatible. You can rebind J in Minecraft’s controls.',
  'Ist die Mod Open Source?':'Is the mod open source?',
  'Ja, unter der MIT-Lizenz. Auf GitHub kannst du den Code ansehen und Fehler melden. Ein Großteil des Codes sowie UI-Texte und gezeichnete Pixel-Icons sind mit OpenAI Codex entstanden. Die Mod selbst nutzt keine KI zur Laufzeit.':'Yes, under the MIT license. Browse the code and report issues on GitHub. Much of the code, UI text and pixel icons was created with OpenAI Codex. The mod does not use AI at runtime.',
  'Fehler melden ↗':'Report an issue ↗','Ein Community-Projekt. Nicht mit Mojang oder Microsoft verbunden.':'A community project. Not affiliated with Mojang or Microsoft.',
  'Dein Spiel.':'Your game.','Dein Überblick.':'Your awareness.','Mit mehr Überblick.':'With more awareness.',
  'Die Website wird gerade überarbeitet. Die Vorschau ist vorerst nur mit Passcode zugänglich.':'This website is being updated. The preview is currently accessible with a passcode only.',
  'Vorschau öffnen':'Open preview','Die Mod findest du weiterhin auf Modrinth.':'You can still find the mod on Modrinth.','Zur Mod auf Modrinth ↗':'View the mod on Modrinth ↗',
  'Der geschützte Zugang wird gerade eingerichtet.':'Protected access is being configured.','Bitte öffne das Formular direkt auf dieser Website.':'Please open this form directly on this website.',
  'Zu viele Versuche. Bitte warte 15 Minuten.':'Too many attempts. Please wait 15 minutes.','Ungültige Anfrage.':'Invalid request.','Der Passcode stimmt nicht.':'The passcode is incorrect.',
  'Website-Vorschau':'Website preview','Community-Projekt':'Community project','Aplejouice Mod · Community-Projekt · MIT':'Aplejouice Mod · Community project · MIT',
  'Nicht mit Mojang oder Microsoft verbunden.':'Not affiliated with Mojang or Microsoft.','Version veröffentlichen':'Publish a version','Version veröffentlichen ↗':'Publish a version ↗','Veröffentlichung':'Publishing',
  'Eine Version.':'One release.','Alle auf dem Laufenden.':'Everyone up to date.',
  'GitHub verwaltet eure Uploads und Zugriffsrechte. Diese Downloadseite übernimmt fertig veröffentlichte Versionen automatisch innerhalb von etwa fünf Minuten.':'GitHub manages uploads and access. This download page picks up published releases automatically within about five minutes.',
  'Mod bauen und Version in':'Build the mod and update','erhöhen.':'.','Release-Tag':'Create the release tag',
  'anlegen – mit der jeweiligen neuen Versionsnummer.':'using the new version number.','Die JAR als':'Upload the JAR as',
  'hochladen. Tag und Dateiversion müssen übereinstimmen.':'The tag and file version must match.',
  'Als fertiges Release veröffentlichen. Entwürfe und Pre-Releases werden nicht angeboten.':'Publish a full release. Drafts and pre-releases are not offered.',
  'Version auf GitHub hochladen ↗':'Upload a release on GitHub ↗',
  'Das funktioniert nur mit einem GitHub-Konto, das Schreibzugriff auf das Projekt hat. Bereits veröffentlichte Dateien unverändert lassen; jede Änderung bekommt eine neue Version.':'This requires a GitHub account with write access to the project. Leave published files unchanged; publish every change under a new version.',
  'Downloadseite':'Download page','Update-Metadaten':'Update metadata',
  'Was ist neu? ↗':"What’s new? ↗",'Alle Versionen ↗':'All versions ↗','Downloads gerade nicht erreichbar':'Downloads are temporarily unavailable',
  'Die nächste Version kommt bald.':'The next version is coming soon.',
  'Die Versionsliste konnte nicht geladen werden. Du kannst direkt bei GitHub nachsehen.':'The version list could not be loaded. You can check GitHub directly.',
  'Sobald ein fertiges Release veröffentlicht ist, erscheint es automatisch hier.':'Published releases will appear here automatically.','Zu den Releases ↗':'View releases ↗',
  'Die aktuelle Aplejouice Mod für Minecraft Java. Laden, in deinen mods-Ordner legen und mit deiner Menütaste loslegen.':'The current Aplejouice Mod for Minecraft Java. Download it, drop it in your mods folder and get started with your menu key.',
  'Webs, Totems und mehr direkt über Spielern im Blick.':'Keep webs, totems and more in view above players.','Deine Visuals':'Your visuals',
  'Wasserquellen hervorheben und Arena-Borders anzeigen.':'Highlight water sources and display arena borders.','Ein Tastendruck':'One keypress',
  'Koordinaten kopieren. Eigene Tasten. Dein Setup.':'Copy coordinates. Custom keys. Your setup.','So installierst du das Update':'How to install the update',
  'Minecraft schließen.':'Close Minecraft.','Alte Aplejouice-JAR im':'Replace the old Aplejouice JAR in the',
  '-Ordner durch die neue ersetzen. Einstellungen bleiben erhalten.':'folder with the new one. Your settings are preserved.',
  'Mit Fabric Loader und Fabric API für Minecraft 1.21.11 starten.':'Launch with Fabric Loader and Fabric API for Minecraft 1.21.11.',
  'Die Mod weist beim Start auf neue Versionen hin. Es werden keine Dateien automatisch ersetzt.':'The mod checks for new versions at startup. No files are replaced automatically.',
};
Object.assign(translations,{"Item Track": "Item Track", "Deine Items. Dein Überblick.": "Your items. Your awareness.", "Bis zu acht Item-Typen verfolgen: Webs, Totems, Enderperlen und Crystals. Die erfassten Nutzungen stehen direkt über dem Spieler.": "Track up to eight item types: webs, totems, ender pearls and crystals. Observed uses appear directly above the player.", "Spieler": "Players", "Dein Fokus im Kampf.": "Your focus in combat.", "Geladene Spieler auswählen oder durch einen Angriff als Ziel setzen. Ziele lassen sich wieder abwählen. Ohne Gegner-Modus werden nahe Spieler angezeigt.": "Select loaded players or attack to set your target. Deselect targets at any time. With opponent mode off, nearby players are shown.", "Visuals": "Visuals", "Die Quelle im Wasser sehen.": "Find the source in the flow.", "Wasserquellen cyan hervorheben, fließendes Wasser unterscheiden und mit einer eigenen Taste ein- oder ausschalten. Die Suche bleibt auf die Nähe begrenzt.": "Highlight water sources in cyan, distinguish flowing water and toggle with a custom key. Scanning stays local.", "Border": "Border", "Drei Arenen. Eine Taste.": "Three arenas. One key.", "Galaxy, Colloseum oder Japan auswählen und die vermessene Border per Keybind einblenden. Eine rein visuelle Hilfe ohne Kollision.": "Choose Galaxy, Colloseum or Japan and toggle its measured border with a keybind. A visual guide without collision.", "Koordinaten": "Coordinates", "Teile deinen Standort.": "Share your location.", "Koordinaten mit eigener Taste kopieren: XYZ, XY oder XZ, ohne Nachkommastellen. Die Bestätigung erscheint nur bei dir, nicht im Server-Chat.": "Copy coordinates with a custom key: XYZ, XY or XZ, without decimals. Confirmation appears locally, never in server chat.", "Einstellungen": "Settings", "Einmal einstellen. Behalten.": "Set it once. Keep it.", "Tracking, Nullwerte, Reichweite und Gegner-Modus einstellen. Sprache und Einstellungen bleiben gespeichert. Hier kannst du das Tutorial erneut anzeigen und Downloads öffnen.": "Configure tracking, zero counts, range and opponent mode. Language and settings are saved. Replay the tutorial and open downloads here.", "Version 1.7.0 · Aktuelle Aufnahme aus einer lokalen Testwelt.": "Version 1.7.0 · Current capture from a local test world.", "Screenshot vergrößern": "Enlarge screenshot", "KOORDINATEN AUSPROBIEREN": "TRY COORDINATES", "Eine Taste. Kopiert.": "One key. Copied.", "Website-Demo mit Beispielwerten. Negative Koordinaten werden korrekt abgerundet.": "Website demo with example values. Negative coordinates are rounded down correctly.", "Koordinatenformat": "Coordinate format", "Beispiel kopieren": "Copy example", "Deine Map.": "Your map.", "Deine Border.": "Your border.", "Drei vermessene Arenen. Wähle deine Vorschau.": "Three measured arenas. Pick your preview.", "Arena auswählen": "Choose an arena", "Map-Bilder aus dem Spiel. Die Border ist eine visuelle Annäherung an die gemessenen Punkte.": "In-game map images. The border visually approximates the measured points.", "AUCH DRUMHERUM GEDACHT": "THE DETAILS MATTER", "Kleine Details.": "Small details.", "Guter Start.": "A good start.", "Willkommen im Spiel.": "Welcome in-game.", "Beim ersten Ingame-Start zeigt eine kompakte Karte deinen aktuellen Menü-Keybind mit winkendem Skin. Sie bleibt bis zum Öffnen der Mod und lässt sich in den Einstellungen erneut anzeigen.": "On your first in-game launch, a compact card shows your current menu keybind with a waving skin. It stays until you open the mod and can be replayed in Settings.", "Tutorial in Einstellungen ↗": "Tutorial in Settings ↗", "Updates mitbekommen.": "Stay up to date.", "Beim Start prüft die Mod im Hintergrund, ob eine neue kompatible Version bereitsteht. Du entscheidest, wann du sie herunterlädst. Keine automatische Installation.": "At startup, the mod checks in the background for a new compatible version. You choose when to download it. No automatic installation.", "Aktuelle Version ansehen ↗": "View the latest version ↗", "Vorschau schließen": "Close preview"});
export function translateText(value) {
  const key=value.trim();
  let translated=translations[key];
  if(translated===undefined && key.startsWith('Version veröffentlichen · ')) translated=key.replace('Version veröffentlichen','Publish a version');
  if(translated===undefined && /^Download der vollständigen Mod-JAR · [0-9.]+ MB$/.test(key)) translated=key.replace('Download der vollständigen Mod-JAR','Complete mod JAR');
  return translated===undefined ? value : value.replace(key,translated);
}
export function localizeHtml(html,lang='de',path='/') {
  html=html.replace(/<!-- language-switch:start -->[\s\S]*?<!-- language-switch:end -->/g,'');
  if(lang==='en') {
    html=html.replace(/assets\/current\/([a-z]+)-de\.png/g,'assets/current/$1-en.png');
    let raw=false;
    html=html.split(/(<!--[\s\S]*?-->|<[^>]+>)/g).map(part=>{
      if(/^<(script|style)\b/i.test(part)) raw=true;
      if(/^<\/(script|style)>/i.test(part)) raw=false;
      if(part.startsWith('<')) return part.replace(/\b(alt|aria-label|title|content)="([^"]*)"/g,(_,name,value)=>`${name}="${translateText(value).replace(/"/g,'&quot;')}"`);
      return raw ? part : translateText(part);
    }).join('');
  }
  return html.replace(/<html lang="[^"]*"/,'<html lang="'+lang+'"').replace('</header>',languageSwitch(lang,path)+'</header>');
}
export async function localizeResponse(response,lang,path) {
  const headers=new Headers(response.headers);
  headers.set('Content-Language',lang);headers.set('Vary','Cookie');headers.set('Cache-Control','no-store');
  return new Response(localizeHtml(await response.text(),lang,path),{status:response.status,headers});
}
