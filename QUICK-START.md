# 🚀 OpenSuggest - Quick Start Guide

## 1. Start API (Terminal 1)
```bash
cd C:\Users\ADMIN\Downloads\openSuggest999
npm run dev:api
```
✅ Wait until you see: `Server listening at http://127.0.0.1:3030`

---

## 2. Build & Run Extension
```bash
cd apps/extension
npm run build
```
Then press **F5** in VS Code

---

## 3. Test Inline Completion
Open a new `.ts` file and type:
```typescript
const greeting = 
```
Wait 1-2 seconds → Suggestion appears → Press **Tab** to accept

---

## 4. Check API Status
```bash
curl http://localhost:3030/health
```
Expected: `{"ok":true}`

---

## 5. Settings
Press `Ctrl+,` → Search `openSuggest`

| Setting | Default | Description |
|----------|---------|-------------|
| `apiBaseUrl` | http://localhost:3030 | API URL |
| `apiKey` | local-dev-key | Auth key |
| `debounceMs` | 200 | Delay between requests |
| `requestTimeoutMs` | 10000 | Max wait time |

---

## 6. Debug Logs
- **Extension Host**: `View` → `Output` → `OpenSuggest`
- **API**: Check terminal running API

---

## Quick Test Commands
```bash
# Test API health
curl http://localhost:3030/health

# Test with auth
curl -X POST http://localhost:3030/v1/completions/inline ^
  -H "Content-Type: application/json" ^
  -H "x-api-key: local-dev-key" ^
  -d "{\"language\":\"typescript\",\"filePath\":\"test.ts\",\"cursor\":{\"line\":0,\"character\":11},\"prefix\":\"const hello\",\"suffix\":\"\"}"
```

---

## Troubleshooting
| Problem | Solution |
|---------|----------|
| No suggestion | Check API running + `curl localhost:3030/health` |
| 401 error | Verify `apiKey` = `local-dev-key` in settings |
| Extension not found | Run `npm run build` in apps/extension first |
| Port 3030 in use | Kill node processes: `taskkill /F /IM node.exe` |

---

**For detailed UAT guide, see: `UAT-GUIDE.md`**
