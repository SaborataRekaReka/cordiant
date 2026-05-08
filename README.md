# Cordiant Promo Landing

Лендинг и backend для выдачи промокодов с отправкой email через SMTP.

## Структура

- `public/` — публичная статика сайта
- `server/` — backend API и сервисные модули
- `emails/` — HTML-шаблоны писем в `.md`
- `storage/` — приватные runtime-файлы (промокоды, CSV-лог)
- `config/` — конфигурация окружения

## Быстрый старт

1. Установите зависимости:
   - `npm install`
2. Создайте файл конфигурации:
   - скопируйте `config/.env.example` в `config/.env`
3. Подготовьте промокоды:
   - скопируйте `storage/promocodes.example.json` в `storage/promocodes.json`
   - заполните `storage/promocodes.json` рабочими кодами
4. Запустите проект:
   - `npm start`

Для разработки:
- `npm run dev`

## API

### `POST /api/request-promocode`

Request:

```json
{
  "entered_word": "SUMMER",
  "name": "Иван",
  "email": "ivan@example.com"
}
```

Response success (`200`):

```json
{
  "success": true,
  "message": "Письмо отправлено."
}
```

Response error (`400`/`429`):

```json
{
  "success": false,
  "message": "Текст ошибки",
  "code": "INVALID_WORD"
}
```

Коды ошибок:
- `VALIDATION_ERROR`
- `INVALID_WORD`
- `NO_PROMOCODES`
- `MAIL_SEND_FAILED`
- `RATE_LIMIT`

## Manager dashboard

- URL: `/manager`
- Auth: password-based login via `POST /api/manager/login`
- Session: HTTP-only cookie (`manager_auth`)

Required env keys:
- `MANAGER_DASHBOARD_PASSWORD`
- `MANAGER_DASHBOARD_TOKEN_SECRET`
- `MANAGER_SESSION_TTL_MS` (optional, default `28800000`)

Manager API (authenticated):
- `GET /api/manager/summary`
- `GET /api/manager/requests?limit=500`
- `GET /api/manager/requests.csv`
- `GET /api/manager/emails`
- `POST /api/manager/emails`
- `POST /api/manager/promocodes/import`
- `POST /api/manager/logout`

## Systemd deployment (production)

В репозитории есть готовые файлы для запуска backend как systemd-сервиса:

- `scripts/systemd/cordiant-backend.service` — unit-файл
- `scripts/systemd/install-systemd.sh` — установка unit в `/etc/systemd/system` и запуск

Быстрый запуск на сервере:

1. Перейдите в каталог проекта.
2. Выполните:
   - `sudo bash scripts/systemd/install-systemd.sh`

Проверка:

- `sudo systemctl status cordiant-backend --no-pager`
- `sudo journalctl -u cordiant-backend -n 200 --no-pager`

Переопределения (через переменные окружения перед запуском скрипта):

- `APP_DIR` (по умолчанию `/var/www/cordiant.autogoda.ru/data`)
- `APP_USER` и `APP_GROUP` (по умолчанию `bitrix`)
- `NODE_BIN` (по умолчанию `/home/bitrix/.local/node-v16.20.2-linux-x64/bin/node`)
- `ENV_PATH` (по умолчанию `$APP_DIR/config/.env`)
- `STORAGE_DIR` (по умолчанию `$APP_DIR/storage`)
