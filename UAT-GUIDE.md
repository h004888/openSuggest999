# 🧪 OpenSuggest - Hướng Dẫn UAT Testing

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Hướng dẫn Setup](#hướng-dẫn-setup)
4. [Cách sử dụng Extension](#cách-sử-dụng-extension)
5. [Test Cases](#test-cases)
6. [Troubleshooting](#troubleshooting)

---

## 📖 Tổng quan

**OpenSuggest** là một VS Code extension giúp gợi ý code tự động sử dụng AI (MiniMax M2.7).

### Cách hoạt động:
```
Bạn gõ code → Extension gửi context → API xử lý → Trả về suggestion → Hiển thị inline
```

---

## 🖥️ Yêu cầu hệ thống

- [ ] Windows 10/11 hoặc macOS/Linux
- [ ] VS Code phiên bản 1.90+
- [ ] Node.js 18+ (để chạy API)
- [ ] Kết nối internet (để gọi MiniMax API)

---

## 🚀 Hướng dẫn Setup

### Bước 1: Khởi động API Server

**Terminal 1 - Start API:**
```bash
cd C:\Users\ADMIN\Downloads\openSuggest999

# Chạy API server
npm run dev:api
```

**Khi thành công, bạn sẽ thấy:**
```
Server listening at http://127.0.0.1:3030
```

### Bước 2: Build Extension

**Trong VS Code (cửa sổ chính):**

1. Mở Terminal: `Ctrl+`` (backtick)
2. Chạy lệnh build:
```bash
cd apps/extension
npm run build
```

### Bước 3: Debug Extension

1. Nhấn **F5** để khởi chạy Extension Development Host
2. Một cửa sổ VS Code mới sẽ mở ra (đây là Extension Host)

---

## 🎯 Cách sử dụng Extension

### Kích hoạt Extension

Extension sẽ tự động kích hoạt khi bạn:
- Mở một file code (`.ts`, `.js`, `.py`, etc.)
- Hoặc nhấn `Ctrl+Shift+P` → gõ `OpenSuggest: Enable`

### Xem Settings

Nhấn `Ctrl+,` (mở Settings) → Tìm `openSuggest`:

| Setting | Default | Mô tả |
|---------|---------|--------|
| `apiBaseUrl` | `http://localhost:3030` | URL của API |
| `apiKey` | `local-dev-key` | API key để authenticate |
| `requestTimeoutMs` | `10000` | Thời gian chờ tối đa (ms) |
| `debounceMs` | `200` | Độ trễ giữa các request (ms) |

---

## 📝 Test Cases

### TC01: Gợi ý biến đơn giản (TypeScript)

**Steps:**
1. Mở file `test.ts` trong Extension Host
2. Gõ: `const greeting = `
3. Đợi 1-2 giây

**Expected Result:**
- Inline suggestion xuất hiện (màu xám mờ)
- Suggestion hoàn thành câu lệnh, ví dụ: `"Hello, World!"`

**Screenshot:**
```
const greeting = "Hello, World!"  ← suggestion xuất hiện ở đây
```

---

### TC02: Gợi ý function (JavaScript)

**Steps:**
1. Tạo file mới: `test.js`
2. Gõ:
```javascript
function calculateSum(a, b) {
  return
}
```
3. Đặt cursor sau `return`

**Expected Result:**
- Suggestion xuất hiện với logic tính toán

---

### TC03: Gợi ý class (TypeScript)

**Steps:**
1. Tạo file mới: `animal.ts`
2. Gõ:
```typescript
class Dog {
  name:
```

**Expected Result:**
- Suggestion hoàn thành property declaration

---

### TC04: Debounce Test (Nhiều keystrokes liên tục)

**Steps:**
1. Gõ nhanh: `const x = ` liên tục (không đợi suggestion)
2. Kiểm tra số lượng API calls

**Expected Result:**
- Debounce ngăn chặn spam requests
- Chỉ 1 request được gửi thay vì nhiều

---

### TC05: Toggle suggestion bằng Tab

**Steps:**
1. Gõ: `const message = `
2. Đợi suggestion xuất hiện
3. Nhấn **Tab** để accept

**Expected Result:**
- Suggestion được accept thành công
- Text được chèn vào

---

### TC06: Dismiss suggestion bằng Escape

**Steps:**
1. Gõ: `let count = `
2. Đợi suggestion xuất hiện
3. Nhấn **Escape** để dismiss

**Expected Result:**
- Suggestion biến mất
- Không có text được chèn

---

### TC07: Multi-line suggestion

**Steps:**
1. Tạo file `utils.ts`
2. Gõ:
```typescript
function addNumbers(a: number, b: number) {
  
}
```
3. Đặt cursor trong dấu ngoặc nhọn

**Expected Result:**
- Suggestion có thể là multi-line
- Ví dụ: `return a + b;`

---

### TC08: Thay đổi Settings

**Steps:**
1. Mở Settings (`Ctrl+,`)
2. Tìm `openSuggest.debounceMs`
3. Thay đổi từ `200` thành `500`
4. Reload Window (`Ctrl+Shift+P` → `Developer: Reload Window`)

**Expected Result:**
- Extension sử dụng debounce mới
- Không cần restart extension

---

### TC09: API Health Check

**Steps:**
1. Mở terminal riêng (không phải Extension Host)
2. Chạy:
```bash
curl http://localhost:3030/health
```

**Expected Result:**
```json
{"ok": true}
```

---

### TC10: API với Auth

**Steps:**
```bash
curl -X POST http://localhost:3030/v1/completions/inline \
  -H "Content-Type: application/json" \
  -H "x-api-key: local-dev-key" \
  -d '{"language":"typescript","filePath":"test.ts","cursor":{"line":0,"character":11},"prefix":"const hello","suffix":""}'
```

**Expected Result:**
- Response chứa `suggestion` field
- Không có `401 Unauthorized`

---

## 🔧 Troubleshooting

### ❌ Extension không hoạt động

**Kiểm tra:**
1. [ ] API server có đang chạy không?
   ```bash
   curl http://localhost:3030/health
   ```
2. [ ] Extension có trong danh sách enabled?
   - `Ctrl+Shift+X` → Tìm "OpenSuggest"

### ❌ Không có suggestion xuất hiện

**Kiểm tra:**
1. [ ] File có ngôn ngữ được hỗ trợ không?
2. [ ] Prefix có đủ dài không? (ít nhất 1 ký tự)
3. [ ] Check Output panel: `View` → `Output` → chọn `OpenSuggest`

### ❌ 401 Unauthorized

**Fix:**
1. Kiểm tra `openSuggest.apiKey` trong settings
2. Giá trị phải là: `local-dev-key`
3. Reload window sau khi thay đổi

### ❌ API timeout

**Kiểm tra:**
1. [ ] Internet connection ổn định?
2. [ ] MiniMax API có bị rate limit?
3. [ ] Tăng `requestTimeoutMs` trong settings

### ❌ Extension crash

**Fix:**
1. Stop Extension Host
2. Stop API server
3. Restart cả hai

---

## 📊 Debug Output

### Xem Extension Logs

Trong Extension Host:
1. `View` → `Output` → chọn tab `OpenSuggest`

Bạn sẽ thấy:
```
[OpenSuggest] Extension activated with settings: {...}
[OpenSuggest] Settings updated: {...}
[OpenSuggest] [request-id] Starting completion request
[OpenSuggest] [request-id] Completion received: {...}
```

### Xem API Logs

Trong terminal chạy API:
```
[auth] { url: '/v1/completions/inline' } Auth check
[auth] { url: '/v1/completions/inline' } Auth passed
{"type":"completion",...}
```

---

## ✅ Checklist UAT

| Test Case | Status | Ghi chú |
|-----------|--------|---------|
| TC01 - Gợi ý biến đơn giản | ☐ | |
| TC02 - Gợi ý function | ☐ | |
| TC03 - Gợi ý class | ☐ | |
| TC04 - Debounce test | ☐ | |
| TC05 - Accept bằng Tab | ☐ | |
| TC06 - Dismiss bằng Escape | ☐ | |
| TC07 - Multi-line suggestion | ☐ | |
| TC08 - Thay đổi Settings | ☐ | |
| TC09 - API Health Check | ☐ | |
| TC10 - API với Auth | ☐ | |

---

## 📞 Feedback

Nếu gặp lỗi hoặc có feedback:
1. Kiểm tra Console logs trong Extension Host
2. Kiểm tra API logs trong terminal
3. Báo cáo với dev team với log output

---

**Happy Testing! 🎉**
