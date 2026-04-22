# Extension Flow

1. User go phim trong editor.
2. Provider lay context bang `contextExtractor`.
3. Debounce gate loc request qua day.
4. `completionClient` goi API completion.
5. `sanitizeSuggestion` lam sach output.
6. VS Code render inline item, user `Tab` de accept.
