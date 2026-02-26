# 파일 포맷 스펙

모든 포맷은 OpenAPI 3.x 호환. Swagger 2.x 변환 및 Postman Collection v2.1 import/export 지원.

## 컬렉션 — 요청 파일

요청 하나당 개별 YAML 파일. Git diff가 사람이 읽기 쉬운 형태.

```yaml
# collections/auth/login.yaml
openapi: "3.0.0"
info:
  title: 로그인
  version: "1.0.0"
paths:
  /auth/login:
    post:
      operationId: auth-login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  example: "{{TEST_EMAIL}}"
                password:
                  type: string
                  example: "{{TEST_PASSWORD}}"
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
      x-flint:
        assertions:
          - status: 200
          - body.token: exists
```

## 환경변수

`.env` 파일과 직접 연동. base → staging → production 상속 구조.

```
environments/
├── base.env
├── staging.env      # base 상속 후 override
└── production.env
```

## 시나리오

OpenAPI x-flint 확장 필드 사용.

```yaml
# scenarios/user-flow.yaml
x-flint-scenario:
  name: 사용자 기본 플로우
  version: "1.0.0"
  steps:
    - operationId: auth-login
      extract:
        token: body.token
    - operationId: user-get-profile
      headers:
        Authorization: "Bearer {{token}}"
      assertions:
        - status: 200
        - body.email: exists
```
