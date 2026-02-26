# 기술 스택 및 디렉토리 구조

## 스택
| 영역 | 기술 |
|------|------|
| UI | Electron (cross-platform) |
| CLI | Node.js |
| 언어 | TypeScript (strict mode) |
| 모노레포 | pnpm workspace |
| 단위 테스트 | Vitest |
| E2E 테스트 | Playwright (Electron) |

## 디렉토리 구조
```
flint/
├── .ralph/
│   ├── PRD.md           # 구현 태스크 체크박스 목록
│   ├── ARCHITECTURE.md  # 패키지 구조 및 인터페이스 정의
│   ├── AGENT.md         # 빌드/테스트 실행 방법
│   └── BLOCKED.md       # 막힌 태스크 기록
├── packages/
│   ├── core/            # 공통 실행 엔진 (HTTP, 시나리오, 파서)
│   ├── cli/             # flint CLI
│   ├── app/             # Electron 앱
│   └── mcp/             # MCP 서버 (Electron 내장)
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 패키지 의존관계
```
core ← cli
core ← app
core ← mcp
app  → mcp  (Electron 실행 시 MCP 서버 내장 실행)
```

> core는 순수 로직만 포함. UI / Electron API / Node.js 전용 API는 core에 넣지 않는다.
