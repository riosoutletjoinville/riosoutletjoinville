#!/bin/bash
# download-bucket-structured.sh

PROJECT_ID="dvmsgbfwnmvndezjlezz"
BUCKET_NAME="produtos"
SUPABASE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bXNnYmZ3bm12bmRlempsZXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0OTU1NCwiZXhwIjoyMDcxNjI1NTU0fQ.oViumqDsk1Afz4HAKwjLJnHGOyfoVqplfGRUTqfIpus"

BASE_URL="https://$PROJECT_ID.supabase.co/storage/v1"
DOWNLOAD_DIR="bucket_structured_$(date +%Y%m%d_%H%M%S)"

print_message() {
    case $1 in
        "info") echo -e "\033[1;34mℹ️  $2\033[0m" ;;
        "success") echo -e "\033[1;32m✅ $2\033[0m" ;;
        "error") echo -e "\033[1;31m❌ $2\033[0m" ;;
        "warning") echo -e "\033[1;33m⚠️  $2\033[0m" ;;
    esac
}

mkdir -p "$DOWNLOAD_DIR/produtos"

print_message "info" "=========================================="
print_message "info" "BAIXANDO BUCKET COM ESTRUTURA PRESERVADA"
print_message "info" "=========================================="

# 1. Listar todos os diretórios UUID
print_message "info" "1. Listando diretórios UUID..."
UUID_LIST=$(curl -s -X POST \
    -H "Authorization: Bearer $SUPABASE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"prefix": "", "limit": 1000}' \
    "$BASE_URL/object/list/$BUCKET_NAME" | jq -r '.[].name' | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')

TOTAL_UUIDS=$(echo "$UUID_LIST" | grep -c .)
print_message "success" "Encontrados $TOTAL_UUIDS diretórios UUID"

# 2. Para cada UUID, listar e baixar os arquivos
print_message "info" "2. Baixando arquivos..."
COUNTER=0
TOTAL_FILES=0

echo "$UUID_LIST" | while read uuid; do
    if [ -n "$uuid" ]; then
        COUNTER=$((COUNTER + 1))
        print_message "info" "[$COUNTER/$TOTAL_UUIDS] Processando: $uuid/"
        
        # Criar diretório local
        mkdir -p "$DOWNLOAD_DIR/produtos/$uuid"
        
        # Listar arquivos dentro do UUID
        FILES=$(curl -s -X POST \
            -H "Authorization: Bearer $SUPABASE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"prefix\": \"$uuid/\", \"limit\": 1000}" \
            "$BASE_URL/object/list/$BUCKET_NAME" | jq -r '.[].name')
        
        FILE_COUNT=0
        echo "$FILES" | while read file_path; do
            if [ -n "$file_path" ]; then
                # Extrair apenas o nome do arquivo (sem o prefixo UUID/)
                filename=$(basename "$file_path")
                FILE_COUNT=$((FILE_COUNT + 1))
                TOTAL_FILES=$((TOTAL_FILES + 1))
                
                print_message "info" "    Baixando: $filename"
                
                # Baixar o arquivo
                curl -s -H "Authorization: Bearer $SUPABASE_ROLE_KEY" \
                    "$BASE_URL/object/$BUCKET_NAME/$file_path" \
                    -o "$DOWNLOAD_DIR/produtos/$uuid/$filename"
                
                if [ $? -eq 0 ]; then
                    size=$(du -h "$DOWNLOAD_DIR/produtos/$uuid/$filename" | cut -f1)
                    echo "      ✓ OK ($size)"
                else
                    echo "      ✗ Erro"
                fi
            fi
        done
        
        print_message "success" "  $FILE_COUNT arquivos baixados em $uuid/"
    fi
done

# ============================================
# RESUMO FINAL
# ============================================
print_message "info" "=========================================="
print_message "success" "DOWNLOAD CONCLUÍDO!"
print_message "info" "=========================================="

echo ""
echo "📊 Estatísticas finais:"
echo "  UUIDs processados: $TOTAL_UUIDS"
echo "  Arquivos totais: $(find "$DOWNLOAD_DIR/produtos" -type f | wc -l)"
echo "  Tamanho total: $(du -sh "$DOWNLOAD_DIR" | cut -f1)"
echo ""
echo "📁 Localização: $DOWNLOAD_DIR"
echo ""
echo "📂 Estrutura:"
find "$DOWNLOAD_DIR/produtos" -type d -depth 1 | head -10 | while read dir; do
    count=$(find "$dir" -type f | wc -l)
    echo "  $(basename "$dir")/ ($count arquivos)"
done

print_message "success" "✅ Backup do bucket concluído com estrutura preservada!"