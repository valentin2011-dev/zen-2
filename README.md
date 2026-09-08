[README.md](https://github.com/user-attachments/files/31965696/README.md)
# ZEN PWA — V1.4

PWA personnelle de Valentin, conçue pour GitHub Pages.

## Correction V1.1
- démarrage anti-écran gris/blanc ;
- récupération d'un `localStorage` ancien ou corrompu ;
- une erreur JavaScript non critique ne bloque plus l'ouverture ;
- service worker versionné pour éviter le cache de l'ancienne V1 ;
- navigation et modales rebinding plus robustes ;
- notes, projets, photos, quotes et réglages conservés localement.

## GitHub Pages
1. Décompresser le ZIP.
2. Mettre tous les fichiers du dossier à la racine du repository.
3. GitHub → Settings → Pages → Deploy from branch → `main` / root.
4. Ouvrir l'URL GitHub Pages.

### Si une ancienne V1 est déjà installée
Sur le navigateur : désinstaller l'ancienne PWA / vider les données du site une fois, puis recharger. La V1.1 utilise aussi un nouveau nom de cache (`zen-pwa-v1-1`).
