#!/bin/bash
# restore-database-only.sh

# ============================================
# CONFIGURAÇÕES
# ============================================

# Caminho do arquivo de backup
BACKUP_FILE="backup-riosoutletecommerce-COMPLETO-20260323_090146.tar.gz"

# Configurações do NOVO projeto Supabase
NEW_DB_URL="postgresql://postgres:Rios.riosoutletecommerce01HGb@db.oithqkjlvdgwlaumcibf.supabase.co:5432/postgres"

# Diretório temporário
TEMP_DIR="restore_db_temp_$(date +%Y%m%d_%H%M%S)"

print_message() {
    case $1 in
        "info") echo -e "\033[1;34mℹ️  $2\033[0m" ;;
        "success") echo -e "\033[1;32m✅ $2\033[0m" ;;
        "error") echo -e "\033[1;31m❌ $2\033[0m" ;;
        "warning") echo -e "\033[1;33m⚠️  $2\033[0m" ;;
    esac
}

# ============================================
# INÍCIO
# ============================================
print_message "info" "=========================================="
print_message "info" "RESTAURANDO APENAS O BANCO DE DADOS"
print_message "info" "=========================================="

# Verificar se o arquivo de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    print_message "error" "Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

# Criar diretório temporário e extrair
print_message "info" "Extraindo backup..."
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Verificar se o arquivo do banco existe
if [ ! -f "$TEMP_DIR/database.dump" ]; then
    print_message "error" "Arquivo database.dump não encontrado no backup"
    print_message "info" "Conteúdo do backup:"
    ls -la "$TEMP_DIR"
    exit 1
fi

# Restaurar banco de dados
print_message "info" "Restaurando banco de dados..."
print_message "warning" "Isso irá APAGAR todos os dados existentes no banco de destino!"

read -p "Tem certeza? (digite 'SIM' para continuar): " CONFIRM

if [ "$CONFIRM" != "SIM" ]; then
    print_message "error" "Restauração cancelada"
    rm -rf "$TEMP_DIR"
    exit 1
fi

pg_restore \
    --dbname="$NEW_DB_URL" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --verbose \
    "$TEMP_DIR/database.dump"

if [ $? -eq 0 ]; then
    print_message "success" "✅ Banco de dados restaurado com sucesso!"
    
    # Restaurar usuários se existirem
    if [ -f "$TEMP_DIR/auth_users.csv" ]; then
        print_message "info" "Restaurando usuários do Auth..."
        psql "$NEW_DB_URL" << EOF
\copy auth.users FROM '$TEMP_DIR/auth_users.csv' CSV HEADER;
\copy auth.identities FROM '$TEMP_DIR/auth_identities.csv' CSV HEADER;
\copy auth.sessions FROM '$TEMP_DIR/auth_sessions.csv' CSV HEADER;
\copy auth.refresh_tokens FROM '$TEMP_DIR/auth_refresh_tokens.csv' CSV HEADER;
EOF
        print_message "success" "✅ Usuários restaurados!"
    fi
else
    print_message "error" "❌ Erro na restauração do banco"
    exit 1
fi

# Limpar
rm -rf "$TEMP_DIR"

print_message "success" "=========================================="
print_message "success" "RESTAURAÇÃO DO BANCO CONCLUÍDA!"
print_message "success" "=========================================="