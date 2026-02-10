import os
import uuid
import time
import threading
import subprocess
import json
from pathlib import Path

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DOWNLOADS_DIR = Path(__file__).parent / 'downloads'
DOWNLOADS_DIR.mkdir(exist_ok=True)

TOKEN_EXPIRY_SECONDS = 300  # 5 minutes
CLEANUP_INTERVAL_SECONDS = 60

# In-memory token store: token -> { path, title, duration, created_at }
tokens = {}


def cleanup_expired():
    """Remove expired tokens and their files."""
    now = time.time()
    expired = [t for t, info in tokens.items() if now - info['created_at'] > TOKEN_EXPIRY_SECONDS]
    for t in expired:
        path = tokens[t]['path']
        if os.path.exists(path):
            os.remove(path)
        del tokens[t]


def cleanup_loop():
    """Background thread that periodically cleans up expired files."""
    while True:
        time.sleep(CLEANUP_INTERVAL_SECONDS)
        cleanup_expired()


threading.Thread(target=cleanup_loop, daemon=True).start()


@app.route('/api/youtube', methods=['GET'])
def youtube_download():
    url = request.args.get('url', '').strip()
    if not url:
        return jsonify({'error': 'Missing url parameter'}), 400

    token = str(uuid.uuid4())
    output_path = str(DOWNLOADS_DIR / f'{token}.mp3')

    # First, get video info (title, duration) without downloading
    info_cmd = [
        'yt-dlp',
        '--no-download',
        '--print', '%(title)s',
        '--print', '%(duration)s',
        url,
    ]

    try:
        info_result = subprocess.run(info_cmd, capture_output=True, text=True, timeout=30)
        if info_result.returncode != 0:
            return jsonify({'error': 'Failed to fetch video info', 'details': info_result.stderr}), 400

        lines = info_result.stdout.strip().split('\n')
        title = lines[0] if len(lines) > 0 else 'Unknown'
        duration = float(lines[1]) if len(lines) > 1 else 0

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Video info fetch timed out'}), 504
    except (ValueError, IndexError):
        return jsonify({'error': 'Failed to parse video info'}), 500

    # Download and convert to MP3
    download_cmd = [
        'yt-dlp',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '192K',
        '-o', output_path,
        '--no-playlist',
        '--max-filesize', '50m',
        url,
    ]

    try:
        dl_result = subprocess.run(download_cmd, capture_output=True, text=True, timeout=120)
        if dl_result.returncode != 0:
            return jsonify({'error': 'Download failed', 'details': dl_result.stderr}), 400

        # yt-dlp may add extension, find the actual file
        actual_path = output_path
        if not os.path.exists(actual_path):
            # yt-dlp sometimes outputs as .mp3 even with -o specifying it
            for ext in ['.mp3', '.mp3.mp3']:
                candidate = output_path.replace('.mp3', '') + ext
                if os.path.exists(candidate):
                    actual_path = candidate
                    break

        if not os.path.exists(actual_path):
            return jsonify({'error': 'Downloaded file not found'}), 500

        tokens[token] = {
            'path': actual_path,
            'title': title,
            'duration': duration,
            'created_at': time.time(),
        }

        return jsonify({
            'token': token,
            'title': title,
            'duration': duration,
        })

    except subprocess.TimeoutExpired:
        # Clean up partial download
        if os.path.exists(output_path):
            os.remove(output_path)
        return jsonify({'error': 'Download timed out'}), 504


@app.route('/api/download', methods=['GET'])
def download_file():
    token = request.args.get('token', '').strip()
    if not token:
        return jsonify({'error': 'Missing token parameter'}), 400

    info = tokens.get(token)
    if not info:
        return jsonify({'error': 'Token not found or expired'}), 404

    if time.time() - info['created_at'] > TOKEN_EXPIRY_SECONDS:
        # Expired
        if os.path.exists(info['path']):
            os.remove(info['path'])
        del tokens[token]
        return jsonify({'error': 'Token expired'}), 410

    if not os.path.exists(info['path']):
        return jsonify({'error': 'File not found'}), 404

    return send_file(
        info['path'],
        mimetype='audio/mpeg',
        as_attachment=True,
        download_name=f"{info['title']}.mp3",
    )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
