#!/bin/bash
# restore-storage-corrected.sh

# ============================================
# CONFIGURAÇÕES
# IMPORTANTE-O BUCKET NAO PODE ESTAR CRIADO
# ============================================

# Caminho do bucket baixado - VERIFICAR SE ESTE É O CAMINHO CORRETO
BUCKET_SOURCE="bucket_from_db_20260323_091820/produtos"

# Configurações do NOVO projeto Supabase
NEW_PROJECT_ID="oithqkjlvdgwlaumcibf"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdGhxa2psdmRnd2xhdW1jaWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzMjYsImV4cCI6MjA4OTU5MjMyNn0.rD4YvVoxtp0BJmckTTo0GpDuZkLveXuJvsIib5NotlA"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdGhxa2psdmRnd2xhdW1jaWJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxNjMyNiwiZXhwIjoyMDg5NTkyMzI2fQ.GMYO1KdOFb0HLQjRtAvHiXBLnHXeVdRmTEgrpylvYMs"
BUCKET_NAME="produtos"

print_message() {
    case $1 in
        "info") echo -e "\033[1;34mℹ️  $2\033[0m" ;;
        "success") echo -e "\033[1;32m✅ $2\033[0m" ;;
        "error") echo -e "\033[1;31m❌ $2\033[0m" ;;
        "warning") echo -e "\033[1;33m⚠️  $2\033[0m" ;;
    esac
}

# ============================================
# VERIFICAÇÕES INICIAIS
# ============================================
print_message "info" "=========================================="
print_message "info" "RESTAURANDO STORAGE (BUCKET)"
print_message "info" "=========================================="

# Verificar se o diretório existe
if [ ! -d "$BUCKET_SOURCE" ]; then
    print_message "error" "Diretório não encontrado: $BUCKET_SOURCE"
    print_message "info" "Verificando diretórios disponíveis:"
    ls -la | grep bucket
    exit 1
fi

# Mostrar estrutura
print_message "info" "Estrutura do diretório de origem:"
ls -la "$BUCKET_SOURCE" | head -20
echo ""

# Contar arquivos
TOTAL_FILES=$(find "$BUCKET_SOURCE" -type f | wc -l)
print_message "info" "Total de arquivos: $TOTAL_FILES"

# Mostrar amostra dos arquivos
print_message "info" "Amostra dos arquivos a serem enviados:"
find "$BUCKET_SOURCE" -type f | head -10 | while read file; do
    echo "  $file"
done
echo ""

read -p "Continuar com a restauração? (s/N): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    print_message "error" "Restauração cancelada"
    exit 1
fi

# ============================================
# CRIAR/VERIFICAR BUCKET
# ============================================
print_message "info" "Verificando/Criando bucket '$BUCKET_NAME'..."

# Primeiro, verificar se o bucket já existe
BUCKET_EXISTS=$(curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    "https://$NEW_PROJECT_ID.supabase.co/storage/v1/bucket/$BUCKET_NAME" | jq -r '.name' 2>/dev/null)

if [ "$BUCKET_EXISTS" != "$BUCKET_NAME" ]; then
    print_message "info" "Criando bucket..."
    curl -s -X POST \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$BUCKET_NAME\", \"public\": true}" \
        "https://$NEW_PROJECT_ID.supabase.co/storage/v1/bucket"
    print_message "success" "Bucket criado"
else
    print_message "success" "Bucket já existe"
fi

# ============================================
# UPLOAD DOS ARQUIVOS
# ============================================
print_message "info" "=========================================="
print_message "info" "INICIANDO UPLOAD"
print_message "info" "=========================================="

SUCCESS=0
FAILED=0
CURRENT=0

# Criar arquivo de log
LOG_FILE="upload_log_$(date +%Y%m%d_%H%M%S).txt"

find "$BUCKET_SOURCE" -type f | while read -r file; do
    # Obter caminho relativo (UUID/arquivo)
    relative_path=${file#$BUCKET_SOURCE/}
    CURRENT=$((CURRENT + 1))
    
    echo -ne "\r[$CURRENT/$TOTAL_FILES] Enviando: $relative_path ... "
    
    # Verificar se o arquivo existe e tem tamanho > 0
    if [ ! -s "$file" ]; then
        echo "❌ Arquivo vazio" | tee -a "$LOG_FILE"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    # Fazer upload com debug
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -F "file=@$file" \
        "https://$NEW_PROJECT_ID.supabase.co/storage/v1/object/$BUCKET_NAME/$relative_path")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ OK" | tee -a "$LOG_FILE"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "❌ Falhou (HTTP $HTTP_CODE)" | tee -a "$LOG_FILE"
        echo "  Erro: $BODY" >> "$LOG_FILE"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
print_message "info" "=========================================="
print_message "success" "RESTAURAÇÃO CONCLUÍDA!"
print_message "info" "=========================================="
print_message "info" "✅ Enviados com sucesso: $SUCCESS"
print_message "info" "❌ Falhas: $FAILED"
print_message "info" "📁 Log: $LOG_FILE"