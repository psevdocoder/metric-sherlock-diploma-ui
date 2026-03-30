# Metric Sherlock UI

Frontend для сервиса проверки метрик Prometheus.

## Что уже реализовано

- SSO через Keycloak с клиентом `metric-sherlock-ui`
- роли берутся из `claims.roles[]`
- ролевая модель:
  - если есть `admin`, в UI считается только роль `admin`
  - если `admin` нет, но есть `user`, доступен только просмотр отчетов
- страницы под контракт:
  - список target groups
  - детали target group
  - metric whitelist
  - target whitelist
  - metric check limits
  - scrape tasks schedule
- dev-сервер на `http://localhost:4500`

## Быстрый старт

1. Создать локальный env:

```bash
cp .env.example .env
```

2. Отредактировать `.env`:

```dotenv
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost
VITE_API_REQUEST_CASE=snake
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=staging
VITE_KEYCLOAK_CLIENT_ID=metric-sherlock-ui
```

3. Установить зависимости:

```bash
npm install
```

4. Запустить фронтенд:

```bash
npm run dev
```

5. Проверить production build:

```bash
npm run build
```

## Docker

Контейнер генерирует `runtime-config.js` при старте, поэтому `VITE_*` можно менять через `.env` или `environment:` без пересборки образа.

1. Собрать и запустить контейнер:

```bash
docker compose up --build -d
```

2. Открыть UI:

```text
http://localhost:4500
```

3. Остановить контейнер:

```bash
docker compose down
```

Если меняются `VITE_API_BASE_URL`, `VITE_KEYCLOAK_URL` или другие `VITE_*` переменные, достаточно перезапустить контейнер:

```bash
docker compose up -d
```

## Важная настройка grpc-gateway

Поле `VITE_API_REQUEST_CASE` управляет тем, в каком формате отправляются JSON-ключи в `PUT` запросах:

- `snake`: `target_group`, `metric_name_length`
- `camel`: `targetGroup`, `metricNameLength`

По умолчанию стоит `snake`, потому что контракт был дан в proto-именах. Если ваш gateway ожидает стандартный protojson lowerCamelCase, переключите на `camel`.

Ответы фронтенд умеет читать и в `snake_case`, и в `camelCase`.
