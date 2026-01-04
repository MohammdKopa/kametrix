#!/bin/bash
# Test script for Google token refresh
# Usage: ./scripts/test-google-token-refresh.sh YOUR_SESSION_TOKEN AGENT_ID

SESSION_TOKEN="${1}"
AGENT_ID="${2}"
BASE_URL="${3:-https://www.kametrix.com}"

if [ -z "$SESSION_TOKEN" ] || [ -z "$AGENT_ID" ]; then
  echo "Usage: $0 <session-token> <agent-id> [base-url]"
  echo "Example: $0 abc123xyz agent_456 https://www.kametrix.com"
  exit 1
fi

echo "=== Testing Google Token Refresh ==="
echo "Base URL: $BASE_URL"
echo "Agent ID: $AGENT_ID"
echo ""

# Test calendar availability (this should trigger token refresh if needed)
echo "1. Testing calendar availability check..."
curl -X GET \
  "${BASE_URL}/api/google/calendar/availability?agentId=${AGENT_ID}&date=2026-01-10" \
  -H "Cookie: session=${SESSION_TOKEN}" \
  -H "Content-Type: application/json" \
  -v

echo ""
echo ""
echo "2. Check the logs above for:"
echo "   - 200 OK response = token refresh worked"
echo "   - 'requiresReconnect: true' = token refresh failed, need to reconnect"
echo ""
