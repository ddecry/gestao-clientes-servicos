"""Servidor local (http.server): entrega os arquivos da tela e repassa /api/ para o api.py."""
import json
import mimetypes
import sys
from urllib.parse import quote
from http.server import SimpleHTTPRequestHandler

from api import tratar
from config import FRONTEND


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(FRONTEND), **k)

    def log_message(self, fmt, *args):
        if "/api/" in (args[0] if args else ""):
            sys.stderr.write("%s\n" % (fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _api(self, metodo):
        token = (self.headers.get("Authorization") or "").removeprefix("Bearer ").strip()
        corpo = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        codigo, resposta = tratar(metodo, self.path, token, corpo)
        if codigo == 200 and "arquivo" in resposta:
            dados = resposta["arquivo"].read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(resposta["nome"])[0] or "application/octet-stream")
            self.send_header("Content-Disposition", f"inline; filename*=UTF-8''{quote(resposta['nome'])}")
            self.send_header("Content-Length", str(len(dados)))
            self.end_headers()
            self.wfile.write(dados)
            return
        saida = json.dumps(resposta, ensure_ascii=False).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(saida)))
        self.end_headers()
        self.wfile.write(saida)

    def do_GET(self):
        if self.path.startswith("/api/"):
            return self._api("GET")
        if self.path.split("?")[0] == "/portal":
            self.path = "/portal.html"
        return super().do_GET()

    def do_POST(self):
        self._api("POST")

    def do_PUT(self):
        self._api("PUT")
