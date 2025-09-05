#!/bin/bash

echo "🔄 Atualizando Hydra Game..."
echo

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Erro: docker-compose.prod.yml não encontrado"
    echo "Execute este script no diretório raiz do projeto"
    exit 1
fi

# Definir variável de ambiente
export GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-mvilacad/hydra-game}

echo "📦 Usando repositório: $GITHUB_REPOSITORY"

# Puxar imagem mais recente
echo "📥 Puxando imagem mais recente..."
docker pull ghcr.io/$GITHUB_REPOSITORY:latest

if [ $? -ne 0 ]; then
    echo "❌ Falha ao puxar imagem"
    echo "Verifique se:"
    echo "  1. O GitHub Actions executou com sucesso"
    echo "  2. A imagem foi publicada no registry"
    echo "  3. Você tem permissão para acessar o registry"
    exit 1
fi

# Parar containers atuais
echo "⏹️  Parando containers atuais..."
docker-compose -f docker-compose.prod.yml down

# Iniciar com nova imagem
echo "🚀 Iniciando aplicação com nova imagem..."
docker-compose -f docker-compose.prod.yml up -d

# Verificar se está rodando
sleep 10
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Aplicação atualizada com sucesso!"
    echo "🌐 Acesse: http://localhost:5000"
    
    # Mostrar logs recentes
    echo
    echo "📝 Logs recentes:"
    docker-compose -f docker-compose.prod.yml logs --tail=20 app
else
    echo "❌ Erro ao iniciar aplicação"
    echo "📝 Verificando logs:"
    docker-compose -f docker-compose.prod.yml logs app
    exit 1
fi