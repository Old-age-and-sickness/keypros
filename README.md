# KeyPROS MVP

공동 임대사업자의 수입, 비용, 정산, 의결 관리를 위한 웹 SaaS MVP입니다.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- GitHub
- Node.js LTS

## Project Status

현재 단계: MVP 초기 개발 환경 세팅 및 기본 기능 개발 준비

---

## Getting Started

프로젝트를 처음 받은 팀원은 아래 순서로 실행합니다.

```bash
git clone https://github.com/keypros-team/keypros.git
cd keypros
npm install
npm run dev
```

실행 후 브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:3000
```

---

## Environment Variables

프로젝트 루트 경로에 `.env.local` 파일을 생성하고 아래 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

주의사항:

- `.env.local` 파일은 GitHub에 올리지 않습니다.
- 실제 환경변수 값은 팀 내부에서 별도로 공유합니다.
- Supabase `service_role key`는 절대 GitHub에 올리지 않습니다.
- GitHub에는 실제 값이 없는 `.env.example` 파일만 올릴 수 있습니다.

---

## Branch Rule

- `main`: 배포용 브랜치
- `dev`: 개발 통합 브랜치
- `feature/*`: 기능별 작업 브랜치
- `docs/*`: 문서 수정 작업 브랜치
- `fix/*`: 버그 수정 작업 브랜치

---

## Git Workflow

모든 작업은 `dev` 브랜치를 기준으로 새 작업 브랜치를 만들어 진행합니다.

### 1. 작업 시작 전

먼저 `dev` 브랜치로 이동합니다.

```bash
git checkout dev
```

GitHub에 올라간 최신 `dev` 코드를 내 컴퓨터로 가져옵니다.

```bash
git pull origin dev
```

새 작업용 브랜치를 만듭니다.

```bash
git checkout -b feature/작업이름
```

예시:

```bash
git checkout -b feature/login-ui
```

---

### 2. 작업 완료 후

수정한 파일을 Git에 등록합니다.

```bash
git add .
```

작업 내용을 커밋합니다.

```bash
git commit -m "feat: 작업 내용"
```

예시:

```bash
git commit -m "feat: add login page UI"
```

내 작업 브랜치를 GitHub에 올립니다.

```bash
git push -u origin feature/작업이름
```

예시:

```bash
git push -u origin feature/login-ui
```

---

### 3. Pull Request 규칙

GitHub에서 Pull Request를 만들 때는 아래처럼 설정합니다.

```text
base: dev
compare: feature/작업이름
```

예시:

```text
base: dev
compare: feature/login-ui
```

뜻:

```text
feature/login-ui 브랜치에서 작업한 내용을 dev 브랜치에 합친다.
```

PR 생성 후 팀원이 변경 내용을 확인하고 문제가 없으면 `dev` 브랜치에 merge합니다.

---

## Commit Convention

커밋 메시지는 아래 규칙을 사용합니다.

- `feat`: 새 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 디자인/스타일 수정
- `refactor`: 코드 구조 개선
- `chore`: 설정 변경, 패키지 설치 등

예시:

```bash
git commit -m "feat: add login page UI"
git commit -m "fix: resolve dashboard layout bug"
git commit -m "docs: update README"
git commit -m "chore: add supabase client"
```

---

## GitHub Collaboration Rule

1. `main` 브랜치에는 직접 push하지 않습니다.
2. `dev` 브랜치에도 직접 push하지 않습니다.
3. 모든 작업은 `dev`에서 새 작업 브랜치를 만들어 진행합니다.
4. 작업 전에는 항상 `git pull origin dev`를 실행합니다.
5. 기능 단위로 commit합니다.
6. 작업 완료 후 작업 브랜치를 GitHub에 push합니다.
7. Pull Request는 작업 브랜치에서 `dev` 브랜치로 보냅니다.
8. PR merge 전 `npm run dev`로 실행 확인합니다.
9. `.env.local` 파일은 GitHub에 올리지 않습니다.
10. Supabase `service_role key`는 절대 공유하거나 업로드하지 않습니다.
11. 충돌이 생기면 혼자 해결하지 말고 팀에 공유합니다.

---

## Initial Development Tasks

초기 개발 작업은 아래 순서로 진행합니다.

1. 로그인 화면 UI 구현
2. 대시보드 기본 레이아웃 구현
3. Mock 자산 데이터 작성
4. 자산 목록 화면 구현
5. 자산 상세 화면 구현
6. Supabase Google 로그인 연결
7. 수입/비용 입력 화면 구현
8. 정산 결과 화면 구현
9. 의결 화면 구현
## Project Structure

작업할 때 파일 위치는 아래 구조를 기준으로 맞춰주세요.

src/
├── app/
│   ├── login/
│   │   └── page.tsx              # /login 로그인 화면
│   ├── dashboard/
│   │   └── page.tsx              # /dashboard 대시보드 화면
│   ├── properties/
│   │   ├── page.tsx              # /properties 자산 목록 화면
│   │   └── [id]/
│   │       └── page.tsx          # /properties/:id 자산 상세 화면
│   ├── votes/
│   │   └── page.tsx              # /votes 의결 목록/화면
│   └── layout.tsx                # 전체 공통 레이아웃
│
├── components/
│   ├── common/                   # 버튼, 입력창, 카드 등 공통 UI
│   ├── layout/                   # Header, Sidebar 등 레이아웃 UI
│   ├── property/                 # 자산 관련 컴포넌트
│   └── vote/                     # 의결 관련 컴포넌트
│
├── lib/
│   └── supabase.ts               # Supabase 연결 설정
│
├── data/
│   └── mockData.ts               # DB 연결 전 임시 데이터
│
├── types/
│   └── index.ts                  # TypeScript 타입 정의
│
└── utils/                        # 정산 계산, 의결 계산 등 공통 함수
```

### Folder Guide

- `src/app`: Next.js 페이지와 라우팅을 관리합니다.
- `src/components`: 재사용 가능한 UI 컴포넌트를 관리합니다.
- `src/lib`: Supabase 등 외부 서비스 연결 파일을 관리합니다.
- `src/data`: DB 연결 전 임시 데이터를 관리합니다.
- `src/types`: TypeScript 타입 정의를 관리합니다.
- `src/utils`: 정산 계산, 의결 계산 등 공통 함수를 관리합니다.

### Work Location Guide

- 로그인 화면 작업: `src/app/login/page.tsx`
- 대시보드 작업: `src/app/dashboard/page.tsx`
- 자산 목록 화면 작업: `src/app/properties/page.tsx`
- 자산 상세 화면 작업: `src/app/properties/[id]/page.tsx`
- 의결 화면 작업: `src/app/votes/page.tsx`
- 공통 버튼/입력창/카드 작업: `src/components/common/`
- 자산 관련 컴포넌트 작업: `src/components/property/`
- 의결 관련 컴포넌트 작업: `src/components/vote/`
- Mock 데이터 작업: `src/data/mockData.ts`
- 정산/의결 계산 함수 작업: `src/utils/`
