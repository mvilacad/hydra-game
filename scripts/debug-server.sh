#!/bin/bash

echo "=== Debug Script para Hydra Game ==="
echo

echo "1. Verificando versão do Docker:"
docker --version
echo

echo "2. Verificando versão do Docker Compose:"
docker-compose --version
echo

echo "3. Verificando espaço em disco:"
df -h
echo

echo "4. Verificando memória disponível:"
free -h
echo

echo "5. Limpando cache do Docker:"
docker system prune -f
echo

echo "6. Verificando imagens disponíveis:"
docker images | grep hydra-game
echo

echo "7. Puxando imagem mais recente do registro:"
docker pull ghcr.io/mvilacad/hydra-game:latest || echo "❌ Falha ao puxar imagem - verifique se o GitHub Actions executou com sucesso"
echo

echo "8. Testando aplicação com imagem do registry:"
echo "Para testar localmente, execute:"
echo "GITHUB_REPOSITORY=mvilacad/hydra-game docker-compose -f docker-compose.prod.yml up"
echo

echo "9. Para build local (desenvolvimento):"
echo "docker-compose -f docker-compose.local.yml up --build"
echo

echo "10. Para atualizar em produção:"
echo "Execute: ./update-hydra-game.sh"
echo

echo "11. Verificando logs dos containers:"
docker-compose logs --tail=50