# Руководство по развертыванию (Production)

Это руководство поможет вам запустить проект на хостинге с использованием Docker и Nginx.

## 1. Подготовка окружения

Создайте файл `.env` в корневой директории проекта на сервере. Вы можете скопировать его из `.env.local`, но обязательно заполните следующие переменные:

```bash
# База данных (внутри Docker сети)
DATABASE_URL="postgresql://postgres:postgres@db:5432/ii_platform?schema=public"

# Auth (сгенерируйте секрет: openssl rand -base64 32)
NEXTAUTH_SECRET="ваш-секретный-ключ"
NEXTAUTH_URL="http://your-ip-address" # укажите IP вашего сервера

# AI
OPENROUTER_API_KEY="ваш-ключ-ин-openrouter"
```

## 2. Сборка и запуск контейнеров

Выполните следующие команды для сборки образа и запуска базы данных:

```bash
# Сборка приложения
docker compose -f docker-compose.prod.yml build

# Запуск базы данных в фоновом режиме
docker compose -f docker-compose.prod.yml up -d db
```

## 3. Настройка базы данных

Как только база данных запустится, необходимо применить миграции и (опционально) заполнить её начальными данными:

```bash
# Применение миграций Prisma
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy

# (Опционально) Заполнение демо-данными
docker compose -f docker-compose.prod.yml run --rm web npx prisma db seed
```

## 4. Запуск приложения

Теперь можно запустить само веб-приложение:

```bash
docker compose -f docker-compose.prod.yml up -d web
```

## 5. Настройка Nginx

Для того чтобы приложение было доступно по стандартному порту 80, настройте Nginx как Reverse Proxy. Пример конфигурации:

```nginx
server {
    listen 80;
    server_name your-ip-address;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

После редактирования конфига (обычно в `/etc/nginx/sites-available/default`) перезапустите Nginx:
```bash
sudo systemctl restart nginx
```

---

> [!IMPORTANT]
> Убедитесь, что порты 80 и 3000 открыты в Firewall вашего хостинг-провайдера.

> [!TIP]
> Для мониторинга логов используйте команду: `docker compose -f docker-compose.prod.yml logs -f web`
