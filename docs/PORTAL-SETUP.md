# Konten- und Report-Portal einrichten

Die Website enthält das Portal bereits. Ohne Konfiguration bleiben Anmeldung und Reports ausdrücklich deaktiviert (HTTP 503); es gibt keine Demo-Konten und keinen Ersatz-Adminzugang. Die bisherige Website-Vorschau bleibt durch ihren Passcode geschützt.

## 1. Supabase

1. Ein Projekt in der EU-Region anlegen. Vor einem kostenpflichtigen Tarif selbst die Kosten prüfen.
2. `supabase/migrations/001_portal.sql` und danach `supabase/migrations/002_profiles.sql` jeweils einmal vollständig im SQL Editor ausführen. Die Migration ist für eine neue Datenbank gedacht.
3. In Vercel ausschließlich folgende serverseitigen Umgebungsvariablen setzen:
   - `SUPABASE_URL`: `https://PROJEKT.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: der **publishable** Key; alternativ der alte `anon` Key. Keinen Secret-/service_role-Key verwenden.
   - `PORTAL_PROVIDERS`: erst nach Einrichtung der Anbieter, z. B. `discord,email,google,azure`.
4. In Auth → URL Configuration: Site URL `https://aplejouice.com`, erlaubte Redirect URL **exakt** `https://aplejouice.com/auth/callback`. Keine Wildcards.
5. E-Mail-Bestätigung aktiv lassen. Auth-Rate-Limits prüfen. JWT-Laufzeit auf etwa 15 Minuten setzen. Supabase- und Vercel-Konten selbst mit MFA schützen.
6. Ein neues Vercel-Deployment auslösen. Die Website benötigt keinen geheimen Schlüssel im Browser und kein Auth-localStorage.

## 2. Discord (zuerst)

1. Im Discord Developer Portal eine Anwendung erstellen. Das Akzeptieren neuer Nutzungsbedingungen übernimmt der Kontoinhaber.
2. Unter OAuth2 die von Supabase angezeigte Callback-URL exakt eintragen: `https://PROJEKT.supabase.co/auth/v1/callback`.
3. Client ID und Client Secret direkt in Supabase → Auth → Providers → Discord setzen, nicht in Git oder Chat.
4. Discord aktivieren und `discord` zu `PORTAL_PROVIDERS` hinzufügen.
5. Mit dem vorgesehenen Discord-Konto anmelden. Adminbesitzer ist ausschließlich die von Discord bestätigte Provider-ID `928019899211743305` – kein Anzeigename, E-Mail-Text oder User-Metadatum.
6. Unter `/270211` einen TOTP-Authenticator einrichten und bestätigen. Erst `aal2` erlaubt Zugriff auf fremde Reports und Statusänderungen. Die URL ist kein Passwort.
7. Prüfen: anderes Konto erhält HTTP 403; Besitzer ohne MFA sieht nur die Sicherheitsprüfung; Besitzer mit MFA sieht Reports.

Die E-Mail-Anmeldung allein macht niemanden zum Admin. Für den Adminzugang muss die verifizierte Discord-Identität zum Account gehören. Kontoverknüpfungen nur über den Auth-Anbieter und verifizierte Identitäten verwalten.

## 3. E-Mail

Der Website-Flow verwendet Einmalcodes statt eigener Passwörter. In Supabase eine eigene SMTP-Verbindung einrichten (Secret direkt im Dashboard); die Standard-Testzustellung ist für einen öffentlichen Betrieb nicht ausreichend.

In den Supabase-E-Mail-Templates für Magic Link/Anmeldung und Registrierung den sechs-/achtstelligen `{{ .Token }}` anzeigen, nicht nur einen Link. Bestätigung bleibt aktiviert. Danach `email` freischalten. Der Browser erhält bei der Code-Anforderung immer dieselbe neutrale Antwort. Supabase übernimmt OTP-Ablauf und Rate-Limits.

## 4. Google und Microsoft

Google: OAuth-Anwendung in Google Cloud, exakte Supabase-Callback-URL, Client ID/Secret in Supabase → Google. Veröffentlichung/Consent-Screen im eigenen Konto fertigstellen. Danach `google` aktivieren.

Microsoft: App in Microsoft Entra mit Unterstützung persönlicher Microsoft-Konten, Web-Callback auf Supabase, Provider `Azure` konfigurieren. Die Website fordert den `email`-Scope an. Danach `azure` aktivieren. Keine automatische Behauptung von Minecraft-Besitz: Microsoft-Login ist keine Xbox-/Minecraft-Lizenzprüfung.

## 5. Minecraft-Skin

Im Konto lässt sich ein Minecraft-Name für die eigene Demo-Vorschau wählen. Der Server löst das Profil bei Mojang auf und liefert ausschließlich PNG-Texturen vom festen Host `textures.minecraft.net`, ohne frei wählbare Proxy-Ziele. Diese Auswahl bestätigt keinen Kontobesitz und gewährt keinerlei Rechte. Eine voll verifizierte Xbox-/Minecraft-Anmeldung ist **noch nicht implementiert**; dafür wäre ein separater genehmigter Microsoft/Xbox-Flow nötig.

## 6. Datenschutz und Betrieb

Reports sind nur dem Absender und dem Discord-Admin mit MFA zugänglich. Antwort und Status sind auch für den Absender sichtbar. Es gibt keine Datei-Uploads. Der Datenbank-Trigger begrenzt jeden Nutzer auf fünf Reports pro Stunde und protokolliert Moderation intern. SDK-Sitzungscookies sind Secure, HttpOnly und SameSite=Lax; Mutationen benötigen einen passenden Origin. Jede Anfrage verwendet einen eigenen Server-Client und validiert Nutzer beim Auth-Server. Alle Portalantworten sind nicht cachebar.

Vor Freischaltung in der eigenen Supabase-Testumgebung die SQL-Checks aus `supabase/security-checks.sql` ausführen und die echten OAuth-/OTP-/MFA-Flows mit zwei Konten prüfen. Diese Live-Prüfung kann ohne angelegtes Projekt nicht erfolgen. Auftragsverarbeitung, Datenlöschfristen und die Datenschutzhinweise mit der tatsächlichen Konfiguration abgleichen. Keine Garantie absoluter Sicherheit.

## Wiederherstellung

Wenn der Authenticator verloren geht, Faktor ausschließlich im eigenen Supabase-Dashboard nach Kontoprüfung zurücksetzen. Keine Recovery-Abkürzung anhand von URL, E-Mail oder Benutzername einbauen. Supabase-/Vercel-Zugriffe und Secrets nicht weitergeben.

## Profile und Bilder

`002_profiles.sql` ergänzt Benutzernamen (3–20 ASCII-Zeichen, ohne Groß-/Kleinschreibungs-Duplikate), einen kurzen Profiltext und eine Profilbild-Auswahl. Die vorhandenen RLS-Regeln bleiben auf das eigene Profil beschränkt. Namen oder Bilder erteilen keine Adminrechte.

Eigene Bilder werden im Browser zentriert zugeschnitten und als 128×128-PNG übertragen. Der Server prüft Signatur, Chunk-CRC, erlaubte Chunk-Typen, Bildmaße und die begrenzte entpackte Pixelmenge. SVG-, Metadaten- und Animations-Uploads sind ausgeschlossen. Der PNG-Inhalt wird privat beim eigenen Profil gespeichert; die Bildroute braucht eine angemeldete Sitzung. Originaldatei und Dateiname werden nicht hochgeladen.

Die Datenschutzhinweise unter `/datenschutz` beschreiben die aktuelle Verwendung von Hosting, Konten, Profilen und Reports. Die tatsächlich gewählte Supabase-Region ist London (UK), nicht Deutschland. Weitere Anbieter werden nur nach eigener Konfiguration über `PORTAL_PROVIDERS` aktiviert.

## Clan applications

Clan applications use existing `portal_reports` records with `kind=feedback` and the fixed `mod_version=clan-application-v1` marker. No new table, migration or public grants are needed. Existing row isolation, owner MFA, audit trail and combined five-per-hour database limit apply unchanged. The admin inbox filters before pagination; the application page queries only the current user's applications. An application does not grant clan membership or any website role.

Members are intentionally placeholders until real Minecraft names and ranks are supplied. Do not publish guessed roster data.
