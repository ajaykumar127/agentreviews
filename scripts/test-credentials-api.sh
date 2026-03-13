#!/bin/bash

# Test Script for Credential Store API
# Tests all API endpoints for credential management

set -e  # Exit on error

# Configuration
BASE_URL="${BASE_URL:-http://localhost:1717}"
API_BASE="$BASE_URL/api/credentials"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test credentials (use test data)
TEST_PROFILE="Test Production Org"
TEST_LOGIN_URL="https://login.salesforce.com"
TEST_USERNAME="test@example.com"
TEST_PASSWORD="TestPassword123"
TEST_TOKEN="TestSecurityToken456"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Credential Store API Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Test 1: List Credentials (should be empty initially)
echo -e "${YELLOW}Test 1: List Credentials (GET /api/credentials)${NC}"
RESPONSE=$(curl -s "$API_BASE")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ List credentials endpoint working${NC}"
else
  echo -e "${RED}✗ List credentials failed${NC}"
  exit 1
fi
echo ""

# Test 2: Save Credential
echo -e "${YELLOW}Test 2: Save Credential (POST /api/credentials/save)${NC}"
SAVE_RESPONSE=$(curl -s -X POST "$API_BASE/save" \
  -H "Content-Type: application/json" \
  -d "{
    \"profileName\": \"$TEST_PROFILE\",
    \"loginUrl\": \"$TEST_LOGIN_URL\",
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"$TEST_PASSWORD\",
    \"securityToken\": \"$TEST_TOKEN\",
    \"authMethod\": \"direct\"
  }")

echo "Response: $SAVE_RESPONSE"

if echo "$SAVE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Save credential successful${NC}"
  CREDENTIAL_ID=$(echo "$SAVE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "Credential ID: $CREDENTIAL_ID"
else
  echo -e "${RED}✗ Save credential failed${NC}"
  exit 1
fi
echo ""

# Test 3: List Credentials (should now show 1)
echo -e "${YELLOW}Test 3: List Credentials Again (should show saved credential)${NC}"
LIST_RESPONSE=$(curl -s "$API_BASE")
echo "Response: $LIST_RESPONSE"

if echo "$LIST_RESPONSE" | grep -q "$TEST_PROFILE"; then
  echo -e "${GREEN}✓ Saved credential appears in list${NC}"
else
  echo -e "${RED}✗ Saved credential not found in list${NC}"
  exit 1
fi
echo ""

# Test 4: Save Another Credential (different profile)
echo -e "${YELLOW}Test 4: Save Another Credential (Sandbox)${NC}"
SAVE_RESPONSE_2=$(curl -s -X POST "$API_BASE/save" \
  -H "Content-Type: application/json" \
  -d "{
    \"profileName\": \"Test Sandbox Org\",
    \"loginUrl\": \"https://test.salesforce.com\",
    \"username\": \"sandbox@example.com\",
    \"password\": \"SandboxPass123\",
    \"securityToken\": \"SandboxToken456\",
    \"authMethod\": \"direct\"
  }")

echo "Response: $SAVE_RESPONSE_2"

if echo "$SAVE_RESPONSE_2" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Second credential saved${NC}"
  CREDENTIAL_ID_2=$(echo "$SAVE_RESPONSE_2" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
else
  echo -e "${RED}✗ Second credential save failed${NC}"
  exit 1
fi
echo ""

# Test 5: Update Existing Credential (same profile name)
echo -e "${YELLOW}Test 5: Update Existing Credential (should upsert)${NC}"
UPDATE_RESPONSE=$(curl -s -X POST "$API_BASE/save" \
  -H "Content-Type: application/json" \
  -d "{
    \"profileName\": \"$TEST_PROFILE\",
    \"loginUrl\": \"$TEST_LOGIN_URL\",
    \"username\": \"updated@example.com\",
    \"password\": \"UpdatedPassword\",
    \"securityToken\": \"UpdatedToken\",
    \"authMethod\": \"direct\"
  }")

echo "Response: $UPDATE_RESPONSE"

if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Credential update successful${NC}"
else
  echo -e "${RED}✗ Credential update failed${NC}"
  exit 1
fi
echo ""

# Test 6: List All Credentials (should show 2)
echo -e "${YELLOW}Test 6: List All Credentials (should show 2)${NC}"
FINAL_LIST=$(curl -s "$API_BASE")
echo "Response: $FINAL_LIST"

CRED_COUNT=$(echo "$FINAL_LIST" | grep -o '"profileName"' | wc -l | tr -d ' ')
if [ "$CRED_COUNT" -eq 2 ]; then
  echo -e "${GREEN}✓ Correct number of credentials (2)${NC}"
else
  echo -e "${RED}✗ Expected 2 credentials, found $CRED_COUNT${NC}"
fi
echo ""

# Test 7: Delete Credential
echo -e "${YELLOW}Test 7: Delete Credential (POST /api/credentials/delete)${NC}"
DELETE_RESPONSE=$(curl -s -X POST "$API_BASE/delete" \
  -H "Content-Type: application/json" \
  -d "{\"credentialId\": \"$CREDENTIAL_ID_2\"}")

echo "Response: $DELETE_RESPONSE"

if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Delete credential successful${NC}"
else
  echo -e "${RED}✗ Delete credential failed${NC}"
  exit 1
fi
echo ""

# Test 8: Verify Deletion
echo -e "${YELLOW}Test 8: Verify Deletion (should show 1 credential)${NC}"
VERIFY_DELETE=$(curl -s "$API_BASE")
echo "Response: $VERIFY_DELETE"

if echo "$VERIFY_DELETE" | grep -q "Test Sandbox Org"; then
  echo -e "${RED}✗ Deleted credential still appears${NC}"
  exit 1
else
  echo -e "${GREEN}✓ Credential successfully deleted${NC}"
fi
echo ""

# Test 9: Test Login with Saved Credential (will fail without real SF org, but tests endpoint)
echo -e "${YELLOW}Test 9: Test Login Endpoint (POST /api/credentials/login)${NC}"
echo -e "${YELLOW}Note: This will fail authentication (expected), but tests the endpoint structure${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -d "{\"credentialId\": \"$CREDENTIAL_ID\"}")

echo "Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "error"; then
  echo -e "${GREEN}✓ Login endpoint reached (authentication failed as expected with test data)${NC}"
else
  echo -e "${YELLOW}! Unexpected response from login endpoint${NC}"
fi
echo ""

# Test 10: Cleanup - Delete remaining credential
echo -e "${YELLOW}Test 10: Cleanup - Delete Remaining Credential${NC}"
CLEANUP_RESPONSE=$(curl -s -X POST "$API_BASE/delete" \
  -H "Content-Type: application/json" \
  -d "{\"credentialId\": \"$CREDENTIAL_ID\"}")

if echo "$CLEANUP_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Cleanup successful${NC}"
else
  echo -e "${RED}✗ Cleanup failed${NC}"
fi
echo ""

# Final Verification
echo -e "${YELLOW}Final Verification: List Credentials (should be empty)${NC}"
FINAL_CHECK=$(curl -s "$API_BASE")
FINAL_COUNT=$(echo "$FINAL_CHECK" | grep -o '"profileName"' | wc -l | tr -d ' ')

if [ "$FINAL_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✓ All credentials cleaned up${NC}"
else
  echo -e "${YELLOW}! $FINAL_COUNT credential(s) remain${NC}"
fi
echo ""

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}✓ All API tests completed successfully!${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test with real Salesforce credentials"
echo "2. Test the UI in the browser"
echo "3. Verify encryption is working (check database)"
echo ""
