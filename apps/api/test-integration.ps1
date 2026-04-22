# OpenSuggest API Integration Tests
$ErrorActionPreference = "Stop"

$BASE_URL = "http://localhost:3030"
$VALID_KEY = "local-dev-key"

$TEST_REQUEST_BODY = @{
    language = "typescript"
    filePath = "test.ts"
    cursor = @{ line = 0; character = 11 }
    prefix = "const hello = "
    suffix = ""
} | ConvertTo-Json -Depth 10

function Test-Health {
    Write-Host "`n[TEST] /health endpoint" -ForegroundColor Cyan
    try {
        $resp = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET -TimeoutSec 5
        if ($resp.ok) {
            Write-Host "  PASS: Health check OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  FAIL: Health returned ok=false" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  FAIL: $_" -ForegroundColor Red
        return $false
    }
}

function Test-AuthNoKey {
    Write-Host "`n[TEST] Auth without API key" -ForegroundColor Cyan
    try {
        $statusCode = (Invoke-WebRequest -Uri "$BASE_URL/v1/completions/inline" `
            -Method POST `
            -Body $TEST_REQUEST_BODY `
            -ContentType "application/json" `
            -StatusCodeVariable status `
            -ErrorAction SilentlyContinue).StatusCode

        if ($statusCode -eq 401) {
            Write-Host "  PASS: Got 401 as expected (auth required)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  FAIL: Expected 401, got $statusCode" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  FAIL: $_" -ForegroundColor Red
        return $false
    }
}

function Test-AuthValidKey {
    Write-Host "`n[TEST] Auth with valid API key" -ForegroundColor Cyan
    try {
        $resp = Invoke-WebRequest -Uri "$BASE_URL/v1/completions/inline" `
            -Method POST `
            -Body $TEST_REQUEST_BODY `
            -ContentType "application/json" `
            -Headers @{ "x-api-key" = $VALID_KEY } `
            -StatusCodeVariable status `
            -TimeoutSec 10 `
            -ErrorAction SilentlyContinue

        if ($statusCode -ne 401) {
            Write-Host "  PASS: Auth passed (status: $statusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  FAIL: Got 401 with valid key - AUTH BROKEN!" -ForegroundColor Red
            return $false
        }
    } catch {
        # If request failed but NOT with 401, might be server error (which is OK for integration test)
        Write-Host "  WARN: Request failed: $_" -ForegroundColor Yellow
        return $false
    }
}

function Test-AuthInvalidKey {
    Write-Host "`n[TEST] Auth with invalid API key" -ForegroundColor Cyan
    try {
        $statusCode = (Invoke-WebRequest -Uri "$BASE_URL/v1/completions/inline" `
            -Method POST `
            -Body $TEST_REQUEST_BODY `
            -ContentType "application/json" `
            -Headers @{ "x-api-key" = "wrong-key" } `
            -StatusCodeVariable status `
            -ErrorAction SilentlyContinue).StatusCode

        if ($statusCode -eq 401) {
            Write-Host "  PASS: Got 401 as expected (invalid key rejected)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  FAIL: Expected 401, got $statusCode" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  FAIL: $_" -ForegroundColor Red
        return $false
    }
}

# Main test runner
Write-Host "======================================" -ForegroundColor Magenta
Write-Host "  OpenSuggest API Integration Tests  " -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta

$results = @()

try {
    $results += Test-Health
    $results += Test-AuthNoKey
    $results += Test-AuthValidKey
    $results += Test-AuthInvalidKey
} catch {
    Write-Host "`nERROR: $_" -ForegroundColor Red
    Write-Host "Is the API server running? (npm run dev:api)" -ForegroundColor Yellow
    exit 1
}

$passed = ($results | Where-Object { $_ -eq $true }).Count
$total = $results.Count

Write-Host "`n======================================" -ForegroundColor Magenta
Write-Host "  Results: $passed/$total tests passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host "======================================" -ForegroundColor Magenta

if ($passed -lt $total) {
    exit 1
}
exit 0