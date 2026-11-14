#!/usr/bin/env python3
"""Emerald Caverns – Webserver mit gemeinsamer Highscore-Liste.

Liefert das Spiel aus dist/ aus (wie bisher python3 -m http.server) und bietet
zusätzlich /api/highscores:
  GET  -> Liste aller Spieler (Name, Punkte, Level, erledigte Level, zuletzt gespielt)
          und die letzten 30 beendeten Spiele
  /api/profiles: Spielerprofile mit Spielstand (GET alle, POST speichern/löschen) in profile.json
  POST -> {"players":[{"name":..,"score":..,"level":..,"completed":..}, ...],
            "games":[{"id":..,"name":..,"score":..,"level":..,"result":"gameover"|"completed"}, ...]}
Gespeichert wird in highscores.json, letzte-spiele.json und profile.json im Datenordner
(daten/ neben dieser Datei oder EMERALD_DATA).
Aufruf: python3 server.py [port]   (nur fürs Heimnetz gedacht – keine Anmeldung)
"""
import json
import os
import re
import sys
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE = os.path.dirname(os.path.abspath(__file__))
# Spiel liegt neben server.py (Veröffentlichung) oder im Unterordner dist/ (Installation auf dem Pi)
DIST = BASE if os.path.exists(os.path.join(BASE, 'index.html')) else os.path.join(BASE, 'dist')
DATA_DIR = os.environ.get('EMERALD_DATA') or (os.path.join(BASE, 'daten') if DIST == BASE else BASE)
os.makedirs(DATA_DIR, exist_ok=True)
DATA = os.path.join(DATA_DIR, 'highscores.json')
GAMES = os.path.join(DATA_DIR, 'letzte-spiele.json')
PROFILES = os.path.join(DATA_DIR, 'profile.json')
PROFILE_API = '/api/profiles'
MAX_PROFILES = 100
MAX_PROFILE_BYTES = 120 * 1024
MAX_PROFILE_BODY = 1024 * 1024
MAX_GAMES = 200
SHOW_GAMES = 30
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8091
API = '/api/highscores'
MAX_PLAYERS = 500
MAX_BODY = 32 * 1024
LOCK = threading.Lock()


def load(path=DATA, kind=dict):
    try:
        with open(path, encoding='utf-8') as f:
            data = json.load(f)
        return data if isinstance(data, kind) else kind()
    except (OSError, ValueError):
        return kind()


def save(data, path=DATA):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def clean_name(value):
    if not isinstance(value, str):
        return None
    name = re.sub(r'\s+', ' ', value).strip()
    if not 1 <= len(name) <= 24 or any(ord(c) < 32 for c in name):
        return None
    return name


def as_int(value, lo, hi):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    value = int(value)
    return value if lo <= value <= hi else None


def ranking(data):
    rows = sorted(data.values(), key=lambda p: (-p['score'], -p['level'], p['name'].casefold()))
    return [dict(row, rank=i + 1) for i, row in enumerate(rows)]


class Handler(SimpleHTTPRequestHandler):
    def _json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        path = self.path.split('?', 1)[0]
        if path == '/' or path.endswith(('.html', '.js', '.css')):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def blocked(self):
        # Daten, Server und Werkzeuge nie als Datei ausliefern
        path = self.path.split('?', 1)[0].lower()
        return (path.startswith(('/daten', '/tools', '/.git')) or path.endswith(('.py', '.json', '.tmp'))
                or path in ('/license', '/readme.md', '/.gitignore'))

    def do_HEAD(self):
        if self.blocked():
            return self._json(404, {'error': 'nicht gefunden'})
        return super().do_HEAD()

    def do_GET(self):
        if self.path.split('?', 1)[0] not in (API, PROFILE_API) and self.blocked():
            return self._json(404, {'error': 'nicht gefunden'})
        if self.path.split('?', 1)[0] == PROFILE_API:
            with LOCK:
                store = load(PROFILES)
                return self._json(200, {'profiles': store.get('profiles', {}), 'deleted': store.get('deleted', {})})
        if self.path.split('?', 1)[0] == API:
            with LOCK:
                games = load(GAMES, list)[-SHOW_GAMES:][::-1]
                return self._json(200, {'players': ranking(load()), 'games': games})
        return super().do_GET()

    def save_profiles(self):
        try:
            length = int(self.headers.get('Content-Length') or 0)
            if not 0 < length <= MAX_PROFILE_BODY:
                return self._json(413, {'error': 'zu groß'})
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
            incoming = payload.get('profiles') if isinstance(payload, dict) else None
            deleted = payload.get('deleted', []) if isinstance(payload, dict) else []
            if not isinstance(incoming, dict) or not isinstance(deleted, list):
                return self._json(400, {'error': 'ungültig'})
        except (ValueError, UnicodeDecodeError):
            return self._json(400, {'error': 'ungültig'})
        now = int(time.time() * 1000)
        with LOCK:
            store = load(PROFILES)
            profiles = store.get('profiles') if isinstance(store.get('profiles'), dict) else {}
            tombs = store.get('deleted') if isinstance(store.get('deleted'), dict) else {}
            for key in deleted[:20]:
                if isinstance(key, str) and key in profiles:
                    del profiles[key]
                    tombs[key] = now
            for key, prof in list(incoming.items())[:MAX_PROFILES]:
                if not isinstance(prof, dict):
                    continue
                name = clean_name(prof.get('name'))
                saved = as_int(prof.get('savedAt'), 0, 10**14)
                if (name is None or saved is None or key != name.lower() or not isinstance(prof.get('state'), dict)
                        or not isinstance(prof.get('progress'), dict)
                        or len(json.dumps(prof, ensure_ascii=False)) > MAX_PROFILE_BYTES):
                    continue
                if saved <= tombs.get(key, -1):
                    continue
                old = profiles.get(key)
                if old is None and len(profiles) >= MAX_PROFILES:
                    continue
                if old is not None and saved < (old.get('savedAt') or 0):
                    continue
                if old is not None:
                    a, b = old.get('progress') or {}, prof['progress']
                    try:
                        prof['progress'] = {
                            'unlocked': max(int(a.get('unlocked') or 0), int(b.get('unlocked') or 0)),
                            'completed': sorted({int(x) for x in (a.get('completed') or []) + (b.get('completed') or [])}),
                        }
                    except (TypeError, ValueError):
                        pass
                profiles[key] = prof
                tombs.pop(key, None)
            save({'profiles': profiles, 'deleted': tombs}, PROFILES)
            return self._json(200, {'ok': True})

    def do_POST(self):
        if self.path.split('?', 1)[0] == PROFILE_API:
            return self.save_profiles()
        if self.path.split('?', 1)[0] != API:
            return self._json(404, {'error': 'unbekannt'})
        try:
            length = int(self.headers.get('Content-Length') or 0)
            if not 0 < length <= MAX_BODY:
                return self._json(413, {'error': 'zu groß'})
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
            players = payload.get('players') if isinstance(payload, dict) else None
            if not isinstance(players, list):
                return self._json(400, {'error': 'players fehlt'})
        except (ValueError, UnicodeDecodeError):
            return self._json(400, {'error': 'ungültig'})
        now = int(time.time() * 1000)
        with LOCK:
            data = load()
            changed = False
            for entry in players[:50]:
                if not isinstance(entry, dict):
                    continue
                name = clean_name(entry.get('name'))
                score = as_int(entry.get('score'), 0, 10**9)
                level = as_int(entry.get('level'), 1, 10000)
                completed = as_int(entry.get('completed'), 0, 10000)
                if name is None or score is None or level is None or completed is None:
                    continue
                key = name.casefold()
                old = data.get(key)
                if old is None and len(data) >= MAX_PLAYERS:
                    continue
                new = {
                    'name': name,
                    'score': max(score, old['score']) if old else score,
                    'level': max(level, old['level']) if old else level,
                    'completed': max(completed, old['completed']) if old else completed,
                    'updatedAt': now,
                }
                if old != new:
                    data[key] = new
                    changed = True
            if changed:
                save(data)
            games_in = payload.get('games')
            if isinstance(games_in, list) and games_in:
                games = load(GAMES, list)
                known = {g.get('id') for g in games if isinstance(g, dict)}
                added = False
                for g in games_in[:50]:
                    if not isinstance(g, dict):
                        continue
                    gid = g.get('id')
                    name = clean_name(g.get('name'))
                    score = as_int(g.get('score'), 0, 10**9)
                    level = as_int(g.get('level'), 1, 10000)
                    result = g.get('result')
                    if (not isinstance(gid, str) or not re.fullmatch(r'[a-z0-9]{4,40}', gid) or gid in known
                            or name is None or score is None or level is None or result not in ('gameover', 'completed')):
                        continue
                    games.append({'id': gid, 'name': name, 'score': score, 'level': level, 'result': result, 'at': now})
                    known.add(gid)
                    added = True
                if added:
                    save(games[-MAX_GAMES:], GAMES)
            return self._json(200, {'ok': True})

    def log_message(self, fmt, *args):
        if not self.path.startswith('/api/'):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    handler = partial(Handler, directory=DIST)
    server = ThreadingHTTPServer(('0.0.0.0', PORT), handler)
    print(f'Emerald Caverns läuft auf Port {PORT} (Highscores: {DATA})', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
