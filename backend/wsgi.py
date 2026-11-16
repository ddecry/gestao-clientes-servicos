"""Versão WSGI do servidor, usada na hospedagem (PythonAnywhere ou qualquer serviço que rode WSGI).

Faz o mesmo que o routes.py: entrega os arquivos da pasta frontend e repassa /api/ para o api.py.
Na hospedagem, o arquivo de configuração WSGI só precisa fazer:  from wsgi import application
"""
import json
import mimetypes
import sys
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parent))

from api import tratar  # noqa: E402
from config import FRONTEND  # noqa: E402
from database import fazer_backup, iniciar_banco  # noqa: E402

iniciar_banco()

STATUS = {200: "200 OK", 201: "201 Created", 400: "400 Bad Request", 401: "401 Unauthorized",
          403: "403 Forbidden", 404: "404 Not Found", 409: "409 Conflict"}


def _arquivo(caminho):
    if caminho in ("", "/"):
        caminho = "/index.html"
    if caminho == "/portal":
        caminho = "/portal.html"
    alvo = (FRONTEND / caminho.lstrip("/")).resolve()
    if FRONTEND.resolve() not in alvo.parents or not alvo.is_file():
        return None
    return alvo


def application(environ, start_response):
    caminho = environ.get("PATH_INFO", "/")
    metodo = environ.get("REQUEST_METHOD", "GET")

    if caminho.startswith("/api/"):
        fazer_backup()  # no máximo um por dia; os seguintes só conferem que já existe
        tamanho = int(environ.get("CONTENT_LENGTH") or 0)
        corpo = environ["wsgi.input"].read(tamanho) if tamanho else b""
        token = (environ.get("HTTP_AUTHORIZATION") or "").removeprefix("Bearer ").strip()
        consulta = environ.get("QUERY_STRING", "")
        codigo, resposta = tratar(metodo, caminho + ("?" + consulta if consulta else ""), token, corpo)
        if codigo == 200 and "arquivo" in resposta:
            dados = resposta["arquivo"].read_bytes()
            start_response("200 OK", [
                ("Content-Type", mimetypes.guess_type(resposta["nome"])[0] or "application/octet-stream"),
                ("Content-Disposition", f"inline; filename*=UTF-8''{quote(resposta['nome'])}"),
                ("Content-Length", str(len(dados)))])
            return [dados]
        saida = json.dumps(resposta, ensure_ascii=False).encode()
        start_response(STATUS.get(codigo, f"{codigo} Erro"), [
            ("Content-Type", "application/json; charset=utf-8"), ("Content-Length", str(len(saida))),
            ("Cache-Control", "no-store")])
        return [saida]

    alvo = _arquivo(caminho)
    if not alvo:
        start_response("404 Not Found", [("Content-Type", "text/plain; charset=utf-8")])
        return ["Página não encontrada".encode()]
    tipo = mimetypes.guess_type(alvo.name)[0] or "application/octet-stream"
    if tipo.startswith("text/") or tipo.endswith("javascript"):
        tipo += "; charset=utf-8"
    dados = alvo.read_bytes()
    start_response("200 OK", [("Content-Type", tipo), ("Content-Length", str(len(dados))), ("Cache-Control", "no-cache")])
    return [dados]
