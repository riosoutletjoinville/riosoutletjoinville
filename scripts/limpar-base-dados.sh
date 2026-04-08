#!/bin/bash

# ============================================
# LIMPEZA COMPLETA DO SUPABASE
# ============================================

NEW_DB_URL="postgresql://postgres:Rios.riosoutletecommerce01HGb@db.oithqkjlvdgwlaumcibf.supabase.co:5432/postgres"
NEW_PROJECT_ID="oithqkjlvdgwlaumcibf"
NEW_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdGhxa2psdmRnd2xhdW1jaWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTYzMjYsImV4cCI6MjA4OTU5MjMyNn0.rD4YvVoxtp0BJmckTTo0GpDuZkLveXuJvsIib5NotlA"
NEW_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdGhxa2psdmRnd2xhdW1jaWJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxNjMyNiwiZXhwIjoyMDg5NTkyMzI2fQ.GMYO1KdOFb0HLQjRtAvHiXBLnHXeVdRmTEgrpylvYMs"
BUCKET_NAME="produtos"

print_message() {
    case $1 in
        "info") echo -e "\033[1;34mℹ️  $2\033[0m" ;;
        "success") echo -e "\033[1;32m✅ $2\033[0m" ;;
        "error") echo -e "\033[1;31m❌ $2\033[0m" ;;
        "warning") echo -e "\033[1;33m⚠️  $2\033[0m" ;;
    esac
}

print_message "warning" "=========================================="
print_message "warning" "⚠️  ATENÇÃO: ISSO VAI APAGAR TODOS OS DADOS!"
print_message "warning" "=========================================="
print_message "warning" "Serão excluídos:"
echo "   ✅ Todas as tabelas do schema public"
echo "   ✅ Todos os dados de autenticação (auth.users)"
echo "   ✅ Todos os arquivos do storage (bucket $BUCKET_NAME)"
echo ""
read -p "Digite 'APAGAR TUDO' para confirmar: " CONFIRM

if [ "$CONFIRM" != "APAGAR TUDO" ]; then
    print_message "error" "Operação cancelada"
    exit 1
fi

# ============================================
# 1. LIMPAR STORAGE (BUCKET)
# ============================================
print_message "info" "1. Limpando bucket $BUCKET_NAME..."

# Listar e deletar todos os arquivos do bucket
print_message "info" "  Listando arquivos..."
FILES=$(curl -s -H "Authorization: Bearer $NEW_API_KEY" \
    "https://$NEW_PROJECT_ID.supabase.co/storage/v1/object/list/$BUCKET_NAME?prefix=&limit=1000" | \
    jq -r '.[].name' 2>/dev/null)

if [ -n "$FILES" ] && [ "$FILES" != "null" ]; then
    echo "$FILES" | while read -r file; do
        if [ -n "$file" ]; then
            print_message "info" "  Deletando: $file"
            curl -s -X DELETE \
                -H "Authorization: Bearer $NEW_API_KEY" \
                "https://$NEW_PROJECT_ID.supabase.co/storage/v1/object/$BUCKET_NAME/$file"
        fi
    done
    print_message "success" "  Arquivos deletados"
else
    print_message "info" "  Bucket vazio ou não existe"
fi

# Opcional: deletar o bucket (será recriado na restauração)
print_message "info" "  Deletando bucket..."
curl -s -X DELETE \
    -H "Authorization: Bearer $NEW_SERVICE_KEY" \
    "https://$NEW_PROJECT_ID.supabase.co/storage/v1/bucket/$BUCKET_NAME"

print_message "success" "Storage limpo!"

# ============================================
# 2. LIMPAR BANCO DE DADOS (TABELAS PUBLIC)
# ============================================
print_message "info" "2. Limpando banco de dados..."

psql "$NEW_DB_URL" << EOF
-- Desabilitar triggers temporariamente para evitar conflitos
SET session_replication_role = replica;

-- Dropar todas as tabelas do schema public
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;

-- Recriar schema public vazio
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Reabilitar triggers
SET session_replication_role = DEFAULT;

SELECT '✅ Todas as tabelas do schema public foram removidas' as status;
EOF

if [ $? -eq 0 ]; then
    print_message "success" "Tabelas do schema public removidas!"
else
    print_message "error" "Erro ao remover tabelas"
fi

# ============================================
# 3. LIMPAR DADOS DE AUTENTICAÇÃO (AUTH)
# ============================================
print_message "info" "3. Limpando dados de autenticação..."

psql "$NEW_DB_URL" << EOF
-- Limpar dados do auth
TRUNCATE TABLE auth.users CASCADE;
TRUNCATE TABLE auth.identities CASCADE;
TRUNCATE TABLE auth.sessions CASCADE;
TRUNCATE TABLE auth.refresh_tokens CASCADE;

SELECT '✅ Dados de autenticação removidos' as status;
EOF

if [ $? -eq 0 ]; then
    print_message "success" "Dados de autenticação removidos!"
fi

# ============================================
# 4. VERIFICAR LIMPEZA
# ============================================
print_message "info" "4. Verificando limpeza..."

# Verificar tabelas restantes
TABLE_COUNT=$(psql "$NEW_DB_URL" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null | xargs)
print_message "info" "Tabelas restantes no schema public: $TABLE_COUNT"

# Verificar usuários
USER_COUNT=$(psql "$NEW_DB_URL" -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | xargs)
print_message "info" "Usuários restantes: $USER_COUNT"

# Verificar storage
BUCKET_EXISTS=$(curl -s -H "Authorization: Bearer $NEW_API_KEY" \
    "https://$NEW_PROJECT_ID.supabase.co/storage/v1/bucket/$BUCKET_NAME" | jq -r '.error // "exists"' 2>/dev/null)
print_message "info" "Bucket $BUCKET_NAME: $BUCKET_EXISTS"

# ============================================
# RESUMO
# ============================================
print_message "success" "=========================================="
print_message "success" "LIMPEZA COMPLETA REALIZADA!"
print_message "success" "=========================================="
print_message "info" "✅ Schema public: vazio"
print_message "info" "✅ Auth: sem usuários"
print_message "info" "✅ Storage: bucket removido"
print_message "info" ""
print_message "info" "Agora você pode executar a restauração do backup"