#!/bin/sh
# Atualiza o sistema no servidor com a versão do GitHub, sem mexer no banco nem nos anexos.
#   sh /opt/ws-gestao/deploy/atualizar.sh
set -e
cd /tmp
curl -fsSL -o ws.tgz https://codeload.github.com/ddecry/ws-gestao/tar.gz/refs/heads/main
rm -rf /tmp/wsx && python3 -c "import tarfile; tarfile.open('ws.tgz').extractall('/tmp/wsx')"
cp -r /tmp/wsx/ws-gestao-main/. /opt/ws-gestao/
sudo systemctl restart ws-gestao
echo "Atualizado."
