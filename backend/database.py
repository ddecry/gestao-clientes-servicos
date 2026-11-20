"""Banco SQLite: criação das tabelas, leitura e gravação dos dados."""
import json
import secrets
import sqlite3
from datetime import date

from auth import hash_senha
import shutil
import time

from config import ANEXOS, BACKUPS, BACKUPS_GUARDADOS, BANCO, SCHEMA


def conectar():
    con = sqlite3.connect(BANCO)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def iniciar_banco():
    BANCO.parent.mkdir(exist_ok=True)
    with conectar() as con:
        con.executescript(SCHEMA.read_text(encoding="utf-8"))
        # colunas que entraram depois da primeira versão (bancos antigos)
        for tabela, coluna in [("usuario", "pedido_senha INTEGER NOT NULL DEFAULT 0"),
                               ("cliente", "token_portal TEXT"),
                               ("comentario", "publico INTEGER NOT NULL DEFAULT 0"),
                               ("anexo", "arquivo TEXT"),
                               ("apolice", "cor TEXT")]:
            try:
                con.execute(f"ALTER TABLE {tabela} ADD COLUMN {coluna}")
            except sqlite3.OperationalError:
                pass
        if not con.execute("SELECT 1 FROM usuario LIMIT 1").fetchone():
            con.executemany(
                "INSERT INTO usuario (id_usuario,nome,email,senha_hash,perfil,ativo) VALUES (?,?,?,?,?,1)",
                [
                    ("u1", "Wilma Soares", "admin@crm.com", hash_senha("admin123"), "administrador"),
                    ("u2", "Assistente", "assistente@crm.com", hash_senha("123456"), "assistente"),
                ],
            )


def ler_dados():
    """Monta o JSON no formato que o frontend usa, a partir das tabelas."""
    with conectar() as con:
        q = lambda sql, *a: [dict(r) for r in con.execute(sql, a)]
        if not q("SELECT 1 FROM coluna LIMIT 1"):
            return {"vazio": True, "users": usuarios(con)}
        cols = [{"id": r["id_coluna"], "nome": r["nome"]} for r in q("SELECT * FROM coluna ORDER BY ordem")]
        services = [{"id": r["id_servico"], "nome": r["nome"], "descricao": r["descricao"] or "", "nicho": r["nicho"]}
                    for r in q("SELECT * FROM servico ORDER BY rowid")]
        config = {r["chave"]: json.loads(r["valor"]) for r in q("SELECT * FROM configuracao")}

        parcelas, checks = {}, {}
        for r in q("SELECT * FROM parcela ORDER BY numero"):
            parcelas.setdefault(r["id_contratacao"], []).append({
                "id": r["id_parcela"], "n": r["numero"], "valor": r["valor"], "venc": r["vencimento"],
                "paga": r["situacao"] == "paga", "dataPag": r["data_pagamento"] or ""})
        for r in q("SELECT * FROM checklist_item ORDER BY ordem"):
            checks.setdefault(r["id_contratacao"], []).append({"id": r["id_item"], "d": r["descricao"], "ok": bool(r["concluido"])})

        por_cliente = lambda sql: _agrupa(q(sql))
        contratos = por_cliente("SELECT * FROM servico_contratado ORDER BY criado_em, rowid")
        coments = por_cliente("SELECT * FROM comentario ORDER BY rowid")
        anexos = por_cliente("SELECT * FROM anexo ORDER BY rowid")
        lembretes = por_cliente("SELECT * FROM lembrete ORDER BY rowid")
        logs = por_cliente("SELECT * FROM historico ORDER BY id_historico")

        clients = []
        for r in q("SELECT * FROM cliente ORDER BY posicao_na_coluna, rowid"):
            cid = r["id_cliente"]
            clients.append({
                "id": cid, "col": r["id_coluna"], "tipo": r["tipo_pessoa"], "nome": r["nome"], "doc": r["cpf_cnpj"] or "",
                "tel": r["telefone"] or "", "email": r["email"] or "", "origem": r["origem"] or "",
                "indicado": r["indicado_por"] or "", "ativo": bool(r["ativo"]), "criado": r["criado_em"] or "",
                "portal": r["token_portal"] or "",
                "contratos": [{
                    "id": x["id_contratacao"], "serv": x["id_servico"], "valor": x["valor_combinado"], "status": x["status"],
                    "prazo": x["prazo"] or "", "assin": x["data_assinatura_contrato"] or "", "chaves": x["data_entrega_chaves"] or "",
                    "renov": x["data_renovacao"] or "", "criado": x["criado_em"] or "",
                    "check": checks.get(x["id_contratacao"], []), "parcelas": parcelas.get(x["id_contratacao"], [])}
                    for x in contratos.get(cid, [])],
                "coments": [{"id": m["id_comentario"], "u": m["usuario"] or "", "txt": m["texto"], "dt": m["data_hora"] or "",
                             "pub": bool(m["publico"])} for m in coments.get(cid, [])],
                "anexos": [{"id": a["id_anexo"], "nome": a["nome_arquivo"],
                            "url": f"/api/anexos/{a['id_anexo']}" if a["arquivo"] else a["conteudo"]}
                           for a in anexos.get(cid, [])],
                "lembretes": [{"id": l["id_lembrete"], "tipo": l["tipo"], "desc": l["descricao"], "data": l["data_hora"] or "", "ok": bool(l["concluido"])} for l in lembretes.get(cid, [])],
                "log": [{"t": h["texto"], "u": h["usuario"] or "", "dt": h["data_hora"] or ""} for h in logs.get(cid, [])],
            })
        apolices = [{"id": a["id_apolice"], "ramo": a["ramo"], "cliente": a["cliente"], "doc": a["cpf_cnpj"] or "",
                     "contato": a["contato"] or "", "produto": a["produto"] or "", "seguradora": a["seguradora"] or "",
                     "numero": a["numero"] or "", "ini": a["inicio"] or "", "fim": a["fim"] or "",
                     "comissao": a["comissao"] or "", "obs": a["observacao"] or "", "cor": a["cor"] or ""}
                    for a in q("SELECT * FROM apolice ORDER BY ordem")]
        return {"cols": cols, "services": services, "clients": clients, "users": usuarios(con), "config": config,
                "apolices": apolices}


def _agrupa(linhas):
    g = {}
    for r in linhas:
        g.setdefault(r["id_cliente"], []).append(r)
    return g


def usuarios(con):
    return [{"id": r["id_usuario"], "nome": r["nome"], "email": r["email"], "perfil": r["perfil"], "ativo": bool(r["ativo"]),
             "pedido": bool(r["pedido_senha"])}
            for r in con.execute("SELECT * FROM usuario ORDER BY rowid")]


def gravar_dados(d):
    """Grava tudo numa única transação (se algo falhar, nada é alterado)."""
    con = conectar()
    try:
        con.execute("BEGIN")
        for t in ("historico", "lembrete", "anexo", "comentario", "checklist_item", "parcela",
                  "servico_contratado", "cliente", "servico", "coluna", "configuracao", "apolice"):
            con.execute(f"DELETE FROM {t}")
        cols = d.get("cols", [])
        con.executemany("INSERT INTO coluna VALUES (?,?,?)", [(c["id"], c["nome"], i) for i, c in enumerate(cols)])
        ids_cols = {c["id"] for c in cols}
        con.executemany("INSERT INTO servico VALUES (?,?,?,?)",
                        [(s["id"], s["nome"], s.get("descricao", ""), int(s["nicho"])) for s in d.get("services", [])])
        for k, v in (d.get("config") or {}).items():
            con.execute("INSERT INTO configuracao VALUES (?,?)", (k, json.dumps(v, ensure_ascii=False)))
        for pos, c in enumerate(d.get("clients", [])):
            cid = c["id"]
            con.execute(
                "INSERT INTO cliente (id_cliente, id_coluna, tipo_pessoa, nome, cpf_cnpj, telefone, email, origem,"
                " indicado_por, ativo, posicao_na_coluna, criado_em, token_portal) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", (
                    cid, c.get("col") if c.get("col") in ids_cols else None, c.get("tipo", "F"), c["nome"], c.get("doc", ""),
                    c.get("tel", ""), c.get("email", ""), c.get("origem", ""), c.get("indicado", ""),
                    int(bool(c.get("ativo", True))), pos, c.get("criado", ""), c.get("portal") or None))
            for x in c.get("contratos", []):
                con.execute("INSERT INTO servico_contratado VALUES (?,?,?,?,?,?,?,?,?,?)", (
                    x["id"], cid, x["serv"], float(x["valor"]), x.get("status", "andamento"), x.get("prazo", ""),
                    x.get("assin", ""), x.get("chaves", ""), x.get("renov", ""), x.get("criado", "")))
                con.executemany("INSERT INTO parcela VALUES (?,?,?,?,?,?,?)", [
                    (p["id"], x["id"], p["n"], float(p["valor"]), p["venc"], "paga" if p.get("paga") else "pendente", p.get("dataPag", ""))
                    for p in x.get("parcelas", [])])
                con.executemany("INSERT INTO checklist_item VALUES (?,?,?,?,?)", [
                    (k["id"], x["id"], k["d"], int(bool(k.get("ok"))), i) for i, k in enumerate(x.get("check", []))])
            con.executemany("INSERT INTO comentario (id_comentario, id_cliente, usuario, texto, data_hora, publico)"
                            " VALUES (?,?,?,?,?,?)",
                            [(m["id"], cid, m.get("u", ""), m["txt"], m.get("dt", ""), int(bool(m.get("pub"))))
                             for m in c.get("coments", [])])
            con.executemany("INSERT INTO anexo (id_anexo, id_cliente, nome_arquivo, conteudo, enviado_em, arquivo)"
                            " VALUES (?,?,?,?,?,?)",
                            [(a["id"], cid, a["nome"], "" if _no_disco(a) else a["url"], "", a["id"] if _no_disco(a) else None)
                             for a in c.get("anexos", [])])
            con.executemany("INSERT INTO lembrete VALUES (?,?,?,?,?,?)",
                            [(l["id"], cid, l.get("tipo", "retorno"), l["desc"], l.get("data", ""), int(bool(l.get("ok")))) for l in c.get("lembretes", [])])
            con.executemany("INSERT INTO historico (id_cliente, texto, usuario, data_hora) VALUES (?,?,?,?)",
                            [(cid, h["t"], h.get("u", ""), h.get("dt", "")) for h in c.get("log", [])])
        con.executemany("INSERT INTO apolice (id_apolice, ramo, cliente, cpf_cnpj, contato, produto, seguradora, numero,"
                        " inicio, fim, comissao, observacao, ordem, cor) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
            (a["id"], a.get("ramo") or "Outros", a["cliente"], a.get("doc", ""), a.get("contato", ""), a.get("produto", ""),
             a.get("seguradora", ""), a.get("numero", ""), a.get("ini", ""), a.get("fim", ""), str(a.get("comissao", "")),
             a.get("obs", ""), i, a.get("cor", "")) for i, a in enumerate(d.get("apolices", []))])
        # usuários: só nome, perfil e situação são alterados aqui (senhas nunca vêm do navegador)
        for u in d.get("users", []):
            con.execute("UPDATE usuario SET nome=?, perfil=?, ativo=? WHERE id_usuario=?",
                        (u["nome"], u["perfil"], int(bool(u["ativo"])), u["id"]))
        con.commit()
        _limpar_anexos_soltos(con)
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def resetar_admin():
    with conectar() as con:
        con.execute("UPDATE usuario SET senha_hash=?, ativo=1, pedido_senha=0 WHERE email='admin@crm.com'",
                    (hash_senha("admin123"),))


def _no_disco(anexo):
    return str(anexo.get("url", "")).startswith("/api/anexos/")


def _limpar_anexos_soltos(con):
    """Apaga do disco os arquivos que saíram do sistema (só os com mais de um dia, por segurança)."""
    if not ANEXOS.exists():
        return
    usados = {r[0] for r in con.execute("SELECT arquivo FROM anexo WHERE arquivo IS NOT NULL")}
    for f in ANEXOS.iterdir():
        if f.name not in usados and time.time() - f.stat().st_mtime > 86400:
            f.unlink()


# ---------------------------------------------------------------- anexos
def salvar_anexo(conteudo):
    """Grava o arquivo enviado em database/anexos/ e devolve o id dele."""
    ANEXOS.mkdir(parents=True, exist_ok=True)
    ident = "a" + secrets.token_hex(8)
    (ANEXOS / ident).write_bytes(conteudo)
    return ident


def anexo(ident):
    """Devolve (caminho, nome original) de um anexo salvo em disco, ou None."""
    with conectar() as con:
        r = con.execute("SELECT nome_arquivo, arquivo FROM anexo WHERE id_anexo=? AND arquivo IS NOT NULL",
                        (ident,)).fetchone()
    if not r or not (ANEXOS / r["arquivo"]).is_file():
        return None
    return ANEXOS / r["arquivo"], r["nome_arquivo"]


# ---------------------------------------------------------------- sessões de login
def criar_sessao(id_usuario):
    token = secrets.token_urlsafe(32)
    with conectar() as con:
        con.execute("INSERT INTO sessao (token, id_usuario) VALUES (?,?)", (token, id_usuario))
    return token


def usuario_da_sessao(token):
    """Devolve o usuário dono do token, ou None. A sessão vale 30 dias."""
    if not token:
        return None
    with conectar() as con:
        r = con.execute(
            "SELECT u.id_usuario, u.nome, u.perfil FROM sessao s JOIN usuario u USING (id_usuario)"
            " WHERE s.token=? AND u.ativo=1 AND s.criada_em > datetime('now', '-30 days')", (token,)).fetchone()
    return {"id": r["id_usuario"], "nome": r["nome"], "perfil": r["perfil"]} if r else None


def encerrar_sessao(token):
    with conectar() as con:
        con.execute("DELETE FROM sessao WHERE token=?", (token,))


# ---------------------------------------------------------------- portal do cliente
def dados_do_portal(token):
    """O que o próprio cliente pode ver: etapa, serviços, checklist, parcelas e recados públicos."""
    if not token or len(token) < 20:
        return None
    with conectar() as con:
        c = con.execute("SELECT * FROM cliente WHERE token_portal=? AND ativo=1", (token,)).fetchone()
        if not c:
            return None
        etapa = con.execute("SELECT nome FROM coluna WHERE id_coluna=?", (c["id_coluna"],)).fetchone()
        servicos = []
        for x in con.execute("SELECT sc.*, s.nome, s.nicho FROM servico_contratado sc JOIN servico s USING (id_servico)"
                             " WHERE sc.id_cliente=? ORDER BY sc.criado_em, sc.rowid", (c["id_cliente"],)).fetchall():
            idc = x["id_contratacao"]
            servicos.append({
                "nome": x["nome"], "nicho": x["nicho"], "valor": x["valor_combinado"], "status": x["status"],
                "prazo": x["prazo"] or "", "assinatura": x["data_assinatura_contrato"] or "",
                "chaves": x["data_entrega_chaves"] or "", "renovacao": x["data_renovacao"] or "",
                "checklist": [{"item": k["descricao"], "ok": bool(k["concluido"])} for k in con.execute(
                    "SELECT * FROM checklist_item WHERE id_contratacao=? ORDER BY ordem", (idc,))],
                "parcelas": [{"n": p["numero"], "valor": p["valor"], "vencimento": p["vencimento"],
                              "paga": p["situacao"] == "paga", "pagamento": p["data_pagamento"] or ""}
                             for p in con.execute("SELECT * FROM parcela WHERE id_contratacao=? ORDER BY numero", (idc,))],
            })
        recados = [{"texto": m["texto"], "data": m["data_hora"] or "", "autor": m["usuario"] or ""}
                   for m in con.execute("SELECT * FROM comentario WHERE id_cliente=? AND publico=1 ORDER BY rowid DESC",
                                        (c["id_cliente"],))]
        cfg = {r["chave"]: json.loads(r["valor"]) for r in con.execute("SELECT * FROM configuracao")}
    return {"nome": c["nome"], "etapa": etapa["nome"] if etapa else "", "servicos": servicos, "recados": recados,
            "empresa": cfg.get("empresa", ""), "contato": cfg.get("contato", "")}


# ---------------------------------------------------------------- backup automático
def fazer_backup(forcar=False):
    """Copia o banco para database/backups/crm-AAAA-MM-DD.db (uma vez por dia) e apaga os mais antigos."""
    BACKUPS.mkdir(parents=True, exist_ok=True)
    destino = BACKUPS / f"crm-{date.today().isoformat()}.db"
    if destino.exists() and not forcar:
        return None
    origem = conectar()
    copia = sqlite3.connect(destino)
    try:
        origem.backup(copia)  # cópia segura mesmo com o sistema em uso
    finally:
        copia.close()
        origem.close()
    for velho in sorted(BACKUPS.glob("crm-*.db"))[:-BACKUPS_GUARDADOS]:
        velho.unlink()
    if ANEXOS.exists():  # os anexos não mudam depois de enviados: basta copiar os novos
        copia_anexos = BACKUPS / "anexos"
        copia_anexos.mkdir(exist_ok=True)
        for f in ANEXOS.iterdir():
            if not (copia_anexos / f.name).exists():
                shutil.copy2(f, copia_anexos / f.name)
    return destino
