#!/bin/bash

# Automated Setup Script for PostgreSQL Credential Store
# This script will set up the database, run migrations, and configure environment variables

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Credential Store Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
  exit 1
fi

# Step 1: Check for PostgreSQL
echo -e "${YELLOW}Step 1: Checking for PostgreSQL...${NC}"

if command -v psql &> /dev/null; then
  echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
  PSQL_VERSION=$(psql --version | awk '{print $3}')
  echo "  Version: $PSQL_VERSION"
else
  echo -e "${RED}✗ PostgreSQL is not installed${NC}"
  echo ""
  echo "Please install PostgreSQL:"
  echo "  macOS:   brew install postgresql@15 && brew services start postgresql@15"
  echo "  Ubuntu:  sudo apt install postgresql postgresql-contrib"
  echo "  Windows: Download from https://www.postgresql.org/download/"
  exit 1
fi
echo ""

# Step 2: Check for Node.js and npm
echo -e "${YELLOW}Step 2: Checking Node.js and npm...${NC}"

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✓ Node.js is installed${NC}"
  echo "  Version: $NODE_VERSION"
else
  echo -e "${RED}✗ Node.js is not installed${NC}"
  exit 1
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo -e "${GREEN}✓ npm is installed${NC}"
  echo "  Version: $NPM_VERSION"
else
  echo -e "${RED}✗ npm is not installed${NC}"
  exit 1
fi
echo ""

# Step 3: Install Node.js Dependencies
echo -e "${YELLOW}Step 3: Installing Node.js dependencies...${NC}"

if npm install pg @types/pg; then
  echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
  echo -e "${RED}✗ Failed to install dependencies${NC}"
  exit 1
fi
echo ""

# Step 4: Create Database
echo -e "${YELLOW}Step 4: Creating PostgreSQL database...${NC}"

DB_NAME="agentforce_analyzer"

# Check if database already exists
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "${YELLOW}! Database '$DB_NAME' already exists${NC}"
  read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Dropping existing database..."
    dropdb "$DB_NAME" 2>/dev/null || true
    createdb "$DB_NAME"
    echo -e "${GREEN}✓ Database recreated${NC}"
  else
    echo -e "${YELLOW}! Using existing database${NC}"
  fi
else
  if createdb "$DB_NAME"; then
    echo -e "${GREEN}✓ Database '$DB_NAME' created${NC}"
  else
    echo -e "${RED}✗ Failed to create database${NC}"
    exit 1
  fi
fi
echo ""

# Step 5: Run Database Migration
echo -e "${YELLOW}Step 5: Running database migration...${NC}"

MIGRATION_FILE="migrations/001_create_saved_credentials.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
  exit 1
fi

if psql "$DB_NAME" < "$MIGRATION_FILE" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Migration completed successfully${NC}"
else
  echo -e "${RED}✗ Migration failed${NC}"
  echo "  Check the migration file for errors"
  exit 1
fi

# Verify table creation
TABLE_EXISTS=$(psql "$DB_NAME" -tAc "SELECT to_regclass('saved_credentials');")
if [ "$TABLE_EXISTS" = "saved_credentials" ]; then
  echo -e "${GREEN}✓ Table 'saved_credentials' verified${NC}"
else
  echo -e "${RED}✗ Table 'saved_credentials' not found${NC}"
  exit 1
fi
echo ""

# Step 6: Generate Encryption Key
echo -e "${YELLOW}Step 6: Generating encryption key...${NC}"

if command -v openssl &> /dev/null; then
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  echo -e "${GREEN}✓ Encryption key generated${NC}"
  echo "  Key: ${ENCRYPTION_KEY:0:16}...${ENCRYPTION_KEY: -8} (truncated for display)"
else
  echo -e "${RED}✗ OpenSSL not found. Please install OpenSSL.${NC}"
  exit 1
fi
echo ""

# Step 7: Update Environment Variables
echo -e "${YELLOW}Step 7: Updating environment variables...${NC}"

ENV_FILE=".env.local"

# Database URL (localhost)
DATABASE_URL="postgresql://localhost:5432/$DB_NAME"

# Check if .env.local exists
if [ -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}! $ENV_FILE already exists${NC}"

  # Check if DATABASE_URL already exists
  if grep -q "DATABASE_URL=" "$ENV_FILE"; then
    echo "  Updating DATABASE_URL..."
    # macOS requires different sed syntax
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" "$ENV_FILE"
    else
      sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" "$ENV_FILE"
    fi
  else
    echo "  Adding DATABASE_URL..."
    echo "" >> "$ENV_FILE"
    echo "# PostgreSQL Connection" >> "$ENV_FILE"
    echo "DATABASE_URL=$DATABASE_URL" >> "$ENV_FILE"
  fi

  # Check if CREDENTIAL_ENCRYPTION_KEY already exists
  if grep -q "CREDENTIAL_ENCRYPTION_KEY=" "$ENV_FILE"; then
    echo -e "${YELLOW}  ! CREDENTIAL_ENCRYPTION_KEY already exists${NC}"
    read -p "Do you want to regenerate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|CREDENTIAL_ENCRYPTION_KEY=.*|CREDENTIAL_ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$ENV_FILE"
      else
        sed -i "s|CREDENTIAL_ENCRYPTION_KEY=.*|CREDENTIAL_ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$ENV_FILE"
      fi
      echo -e "${GREEN}  ✓ Encryption key updated${NC}"
    else
      echo -e "${YELLOW}  ! Using existing encryption key${NC}"
    fi
  else
    echo "  Adding CREDENTIAL_ENCRYPTION_KEY..."
    echo "" >> "$ENV_FILE"
    echo "# Encryption Key (CRITICAL - Keep Secret!)" >> "$ENV_FILE"
    echo "CREDENTIAL_ENCRYPTION_KEY=$ENCRYPTION_KEY" >> "$ENV_FILE"
  fi
else
  echo "  Creating new $ENV_FILE..."
  cat > "$ENV_FILE" << EOF
# PostgreSQL Connection
DATABASE_URL=$DATABASE_URL

# Encryption Key (CRITICAL - Keep Secret!)
# Generated: $(date)
CREDENTIAL_ENCRYPTION_KEY=$ENCRYPTION_KEY

# Salesforce OAuth (if using custom Connected App)
# SALESFORCE_CLIENT_ID=your_consumer_key
# SALESFORCE_CLIENT_SECRET=your_consumer_secret

# Application URL (for production)
# NEXT_PUBLIC_APP_URL=https://your-app-url.herokuapp.com
EOF
fi

echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Step 8: Test Database Connection
echo -e "${YELLOW}Step 8: Testing database connection...${NC}"

CONNECTION_TEST=$(psql "$DB_NAME" -tAc "SELECT COUNT(*) FROM saved_credentials;" 2>&1)

if [[ "$CONNECTION_TEST" =~ ^[0-9]+$ ]]; then
  echo -e "${GREEN}✓ Database connection successful${NC}"
  echo "  Current credentials in database: $CONNECTION_TEST"
else
  echo -e "${RED}✗ Database connection failed${NC}"
  echo "  Error: $CONNECTION_TEST"
  exit 1
fi
echo ""

# Step 9: Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Configuration Summary:${NC}"
echo "  Database: $DB_NAME"
echo "  Connection: $DATABASE_URL"
echo "  Encryption: AES-256-GCM (key generated)"
echo "  Environment File: $ENV_FILE"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Start the development server:"
echo "     ${YELLOW}npm run dev${NC}"
echo ""
echo "  2. Test the API endpoints:"
echo "     ${YELLOW}bash scripts/test-credentials-api.sh${NC}"
echo ""
echo "  3. Open the app and test the credential dropdown:"
echo "     ${YELLOW}http://localhost:1717${NC}"
echo ""
echo -e "${BLUE}Security Reminders:${NC}"
echo "  ⚠️  Never commit .env.local to Git"
echo "  ⚠️  Keep CREDENTIAL_ENCRYPTION_KEY secret"
echo "  ⚠️  Use strong passwords for saved credentials"
echo "  ⚠️  Enable SSL for production PostgreSQL"
echo ""
echo -e "${BLUE}Heroku Deployment:${NC}"
echo "  1. Add Heroku Postgres:"
echo "     ${YELLOW}heroku addons:create heroku-postgresql:essential-0${NC}"
echo ""
echo "  2. Set encryption key:"
echo "     ${YELLOW}heroku config:set CREDENTIAL_ENCRYPTION_KEY=\$(openssl rand -hex 32)${NC}"
echo ""
echo "  3. Run migration:"
echo "     ${YELLOW}heroku pg:psql < migrations/001_create_saved_credentials.sql${NC}"
echo ""
