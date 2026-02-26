# 기능 목록

## 우선순위 순

### 1. 기본 HTTP 클라이언트 (core)
- REST 요청 (GET POST PUT PATCH DELETE HEAD OPTIONS)
- Headers / Query Params / Body (JSON, form-data, multipart, raw)
- 응답 뷰어: JSON 하이라이팅, 상태코드, 응답시간, 헤더
- OpenAPI 스펙에서 요청 자동 생성

### 2. 컬렉션 & 환경 관리
- 요청별 개별 YAML 파일 저장 (OpenAPI 3.x 호환)
- `.env` 파일 직접 연동
- base → staging → production 환경 상속
- Postman Collection v2.1 / OpenAPI 3.x / Swagger 2.x import·export

### 3. 시나리오 테스트 ★ 핵심 차별점
- YAML로 시나리오 정의 (OpenAPI x-flint 확장)
- 이전 응답값을 다음 요청에 변수로 주입
- assertions: 상태코드, body 필드, 응답시간, 스키마 검증
- 실패 시 상세 diff 리포트
- 병렬 시나리오 실행

### 4. Git 연동
- 커밋 메시지 분석 → 관련 시나리오 자동 선별 실행
- pre-commit hook 지원
- CI 단계 자동 실행

### 5. CLI
```bash
flint run <scenario>                   # 시나리오 실행
flint run <scenario> --env staging     # 환경 지정
flint run <scenario> --reporter json   # JSON 리포트 (CI용)
flint watch                            # 파일 변경 감지 후 자동 재실행
flint validate <collection>            # OpenAPI 유효성 검사
flint import <openapi-file>            # OpenAPI import
flint export --format openapi          # OpenAPI export
```

`--reporter` 옵션: pretty (기본) / json / junit / github-actions
exit code: 성공 0 / 실패 1

### 6. MCP 서버 ★ 핵심 차별점
Electron 앱 실행 시 포트 3141에서 MCP 서버 자동 실행.
Claude Code / Cursor 등 MCP 클라이언트가 Flint를 직접 제어.

제공 툴:
- `run_scenario(scenarioPath)` — 시나리오 실행 및 결과 반환
- `get_collections()` — 컬렉션 목록 반환
- `create_request(spec)` — 요청 생성
- `get_last_result()` — 마지막 실행 결과 반환
- `generate_scenario_from_openapi(spec)` — 시나리오 자동 생성
- `analyze_failure(resultId)` — 실패 원인 AI 분석

클라이언트 설정:
```json
// .claude/mcp.json
{ "mcpServers": { "flint": { "url": "http://localhost:3141/sse" } } }
```

### 7. AI 기능
- **실패 원인 자동 분석**: 실패 맥락을 AI에 넘겨 원인 추론 및 해결 방향 제시
- **OpenAPI → 시나리오 자동 생성**: 의존관계 파악한 플로우 시나리오 생성
- **응답 → 타입 자동 생성**: TypeScript 타입 및 Zod 스키마 자동 생성
- **커밋 메시지 기반 회귀 감지**: 관련 시나리오만 선별 실행
- **이상 탐지**: 응답 패턴 학습 후 구조 변화 감지 및 알림
