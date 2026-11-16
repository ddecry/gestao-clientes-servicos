"""Configurações: caminhos dos arquivos e porta do servidor."""
import os
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FRONTEND = RAIZ / "frontend"
BANCO = RAIZ / "database" / "crm.db"
SCHEMA = RAIZ / "database" / "schema.sql"

_args = [a for a in sys.argv[1:] if not a.startswith("--")]
PORTA = int(os.environ.get("PORTA", _args[0] if _args else 8770))

BACKUPS = RAIZ / "database" / "backups"
BACKUPS_GUARDADOS = 30
ANEXOS = RAIZ / "database" / "anexos"   # arquivos enviados pela ficha do cliente
ANEXO_MAX_MB = 20  # quantos dias de backup ficam guardados
