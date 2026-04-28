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

## Branch Rule

- main: 배포용
- dev: 개발 통합용
- feature/*: 기능 개발용

## Commit Convention

- feat: 기능 추가
- fix: 버그 수정
- docs: 문서 수정
- style: 디자인/스타일 수정
- refactor: 코드 구조 개선
- chore: 설정 변경

## Getting Started

프로젝트를 처음 받은 팀원은 아래 순서로 실행합니다.

```bash
npm install
npm run dev
```

실행 후 브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:3000
```

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

## GitHub Collaboration Rule

1. main 브랜치에는 직접 push하지 않는다.
2. 모든 작업은 dev에서 새 feature 브랜치를 만들어 진행한다.
3. 작업 전에는 항상 dev 최신 코드를 pull한다.
4. 기능 단위로 commit한다.
5. 작업 완료 후 feature 브랜치를 GitHub에 push한다.
6. Pull Request는 feature 브랜치에서 dev 브랜치로 보낸다.
7. PR merge 전 `npm run dev`로 실행 확인한다.
8. `.env.local` 파일은 GitHub에 올리지 않는다.
9. Supabase `service_role key`는 절대 공유하거나 업로드하지 않는다.
10. 충돌이 생기면 혼자 억지로 해결하지 말고 팀에 공유한다.

## Project Status

현재 단계: MVP 초기 개발 환경 세팅
