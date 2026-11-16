"""Senhas: guardadas como hash PBKDF2 com salt, nunca em texto."""
import hashlib
import secrets


def hash_senha(senha, salt=None):
    salt = salt or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", senha.encode(), salt.encode(), 120_000).hex()
    return f"{salt}${h}"


def confere_senha(senha, guardado):
    salt, _ = guardado.split("$", 1)
    return secrets.compare_digest(hash_senha(senha, salt), guardado)
