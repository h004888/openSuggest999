# 📋 OpenSuggest UAT Checklist

## Pre-Test Setup
- [ ] API Server running on port 3030
- [ ] Extension built (`npm run build` in apps/extension)
- [ ] VS Code launched in debug mode (F5)

---

## TC01: Basic Variable Suggestion (TypeScript)
**Input:** `const greeting = `
**Expected:** Inline suggestion appears
**Result:** ☐ PASS ☐ FAIL

---

## TC02: Function Return Suggestion (JavaScript)
**Input:**
```javascript
function add(a, b) {
  return
}
```
**Expected:** Suggestion for return value
**Result:** ☐ PASS ☐ FAIL

---

## TC03: Class Property Suggestion (TypeScript)
**Input:**
```typescript
class User {
  name:
}
```
**Expected:** Property declaration suggestion
**Result:** ☐ PASS ☐ FAIL

---

## TC04: Debounce Verification
**Input:** Type `const x = ` rapidly multiple times
**Expected:** Only 1 API request sent
**Result:** ☐ PASS ☐ FAIL

---

## TC05: Accept Suggestion (Tab key)
**Input:** `const greeting = ` + wait + Tab
**Expected:** Suggestion accepted and inserted
**Result:** ☐ PASS ☐ FAIL

---

## TC06: Dismiss Suggestion (Escape)
**Input:** `const greeting = ` + wait + Escape
**Expected:** Suggestion dismissed, no text inserted
**Result:** ☐ PASS ☐ FAIL

---

## TC07: Multi-line Suggestion
**Input:**
```typescript
function calculate() {
  
}
```
**Expected:** Multi-line suggestion within function body
**Result:** ☐ PASS ☐ FAIL

---

## TC08: Dynamic Settings Update
**Input:** Change `debounceMs` from 200 to 500 in settings
**Expected:** Settings update without reload
**Result:** ☐ PASS ☐ FAIL

---

## TC09: API Health Endpoint
**Command:** `curl http://localhost:3030/health`
**Expected:** `{"ok":true}`
**Result:** ☐ PASS ☐ FAIL

---

## TC10: API Authentication
**Command:**
```bash
curl -X POST http://localhost:3030/v1/completions/inline -H "x-api-key: local-dev-key" -H "Content-Type: application/json" -d "{\"language\":\"typescript\",\"filePath\":\"test.ts\",\"cursor\":{\"line\":0,\"character\":11},\"prefix\":\"const hello\",\"suffix\":\"\"}"
```
**Expected:** Response contains `suggestion` field (not 401)
**Result:** ☐ PASS ☐ FAIL

---

## TC11: Invalid API Key Rejection
**Command:** Same as TC10 but with wrong key
**Expected:** 401 Unauthorized response
**Result:** ☐ PASS ☐ FAIL

---

## TC12: Different Languages
**Test:** Python, JavaScript, TypeScript, Java
**Expected:** Suggestions work in all languages
**Result:** ☐ PASS ☐ FAIL

---

## Summary
| Category | Passed | Failed |
|----------|--------|--------|
| Extension Tests (TC01-TC08) | __/8 | |
| API Tests (TC09-TC11) | __/3 | |
| Multi-language (TC12) | __/1 | |
| **TOTAL** | **__/12** | |

---

## Notes
_____________________________________________
_____________________________________________
_____________________________________________

## Environment Info
- API URL: http://localhost:3030
- API Key: local-dev-key
- VS Code Version: _______________
- Node Version: _______________
- OS: _______________

---

**Tester:** _________________ **Date:** _______________
**Sign-off:** ☐ APPROVED ☐ REJECTED