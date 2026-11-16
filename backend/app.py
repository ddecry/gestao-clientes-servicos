"""
WS Gestão - servidor
Usa apenas a biblioteca padrão do Python (não precisa instalar nada).

    python backend/app.py            -> abre em http://localhost:8770

Rotas da API:
    POST /api/login        {email, senha}             -> {token, usuario}
    POST /api/logout
    GET  /api/portal/<link>                            -> o que o próprio cliente pode ver
    GET  /api/dados                                    -> todos os dados do sistema
    PUT  /api/dados        {cols, services, clients, users, config}
    POST /api/usuarios     {nome, email, senha, perfil}   (só administrador)
    POST /api/esqueci      {email}                    -> registra pedido de nova senha
    POST /api/senha        {atual, nova}              -> o usuário troca a própria senha
    POST /api/usuarios/senha {id, nova}               -> administrador redefine a senha

Backup: um por dia em database/backups/ (guarda os últimos 30).
    python backend/backup.py                       -> faz um backup na hora

Esqueceu a senha do administrador?
    python backend/app.py --resetar-admin          -> volta a senha do admin@crm.com para admin123
"""
import sys
import threading
import time
from http.server import ThreadingHTTPServer

from config import PORTA
from database import fazer_backup, iniciar_banco, resetar_admin
from routes import Handler


def backup_automatico():
    """Faz um backup por dia enquanto o servidor estiver ligado (confere a cada hora)."""
    while True:
        try:
            if arquivo := fazer_backup():
                print(f"Backup automático salvo em {arquivo}")
        except Exception as erro:  # um backup falhar não pode derrubar o sistema
            print(f"Falha no backup automático: {erro}")
        time.sleep(3600)


def main():
    iniciar_banco()
    if "--resetar-admin" in sys.argv:
        resetar_admin()
        print("Senha de admin@crm.com redefinida para admin123")
        return
    threading.Thread(target=backup_automatico, daemon=True).start()
    servidor = ThreadingHTTPServer(("127.0.0.1", PORTA), Handler)
    print(f"WS Gestão rodando em http://localhost:{PORTA}  (Ctrl+C para parar)")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
