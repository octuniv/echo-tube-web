# Echo Tube Web

> Next.js 기반의 커뮤니티 플랫폼 (자유 게시판, 공지 게시판, 대시보드, OAuth 2.0 인증)

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-blue?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-%2361DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-%233178C6?logo=typescript)](https://www.typescriptlang.org/)

## 🚀 주요 기능

- **커뮤니티 시스템**
  - 자유 게시판 (CRUD 기능)
  - 공지 게시판 (관리자 전용)
  - 대시보드 (사용자 활동 통계)
- **인증 시스템**
  - OAuth 2.0 표준 기반 인증
  - JWT 토큰 관리

## 🛠 기술 스택

| 카테고리        | 기술                                          |
| --------------- | --------------------------------------------- |
| **Frontend**    | React 19, Next.js 15, Tailwind CSS, Heroicons |
| **Validation**  | Zod 스키마 검증                               |
| **Testing**     | Jest, Playwright (E2E)                        |
| **Utilities**   | date-fns (날짜 처리), MSW (API 모킹)          |
| **Environment** | TypeScript, ESLint, Turbopack                 |

## 📦 시작 가이드

### 1. 프로젝트 설정

```bash
git clone https://github.com/octuniv/echo-tube-web.git
cd echo-tube-web
pnpm install
```

### 2. 환경 변수 구성

`.env` 파일 생성:

```env
SERVER_ADDRESS=http://your-api-endpoint.com
```

### 3. 개발 서버 실행

```bash
pnpm run dev
```

👉 `http://localhost:3000`에서 확인

## 🧪 테스트 실행

### 단위 테스트

```bash
pnpm test
```

### E2E 테스트 (Playwright)

1. **테스트 전용 환경 변수**  
   `.env.e2e.test` 파일:

   ```env
   tester_name=tester
   tester_nickName=tester_nick
   tester_email=test@example.com
   tester_password=tester123456
   ```

2. **VS Code에서 실행**

   - [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) 확장 설치
   - 테스트 탐색기에서 `src/tests/e2e` 디렉토리 선택 후 실행

3. **CLI에서 실행**
   ```bash
   npx playwright test
   ```

> ⚠️ E2E 테스트는 테스트 서버가 실행 중이어야 합니다:
>
> ```bash
> pnpm run dev
> ```

## 📂 프로젝트 구조 (예시)

```
src/
├── components/    # 재사용 가능한 UI 컴포넌트
├── app/         # Next.js 페이지 (대시보드, 게시판 등)
├── lib/      # API 통신 로직 (OAuth 포함)
│   ├── utils.ts         # 유틸리티 함수 (날짜 포맷 등)
├── tests-e2e/     # Playwright E2E 테스트
```

> ⚠️ 보안 주의사항:  
> `.env.e2e.test` 파일은 테스트 전용이며, 실제 계정 정보를 포함하지 않습니다.
