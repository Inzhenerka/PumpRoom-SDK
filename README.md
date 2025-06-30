# PumpRoom SDK

[![npm version](https://badge.fury.io/js/pumproom-sdk.svg)](https://www.npmjs.com/package/pumproom-sdk)

Лёгкая библиотека для интеграции LMS с PumpRoom. Предоставляет методы для аутентификации через API и обмена сообщениями.

# Документация

[Инструкция по интеграции и использованию](https://pumproom-sdk.inzhenerka-cloud.com/)

# Разработка SDK

## Установка зависимостей

## Сборка

```bash
bun run build
```

Запуск сервера разработки

Сервер запускает Vite с live reload. Лендинг отображается по адресу `/`, а
пример из каталога `example` доступен по пути `/example/`.

```bash
bun dev
```

### Тестирование

Запустить unit-тесты и получить отчёт о покрытии можно командой:

```bash
bun run test
```

Отчёт в формате HTML появится в каталоге `coverage`.

### Публикация

Релиз новой версии:

```bash
npm version <patch|minor|major>
```
