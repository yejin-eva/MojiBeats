# YouTube Real Beat Detection via yt-dlp Server

## Status: Paused — bot detection blocker

The server is deployed at https://mojibeats.onrender.com but YouTube blocks
datacenter IPs with bot detection. Need to solve cookie/auth before enabling
the frontend integration.

## What's Done

- `server/` folder with Flask API (app.py, Dockerfile, requirements.txt)
- Render deployment (Docker with ffmpeg + deno + yt-dlp)
- Server endpoints work: `/api/youtube?url=...` and `/api/download?token=...`
- `src/config.js` has `YOUTUBE.API_URL` ready (currently reverted)
- Frontend integration code was tested and works (reverted for now)

## Remaining: Fix YouTube Bot Detection

YouTube's "Sign in to confirm you're not a bot" error blocks yt-dlp on
Render's datacenter IP. Options:

### Option A: Cookie Authentication
1. Export YouTube cookies via browser extension ("Get cookies.txt LOCALLY")
2. Add as Render Secret File (`/etc/secrets/cookies.txt`)
3. Update yt-dlp commands: add `--cookies /etc/secrets/cookies.txt`
4. Cookies expire periodically — need manual refresh

### Option B: OAuth2 with yt-dlp
- yt-dlp supports `--username` / OAuth flows
- More persistent than cookies but more complex to set up

### Option C: Proxy through residential IP
- Route yt-dlp through a residential proxy to avoid datacenter detection
- Most reliable but costs money

## Frontend Integration (Ready to Re-apply)

When bot detection is solved, re-apply the frontend changes:

1. `src/config.js` — add `API_URL` to `YOUTUBE` config:
   ```js
   API_URL: import.meta.env.VITE_YT_API_URL || 'http://localhost:5000',
   ```

2. `src/scenes/SongSelectScene.js` — rewrite `handleYouTubeUrl()`:
   - Remove `showBpmDialog()` (no longer needed)
   - Fetch from server → get MP3 blob → run BeatDetector → save with audioBlob
   - Update `playSavedSong()`: YouTube songs with audioBlob use AudioManager path

3. `.github/workflows/deploy.yml` (web branch) — already has:
   ```yaml
   env:
     VITE_YT_API_URL: https://mojibeats.onrender.com
   ```

## Reference Commit

The full frontend integration was in commit `8fa8aa0` (reverted by `b677865`).
Can be cherry-picked or re-applied when ready.
