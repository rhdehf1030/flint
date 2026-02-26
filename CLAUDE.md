# Flint — 프로젝트 개요

Postman을 대체하는 오픈소스 API 클라이언트.

## 핵심 철학
"AI가 코드를 짜는 시대에도, 배포 전 마지막 품질 게이트"

- Postman 무료 대체제 + 유료 기능 오픈소스 제공
- 모든 데이터는 로컬 파일시스템 저장, Git으로 관리
- **모든 스펙은 OpenAPI 3.x와 완벽하게 호환**

## 문서 구조
- [STACK.md](./STACK.md) — 기술 스택 및 디렉토리 구조
- [SPEC.md](./SPEC.md) — 파일 포맷 스펙 (OpenAPI 호환)
- [FEATURES.md](./FEATURES.md) — 기능 목록 및 우선순위
- [WORKFLOW.md](./WORKFLOW.md) — 개발 진행 방식 (Agent Teams + Ralph Loop)

## 시작 방법
**지금 바로 WORKFLOW.md를 읽고 Phase 1부터 시작해줘.**
설계 완료 후 반드시 나에게 보여주고 확인을 받은 뒤 구현으로 넘어가.

## 커밋 규칙
**주요 작업이 완료될 때마다 반드시 git commit을 한다.**

커밋해야 하는 시점:
- 패키지 스캐폴드 완료 (infra 설정)
- 각 core 모듈 구현 완료 (env, collection, scenario, http, assertions 등)
- 각 CLI 커맨드 구현 완료
- 각 MCP 툴 구현 완료
- UI 컴포넌트 그룹 구현 완료
- 테스트 스위트 통과 확인 후

커밋 메시지 형식:
```
feat(core): implement HTTP client with undici

feat(cli): add flint run command with reporter support

test(core): add assertion evaluator unit tests
```

PRD.md의 섹션 하나가 완료될 때마다 최소 1개 커밋을 남긴다.
