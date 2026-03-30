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