"""Regras da API. Recebe o pedido já separado (método, caminho, token, corpo) e devolve (código, resposta).

Fica separado do servidor para funcionar igual no computador (routes.py) e na hospedagem (wsgi.py).
"""
import json
import secrets
import sqlite3
from urllib.parse import parse_qs, unquote, urlsplit

from auth import confere_senha, hash_senha
from config import ANEXO_MAX_MB
from database import (anexo, conectar, criar_sessao, dados_do_portal, encerrar_sessao, gravar_dados, ler_dados,
                      salvar_anexo, usuario_da_sessao)

SESSAO_EXPIRADA = (401, {"erro": "Sessão expirada"})
SO_ADMIN = (403, {"erro": "Apenas administradores"})
NAO_ACHOU = (404, {"erro": "Rota não encontrada"})


def tratar(metodo, caminho, token, corpo):
    """Devolve (código, resposta). Para baixar anexo, a resposta é {"arquivo": caminho, "nome": nome}."""
    partes = urlsplit(caminho)
    caminho, query = partes.path, parse_qs(partes.query)

    # anexos: o envio vem como arquivo puro (não JSON) e o download abre num link, por isso o token pode vir na URL
    if caminho == "/api/anexos" and metodo == "POST":
        if not usuario_da_sessao(token):
            return SESSAO_EXPIRADA
        if len(corpo) > ANEXO_MAX_MB * 1024 * 1024:
            return 400, {"erro": f"Arquivo maior que {ANEXO_MAX_MB} MB"}
        if not corpo:
            return 400, {"erro": "Arquivo vazio"}
        ident = salvar_anexo(corpo)
        return 201, {"id": ident, "nome": unquote((query.get("nome") or ["arquivo"])[0])[:200],
                     "url": f"/api/anexos/{ident}"}
    if caminho.startswith("/api/anexos/") and metodo == "GET":
        if not usuario_da_sessao(token or (query.get("t") or [""])[0]):
            return SESSAO_EXPIRADA
        achado = anexo(caminho.removeprefix("/api/anexos/"))
        return (200, {"arquivo": achado[0], "nome": achado[1]}) if achado else (404, {"erro": "Arquivo não encontrado"})

    try:
        d = json.loads(corpo or b"{}") if metodo in ("POST", "PUT") else {}
    except ValueError:
        return 400, {"erro": "JSON inválido"}
    usuario = usuario_da_sessao(token)

    if metodo == "GET":
        if caminho == "/api/ping":
            return 200, {"ok": True}
        if caminho == "/api/dados":
            return (200, ler_dados()) if usuario else SESSAO_EXPIRADA
        if caminho.startswith("/api/portal/"):
            dados = dados_do_portal(caminho.removeprefix("/api/portal/"))
            return (200, dados) if dados else (404, {"erro": "Link inválido ou desativado."})
        return NAO_ACHOU

    if metodo == "PUT":
        if caminho != "/api/dados":
            return NAO_ACHOU
        if not usuario:
            return SESSAO_EXPIRADA
        try:
            gravar_dados(d)
        except (sqlite3.Error, KeyError, ValueError, TypeError) as e:
            return 400, {"erro": f"Não foi possível salvar: {e}"}
        return 200, {"ok": True}

    if metodo != "POST":
        return NAO_ACHOU

    if caminho == "/api/login":
        with conectar() as con:
            r = con.execute("SELECT * FROM usuario WHERE email=? AND ativo=1",
                            ((d.get("email") or "").strip().lower(),)).fetchone()
        if not r or not confere_senha(d.get("senha") or "", r["senha_hash"]):
            return 401, {"erro": "E-mail ou senha inválidos."}
        u = {"id": r["id_usuario"], "nome": r["nome"], "perfil": r["perfil"]}
        return 200, {"token": criar_sessao(r["id_usuario"]), "usuario": u}

    if caminho == "/api/logout":
        encerrar_sessao(token)
        return 200, {"ok": True}

    if caminho == "/api/esqueci":
        with conectar() as con:  # resposta igual exista ou não o e-mail (não revela quem tem conta)
            con.execute("UPDATE usuario SET pedido_senha=1 WHERE email=? AND ativo=1",
                        ((d.get("email") or "").strip().lower(),))
        return 200, {"ok": True}

    if caminho == "/api/senha":
        if not usuario:
            return SESSAO_EXPIRADA
        nova = d.get("nova") or ""
        if len(nova) < 6:
            return 400, {"erro": "A nova senha precisa ter pelo menos 6 caracteres."}
        with conectar() as con:
            r = con.execute("SELECT senha_hash FROM usuario WHERE id_usuario=?", (usuario["id"],)).fetchone()
            if not r or not confere_senha(d.get("atual") or "", r["senha_hash"]):
                return 400, {"erro": "Senha atual incorreta."}
            con.execute("UPDATE usuario SET senha_hash=?, pedido_senha=0 WHERE id_usuario=?",
                        (hash_senha(nova), usuario["id"]))
        return 200, {"ok": True}

    if caminho == "/api/usuarios/senha":
        if not usuario or usuario["perfil"] != "administrador":
            return SO_ADMIN
        if len(d.get("nova") or "") < 6:
            return 400, {"erro": "Mínimo de 6 caracteres"}
        with conectar() as con:
            con.execute("UPDATE usuario SET senha_hash=?, pedido_senha=0 WHERE id_usuario=?",
                        (hash_senha(d["nova"]), d.get("id")))
            con.execute("DELETE FROM sessao WHERE id_usuario=?", (d.get("id"),))
        return 200, {"ok": True}

    if caminho == "/api/usuarios":
        if not usuario or usuario["perfil"] != "administrador":
            return SO_ADMIN
        nome, email = (d.get("nome") or "").strip(), (d.get("email") or "").strip().lower()
        senha = d.get("senha") or ""
        if not nome or "@" not in email or len(senha) < 6 or d.get("perfil") not in ("administrador", "assistente"):
            return 400, {"erro": "Dados inválidos"}
        try:
            with conectar() as con:
                con.execute("INSERT INTO usuario (id_usuario,nome,email,senha_hash,perfil,ativo) VALUES (?,?,?,?,?,1)",
                            ("u" + secrets.token_hex(4), nome, email, hash_senha(senha), d["perfil"]))
        except sqlite3.IntegrityError:
            return 409, {"erro": "E-mail já cadastrado"}
        return 201, {"ok": True}

    return NAO_ACHOU
