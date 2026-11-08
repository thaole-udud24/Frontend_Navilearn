# frontend_navilearn

Web app NaviLearn — React + TypeScript + Vite + Ant Design + TanStack React Query + Zustand. Xem quy tắc cấu trúc/thêm module tại [`../docs/CODE_RULES.md`](../docs/CODE_RULES.md).

## Chạy

```bash
cp .env.example .env    # chỉnh VITE_API_BASE_URL nếu cần
npm install
npm run dev              # http://localhost:5173
```

### Docker (chạy cả backend + frontend + MongoDB local)

Cần clone repo này làm thư mục **anh em** cạnh `backend_navilearn` (`docker-compose.yml` nằm trong `backend_navilearn`):

```text
some-folder/
├── backend_navilearn/
└── frontend_navilearn/   (repo này)
```

```bash
cd ../backend_navilearn
cp .env.example .env    # điền MONGODB_URI, JWT secrets, ... của riêng bạn
docker compose up --build
```

Frontend: http://localhost:3000, Backend: http://localhost:5000.

## Script

| Script | Việc |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` / `lint:fix` | ESLint `src/**/*.{ts,tsx}` |
| `npm test` | Vitest |
| `npm run format` | Prettier |

## Cấu trúc

```
src/
├── main.tsx, app.tsx, access.ts
├── components/     # component dùng chung (DataTable, Loading, ErrorBoundary...)
├── layouts/         # khung giao diện theo role (admin, student)
├── routes/           # paths.ts, index.tsx, ProtectedRoute.tsx
├── pages/<role>/<module>/   # index.tsx, components/, hooks/, styles.less
├── services/<module>/        # index.ts (API), queryKeys.ts
├── hooks/, types/, constants/, utils/, styles/
```

Thêm module mới: `types/<module>.ts` → `services/<module>/{index.ts, queryKeys.ts}` + endpoint → `pages/<role>/<module>/` → đăng ký `routes/paths.ts`, `routes/index.tsx` → thêm quyền vào `access.ts`, menu vào layout. Chi tiết: [`../docs/CODE_RULES.md`](../docs/CODE_RULES.md).
