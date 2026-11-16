"""Faz o backup do banco agora. Pode ser agendado (tarefa agendada da hospedagem, Agendador do Windows ou cron).

    python backend/backup.py
"""
from database import fazer_backup, iniciar_banco

if __name__ == "__main__":
    iniciar_banco()
    arquivo = fazer_backup(forcar=True)
    print(f"Backup salvo em {arquivo}")
