# Echo Tube Web

> Next.js 기반의 커뮤니티 플랫폼 (자유 게시판, 공지 게시판, 대시보드, OAuth 2.0 인증)

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-blue?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-%2361DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-%233178C6?logo=typescript)](https://www.typescriptlang.org/)

## 🚀 주요 기능

### **커뮤니티 시스템**

- 자유 게시판 (CRUD 기능)
- **댓글 및 대댓글 기능** (신규 추가)
  - 페이징 조회: 대용량 댓글 처리를 위한 효율적인 페이지네이션 구현
  - 댓글/대댓글 생성: 사용자 친화적인 폼 인터페이스 제공
  - 댓글/대댓글 편집: 실시간 수정 기능 및 취소 옵션 지원
  - 댓글/대댓글 삭제: 소프트 삭제 방식으로 댓글 기록 관리
  - 댓글/대댓글 좋아요: 중복 방지 및 실시간 카운트 업데이트
  - 관리자 권한 확장: 관리자는 모든 사용자의 댓글/대댓글 삭제 가능
- 봇 추천 게시판
- 공지 게시판
- 대시보드 (사용자 활동 통계)
- 설정 창
- **게시물 좋아요 기능** (신규 추가)
  - 낙관적 업데이트(Optimistic Update) 지원
  - 로그인 상태별 UI 처리
  - 에러 핸들링 및 사용자 피드백(토스트 알림)

### **관리자 전용 기능**

- **게시판 관리**

  - 카테고리 기반 게시판 생성/수정/삭제
  - 슬러그(slug) 관리 시스템
  - 게시판 권한 설정 (일반 사용자, 관리자, 봇 전용)
  - 게시판 상태 관리 (활성/비활성)

- **카테고리 관리**

  - 다중 슬러그 지원 카테고리 생성
  - 카테고리 이름 및 슬러그 중복 검사
  - 실시간 유효성 검사

- **사용자 관리**
  - 사용자 생성/수정/삭제
  - 사용자 역할 관리 (일반 사용자, 관리자, 봇)
  - 이메일/닉네임 중복 검사
  - 사용자 검색 및 정렬 기능
  - 사용자 상세 정보 조회
- **보안 및 인증**
  - 관리자 전용 페이지 접근 제어
  - JWT 토큰 기반 인증
  - 토큰 만료 시 자동 갱신
  - 권한 없는 접근 시 안전한 리다이렉션

## 🛠 기술 스택

| 카테고리        | 기술                                            |
| --------------- | ----------------------------------------------- |
| **Frontend**    | React 19, Next.js 15, Tailwind CSS, Heroicons   |
| **Validation**  | Zod 스키마 검증, Form State 관리                |
| **Testing**     | Jest, Playwright (E2E), MSW (API 모킹)          |
| **Auth**        | JWT 기반 인증, OAuth 2.0, Server Actions        |
| **Utilities**   | date-fns (날짜 처리), React Hook Form (폼 관리) |
| **Environment** | TypeScript, ESLint, Turbopack                   |

## 🛠️ 기술적 특징

## **1. Next.js 15 + App Router**

- **서버 액션(Server Actions)**:
  - `commentActions.ts`, `postActions.ts`에서 CRUD 및 좋아요 기능 구현
  - `useActionState`훅으로 상태 관리 (예: `CreateComment`, `EditComment`)
  - JWT 토큰 기반 인증 (`authenticatedFetch`, `handleAuthRedirects`)
- **동적 라우팅**:
  - 게시판 슬러그(`[boardSlug]`)와 게시물 ID(`[id]`) 기반의 유연한 URL 구조
  - 페이징 처리(`?page=1`, `?limit=10`) 통합

## **2. 타입 안전한 검증 시스템**

- **Zod 스키마**:
  - 댓글 데이터(`CommentSchema`), API 응답(`PaginatedCommentListItemSchema`) 정의
  - 폼 입력 검증(`CommentForm`, `CommentEditForm`) 및 API 응답 검증
- **타입 추론**:
  - `z.infer<typeof Schema>`로 강력한 타입검증

## **3. 사용자 경험(UX) 최적화**

- **낙관적 업데이트(Optimistic Update)**:
  - 좋아요 버튼(`LikeButton`) 클릭 시 즉시 UI 반영 후 API 응답 대기
- **실시간 캐시 재검증**:
  - `revalidateTag(CACHE_TAGS.COMMENT(postId))`로 관련 콘텐츠 강제 갱신
- **에러 핸들링**:
  - `toast.error`를 활용한 피드백, 비인증 접근 시 `/login` 리다이렉션

## **4. 컴포넌트 아키텍처**

- **복잡한 UI 분리**:
  - `CommentSection`: 댓글 폼 + 목록 통합
  - `CommentItem`: 부모/대댓글 구조 관리 + 편집/삭제 모달
  - `PaginationControls`: 게시물/댓글 공용 페이징 UI
- **리액트 훅 활용**:
  - `useState`로 로딩 상태 및 편집 모드 관리 (`CommentForm`, `CommentEditForm`)

## **5. 테스트 전략**

- **MSW(Mock Service Worker)**:
  - API 모킹(`commentHandlers.ts`)으로 일관된 테스트 환경 구축
  - Zod 스키마 기반 응답 검증
- **Playwright E2E 테스트**:
  - `src/tests-e2e/comments`에서 댓글 CRUD 및 좋아요 시나리오 커버
  - ARIA 라벨(`aria-label="parent-comment-like-button"`) 기반 선택자 사용
- **유닛 테스트**:
  - `jest`로 서버 액션(`commentActions.test.ts`) 및 유틸리티 함수 검증

## **6. 보안 및 인증**

- **JWT 기반 인증**:
  - `authState.ts`에서 쿠키 기반 사용자 정보 관리
- **접근 제어**:
  - `forbidden.tsx` 페이지로 무단 접근 차단
  - `handleAuthRedirects`로 비인증 시 로그인 페이지 이동

## **7. 환경 및 배포**

- **환경 변수 관리**:
  - `.env` 파일로 API 엔드포인트 및 테스트 계정 정보 저장
- **빌드 최적화**:
  - `turbo` 기반 빌드 속도 개선
  - `next/cache`를 활용한 캐싱 태그(`CACHE_TAGS`) 관리

## 👨‍💻 관리자 기능 개발 가이드

### 📂 프로젝트 구조

```
src/
├── app/
│ └── admin/ # 관리자 전용 페이지 라우팅
│ ├── boards/ # 게시판 관리 페이지
│ ├── categories/ # 카테고리 관리 페이지
│ └── users/ # 사용자 관리 페이지
├── lib/
│ ├── action/ # Server Actions
│ │ └── adminManagementApi # 관리자 관련 API 액션
│ ├── definition/ # 타입 정의
│ │ └── adminManagementSchema # Zod 스키마 포함
│ └── constants/ # 에러 메시지 상수
│ ├── board/
│ ├── category/
│ └── user/
└── tests-e2e/ # e2e test
```

### 🧩 핵심 아키텍처 패턴

#### 1. **Server Actions 기반 아키텍처**

- 관리자 기능은 모두 "use server" 지시자를 사용한 Server Actions로 구현
- 비즈니스 로직과 UI 레이어 분리
- 예: `adminBoardManagementApi.ts`, `adminUserManagementApi.ts`

#### 2. **타입 안전한 검증 시스템**

- Zod을 사용한 폼 데이터 검증
- 예: `BoardFormSchema`, `AdminUserCreateSchema`
- 스키마 재사용을 통한 일관성 유지

#### 3. **에러 처리 전략**

- 전용 에러 메시지 상수 관리 (`/constants/board/errorMessage.ts`)
- 인증 에러 전용 핸들러 (`authErrorGuard`, `handleAuthRedirects`)
- 상태 기반 폼 에러 처리

### ✍️ 새로운 관리자 기능 추가 방법

#### 1. **스키마 정의**

```ts
// lib/definition/adminNewFeatureSchema.ts
export const NewFeatureSchema = z.object({ ... });
export type NewFeatureFormData = z.infer<typeof NewFeatureSchema>;
```

#### 2. **Server Action 구현**

```bash
   // lib/action/adminNewFeatureApi.ts
   "use server";
   import { NewFeatureSchema } from "@/lib/definition/adminNewFeatureSchema";

export async function createNewFeature(prevState: any, formData: FormData) {
// 검증 및 API 호출 로직
}
```

#### 3. **UI 컴포넌트 구현**

```bash
// app/admin/new-feature/CreatePage.tsx
import { createNewFeature } from "@/lib/action/adminNewFeatureApi";

export default function CreateNewFeaturePage() {
  const [state, formAction] = useActionState(createNewFeature, initialState);
  // 폼 UI 구현
}
```

#### 4. "테스트 전략" 섹션 업데이트

기존 테스트 섹션을 보다 구체적으로 확장하세요:

- **관리자 기능 전용 테스트**

  - 게시판 생성/수정/삭제 테스트
  - 카테고리 관리 테스트
  - 사용자 관리 및 권한 테스트
  - 비관리자 접근 차단 테스트
  - 토큰 만료 시 리다이렉션 테스트

- **댓글 관련 테스트**
  - 댓글/대댓글 페이징 조회 및 렌더링 테스트
  - 댓글 생성, 수정, 삭제, 좋아요에 대한 E2E 테스트
  - 대댓글 생성 및 계층 구조 유지 테스트
  - 부모 댓글 삭제 시 대댓글 처리 테스트
  - 관리자 권한으로 타인 댓글 삭제 테스트
- **좋아요 기능 테스트**
  - 게시물 좋아요/좋아요 취소 E2E 테스트
  - 댓글/대댓글 좋아요 E2E 테스트
  - 동시 요청 처리 및 중복 방지 테스트
  - 인증되지 않은 사용자 접근 제어 테스트
  - 캐시 재검증(Revalidation) 테스트

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
BASE_API_URL=http://your-api-endpoint.com
NEXT_PUBLIC_SERVER_ADDRESS=http://localhost:3000
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

   SYSTEM_USER_EMAIL='system@example.com'
   SYSTEM_USER_PASSWORD='system1234'
   ```

2. **VS Code에서 실행**

   - [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) 확장 설치
   - 테스트 탐색기에서 `src/tests/e2e` 디렉토리 선택 후 실행

3. **CLI에서 실행**
   ```bash
   npx playwright test
   ```

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
