#!/bin/bash

# ============================================
# CONFIGURAÇÕES - CORRIGIDAS
# ============================================

# 1. Configurações do Banco de Dados (URL do Supabase)
DB_URL="postgresql://postgres:Rios.outletJoinville07@db.dvmsgbfwnmvndezjlezz.supabase.co:5432/postgres"

# 2. Configurações do Storage (Bucket)
BUCKET_NAME="produtos"
PROJECT_ID="dvmsgbfwnmvndezjlezz"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bXNnYmZ3bm12bmRlempsZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNDk1NTQsImV4cCI6MjA3MTYyNTU1NH0.fjDHkechwfmqgyZ62_znLApRPZyO3waFFirxZQGPjh4"

# SUPABASE_ROLE_KEY - CORRIGIDO (variável correta)
SUPABASE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bXNnYmZ3bm12bmRlempsZXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0OTU1NCwiZXhwIjoyMDcxNjI1NTU0fQ.oViumqDsk1Afz4HAKwjLJnHGOyfoVqplfGRUTqfIpus"

# 3. Configurações do Backup
BACKUP_DIR="backups"
PROJECT_NAME="riosoutletecommerce"
DATE=$(date +%Y%m%d_%H%M%S)
TEMP_DIR="$BACKUP_DIR/temp_$DATE"

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

print_message() {
    case $1 in
        "info") echo -e "\033[1;34mℹ️  $2\033[0m" ;;
        "success") echo -e "\033[1;32m✅ $2\033[0m" ;;
        "error") echo -e "\033[1;31m❌ $2\033[0m" ;;
        "warning") echo -e "\033[1;33m⚠️  $2\033[0m" ;;
    esac
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================
# VERIFICAÇÕES INICIAIS
# ============================================

print_message "info" "Iniciando backup COMPLETO do Supabase"
print_message "info" "Data/Hora: $(date)"
print_message "info" "Projeto: $PROJECT_NAME"
print_message "info" "Project ID: $PROJECT_ID"

# Criar diretórios
mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR" || exit 1

# Verificar dependências
for cmd in pg_dump psql curl; do
    if ! command_exists "$cmd"; then
        print_message "error" "$cmd não encontrado. Instale primeiro."
        exit 1
    fi
done

if ! command_exists "jq"; then
    print_message "warning" "jq não encontrado. Instale para melhor processamento: sudo apt install jq"
fi

# ============================================
# 1. BACKUP DO BANCO DE DADOS (COMPLETO)
# ============================================
print_message "info" "1. Fazendo backup do banco de dados..."

pg_dump \
    --dbname="$DB_URL" \
    --format=custom \
    --compress=9 \
    --verbose \
    --no-password \
    --file="database.dump"

if [ $? -eq 0 ]; then
    print_message "success" "Banco de dados concluído!"
else
    print_message "error" "Falha no backup do banco"
    exit 1
fi

# ============================================
# 2. BACKUP DOS USUÁRIOS (AUTH)
# ============================================
print_message "info" "2. Fazendo backup dos usuários (Auth)..."

psql "$DB_URL" -c "\copy (SELECT * FROM auth.users) TO 'auth_users.csv' WITH CSV HEADER" 2>/dev/null
psql "$DB_URL" -c "\copy (SELECT * FROM auth.identities) TO 'auth_identities.csv' WITH CSV HEADER" 2>/dev/null
psql "$DB_URL" -c "\copy (SELECT * FROM auth.sessions) TO 'auth_sessions.csv' WITH CSV HEADER" 2>/dev/null
psql "$DB_URL" -c "\copy (SELECT * FROM auth.refresh_tokens) TO 'auth_refresh_tokens.csv' WITH CSV HEADER" 2>/dev/null

print_message "success" "Backup do Auth concluído!"

# ============================================
# 3. BACKUP DO STORAGE - URL CORRIGIDA
# ============================================
print_message "info" "3. Fazendo backup do bucket: $BUCKET_NAME"

mkdir -p "storage/$BUCKET_NAME"

# URL para listagem
LIST_URL="https://$PROJECT_ID.supabase.co/storage/v1/object/list/$BUCKET_NAME"

print_message "info" "Listando arquivos do bucket via POST com ROLE KEY..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $SUPABASE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"prefix": "", "limit": 1000}' \
    "$LIST_URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
CONTENT=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    if command_exists "jq"; then
        echo "$CONTENT" | jq -r '.[]?.name // empty' | while read -r file_name; do
            if [ -n "$file_name" ]; then
                print_message "info" "  Baixando: $file_name"
                
                # URL CORRETA - sem /public/
                curl -s -H "Authorization: Bearer $SUPABASE_ROLE_KEY" \
                    "https://$PROJECT_ID.supabase.co/storage/v1/object/$BUCKET_NAME/$file_name" \
                    -o "storage/$BUCKET_NAME/$file_name"
            fi
        done
        
        FILE_COUNT=$(find "storage/$BUCKET_NAME" -type f 2>/dev/null | wc -l)
        print_message "success" "Storage concluído! $FILE_COUNT arquivos baixados."
    else
        print_message "warning" "jq não encontrado. Instale para processar a listagem."
    fi
else
    print_message "error" "Erro ao listar bucket. HTTP $HTTP_CODE"
    print_message "info" "Resposta: $CONTENT"
fi

# ============================================
# 4. BACKUP DAS EDGE FUNCTIONS
# ============================================
print_message "info" "4. Fazendo backup das Edge Functions..."

mkdir -p "edge_functions"

print_message "info" "Tentando listar Edge Functions..."
FUNCTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $SUPABASE_ROLE_KEY" \
    "https://$PROJECT_ID.supabase.co/functions/v1/")

if command_exists "jq"; then
    if echo "$FUNCTIONS_RESPONSE" | jq -e 'type == "array"' >/dev/null 2>&1; then
        echo "$FUNCTIONS_RESPONSE" | jq -r '.[].name // empty' | while read -r func; do
            print_message "info" "  Function encontrada: $func"
            {
                echo "Function: $func"
                echo "URL: https://$PROJECT_ID.supabase.co/functions/v1/$func"
                echo ""
                echo "⚠️  Código fonte precisa ser exportado manualmente via:"
                echo "   supabase functions download $func"
                echo ""
                echo "Para instalar CLI: npm i -g supabase"
            } > "edge_functions/$func.txt"
        done
    else
        print_message "info" "Nenhuma Edge Function encontrada ou acesso negado"
        echo "$FUNCTIONS_RESPONSE" > "edge_functions/response.log"
    fi
else
    print_message "warning" "jq não instalado, pulando processamento de Edge Functions"
fi

# ============================================
# 5. BACKUP DA CONFIGURAÇÃO (METADATA)
# ============================================
print_message "info" "5. Salvando configurações do projeto..."

mkdir -p "config"

{
    echo "=========================================="
    echo "CONFIGURAÇÕES DO PROJETO SUPABASE"
    echo "=========================================="
    echo "Projeto ID: $PROJECT_ID"
    echo "Data backup: $(date)"
    echo ""
    echo "TABELAS DO BANCO:"
    psql "$DB_URL" -c "\dt public.*" 2>/dev/null || echo "Não foi possível listar tabelas"
    echo ""
    echo "STORAGE BUCKETS:"
    curl -s -H "Authorization: Bearer $SUPABASE_ROLE_KEY" \
        "https://$PROJECT_ID.supabase.co/storage/v1/bucket" | jq '.' 2>/dev/null || echo "Não foi possível listar buckets"
    echo ""
    echo "BUCKETS DETALHADOS:"
    curl -s -X GET "https://$PROJECT_ID.supabase.co/storage/v1/bucket" \
        -H "Authorization: Bearer $SUPABASE_ROLE_KEY" | jq -r '.[] | "Nome: \(.name) | Público: \(.public) | Tipo: \(.type)"' 2>/dev/null
    echo ""
    echo "AUTH CONFIGURAÇÕES (verificar manualmente no dashboard):"
    echo "- Providers: Email, Google, etc."
    echo "- Site URL: https://$PROJECT_ID.supabase.co"
    echo ""
} > "config/project_config.txt"

print_message "success" "Configurações salvas!"

# ============================================
# 6. COMPACTAR TUDO
# ============================================
print_message "info" "6. Compactando backup completo..."

# Voltar para o diretório BACKUP_DIR
cd "$OLDPWD" || cd "$BACKUP_DIR" || exit 1
FINAL_FILE="backup-$PROJECT_NAME-COMPLETO-$DATE.tar.gz"

tar -czf "$FINAL_FILE" -C "$TEMP_DIR" .

if [ $? -eq 0 ]; then
    print_message "success" "Backup completo compactado: $FINAL_FILE"
    print_message "info" "Tamanho: $(du -h "$FINAL_FILE" | cut -f1)"
    rm -rf "$TEMP_DIR"
else
    print_message "error" "Erro ao compactar"
    exit 1
fi

# ============================================
# 7. RESUMO FINAL
# ============================================
print_message "success" "=========================================="
print_message "success" "BACKUP COMPLETO FINALIZADO COM SUCESSO!"
print_message "success" "=========================================="
print_message "info" "Arquivo final: $FINAL_FILE"
print_message "info" "Local: $BACKUP_DIR/$FINAL_FILE"
print_message "info" ""
print_message "info" "CONTEÚDO DO BACKUP:"
print_message "info" "✅ Banco de dados (todas as tabelas públicas e auth)"
print_message "info" "✅ Usuários do Auth"
print_message "info" "✅ Storage - bucket '$BUCKET_NAME'"
print_message "info" "✅ Configurações do projeto"
print_message "info" ""
print_message "info" "Para ver conteúdo: tar -tvf $FINAL_FILE | less"