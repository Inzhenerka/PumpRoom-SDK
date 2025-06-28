# PumpRoom SDK

Лёгкая библиотека для интеграции LMS с PumpRoom. Предоставляет методы для аутентификации через API и обмена сообщениями между окнами.

## Установка

```
npm install pumproom-sdk
```

Или подключите собранный UMD-бандл через тег `<script>`:

```html
<script src="dist/pumproom-sdk.umd.js"></script>
```

## Инициализация

```ts
import { init, authenticate } from 'pumproom-sdk';

init({
  apiKey: 'API_KEY',
  realm: 'inzh',
  cacheUser: true
});

const profile = getLmsProfile();
authenticate(profile);
```

Параметр `cacheUser` включает сохранение авторизованного пользователя в
`localStorage`. При повторной загрузке страницы SDK проверит токен через
эндпоинт `tracker/verify_token` и избежит лишнего запроса авторизации.

## Прослушка сообщений

```ts
onMessage((msg, ev) => {
  if (msg.type === 'customEvent') {
    console.log(msg.payload);
  }
});
```

## Пример подключения через `<script>`

```html
<script src="/path/to/pumproom-sdk.umd.js"></script>
<script>
PumpRoomSdk.init({ apiKey: 'KEY', realm: 'inzh', cacheUser: true });
PumpRoomSdk.authenticate(profileObj);
</script>
```

## Пример ES-модуля

```ts
import { init, authenticate } from './dist/pumproom-sdk.esm.js';

init({ apiKey: 'KEY', realm: 'inzh', cacheUser: true });
authenticate(profileObj);
```

## Пример демо-страницы

В каталоге `example` расположена страница `index.html`. Она инициализирует SDK,
использует демо-профиль и встраивает PumpRoom через iframe. После загрузки
пользователь автоматически авторизуется, а SDK отвечает на запрос
`getPumpRoomUser`.

## Разработка

Установка зависимостей

```bash
bun install
```

Сборка

```bash
bun run build
```

Живая разработка

```bash
bun dev
```
