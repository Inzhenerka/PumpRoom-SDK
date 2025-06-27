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
import { init, authenticate, onMessage, sendUser } from 'pumproom-sdk';

init({
  authUrl: 'https://pumproom-api.inzhenerka-cloud.com/tracker/authenticate',
  apiKey: 'API_KEY',
  allowedOrigins: ['.inzhenerka-cloud.com']
});

authenticate();
```

## Прослушка сообщений

```ts
onMessage((msg, ev) => {
  if (msg.type === 'getPumpRoomUser') {
    sendUser(ev.source as Window, ev.origin);
  }
});
```

## Пример подключения через `<script>`

```html
<script src="/path/to/pumproom-sdk.umd.js"></script>
<script>
PumpRoomSdk.init({ authUrl: '/auth', apiKey: 'KEY', allowedOrigins: ['http://localhost'] });
PumpRoomSdk.authenticate();
</script>
```

## Пример ES-модуля

```ts
import { init, authenticate } from './dist/pumproom-sdk.esm.js';

init({ authUrl: '/auth', apiKey: 'KEY', allowedOrigins: [] });
authenticate();
```
