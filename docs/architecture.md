# Architecture

MVP flow:

1. VS Code extension lay context quanh con tro.
2. Extension goi API `/v1/completions/inline`.
3. API build prompt + uses official OpenAI SDK to call OpenAI-compatible `POST /v1/chat/completions`.
4. API returns plain code `suggestion`.
5. Extension hien thi inline completion.
