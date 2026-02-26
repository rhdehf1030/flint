# 개발 진행 방식

Agent Teams(설계·검토)와 Ralph Loop(구현)를 조합해서 진행.

---

## Phase 1 — 설계 (Agent Teams)

아래 3개 서브에이전트를 구성해서 설계를 진행해줘.

- **Planner**: 전체 기능을 구현 가능한 단위 태스크로 분해 → `.ralph/PRD.md` 작성
- **Architect**: 패키지 구조, 공개 인터페이스, OpenAPI 호환 파일 포맷 상세 설계 → `.ralph/ARCHITECTURE.md` 작성
- **Reviewer**: 설계 모순, 누락 엣지케이스, OpenAPI 호환성 위험 요소 검토

**설계 완료 후 반드시 나에게 보여주고 확인을 받은 뒤 Phase 2로 넘어가.**

---

## Phase 2 — 구현 (Ralph Loop × 3 병렬)

터미널 3개를 열고 아래 루프를 동시에 실행.

### Loop A — core 패키지
```
.ralph/PRD.md와 .ralph/ARCHITECTURE.md를 읽고
core 패키지 미완료 태스크를 하나씩 구현해.

완료 기준:
- 모든 core 태스크 체크박스 완료
- Vitest 통과 (커버리지 80% 이상)
- TypeScript strict 컴파일 에러 없음
- ESLint 에러 없음
- 태스크 완료마다 git commit

막혔을 때: 3번 시도 후 실패하면 .ralph/BLOCKED.md에 기록하고 다음 태스크로.

Output <promise>CORE_COMPLETE</promise> when done.
--max-iterations 40
```

### Loop B — CLI 패키지
```
.ralph/PRD.md와 .ralph/ARCHITECTURE.md를 읽고
cli 패키지 미완료 태스크를 하나씩 구현해.

완료 기준:
- flint run / watch / validate / import / export 정상 동작
- 통합 테스트 통과
- exit code 정상 반환
- --reporter json 출력 형식 검증

Output <promise>CLI_COMPLETE</promise> when done.
--max-iterations 40
```

### Loop C — Electron 앱 + MCP 서버
```
.ralph/PRD.md와 .ralph/ARCHITECTURE.md를 읽고
app / mcp 패키지 미완료 태스크를 하나씩 구현해.

완료 기준:
- Electron 앱 정상 실행
- 요청 탭 UI 동작 (스크린샷 찍어 직접 확인 후 다음 단계)
- 컬렉션 목록 표시
- MCP 서버 포트 3141 정상 응답
- MCP 툴 전체 동작 확인

Output <promise>APP_COMPLETE</promise> when done.
--max-iterations 50
```

---

## Phase 3 — 통합 검토 (Agent Teams)

3개 루프 완료 후 Agent Teams로 검토.

- **Tester Agent**: core + cli + app + mcp 연동 통합 테스트 작성 및 실행
- **Reviewer Agent**: 인터페이스 일관성, OpenAPI 호환성, 코드 품질 검토 → 수정 태스크를 `.ralph/PRD.md`에 추가
- **Docs Agent**: README.md, CLI 사용법, 파일 포맷 문서, MCP 툴 문서 작성

수정 필요 항목은 Ralph Loop를 다시 돌려 처리.

---

## Ralph Loop 실용 팁

- `--max-iterations`는 처음엔 10~15로 낮게 시작, 루프 정상 확인 후 늘릴 것
- 완료 기준은 반드시 기계적으로 검증 가능한 형태로 (빌드 성공, 테스트 통과 등)
- 비용: Sonnet 기준 시간당 약 $10~15
