# PumpRoom SDK

Лёгкая библиотека для интеграции LMS с PumpRoom. Предоставляет методы для аутентификации через API и обмена сообщениями между окнами.

После сборки в каталоге `dist` доступна небольшая страница `index.html`, которая кратко демонстрирует назначение SDK и примеры его использования.

## Установка

```
npm install pumproom-sdk
```

Или подключите собранный UMD-бандл через тег `<script>`:

```html
<script src="dist/bundles/pumproom-sdk-latest.umd.js"></script>
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
<script src="/path/to/bundles/pumproom-sdk-latest.umd.js"></script>
<script>
PumpRoomSdk.init({ apiKey: 'KEY', realm: 'inzh', cacheUser: true });
PumpRoomSdk.authenticate(profileObj);
</script>
```

## Пример ES-модуля

```ts
import { init, authenticate } from './dist/bundles/pumproom-sdk-latest.esm.js';

init({ apiKey: 'KEY', realm: 'inzh', cacheUser: true });
authenticate(profileObj);
```

## Пример демо-страницы

В каталоге `example` расположена страница `index.html`. Она инициализирует SDK,
использует демо-профиль и встраивает PumpRoom через iframe. После загрузки
пользователь автоматически авторизуется, а SDK отвечает на запрос
`getPumpRoomUser`. При запуске сервера разработки основной лендинг доступен по
адресу `/`, а демо по пути `/example/`. После сборки готовая версия примера
располагается в каталоге `dist/example`.

## Дополнительные функции

### Восстановление прокрутки

Метод `handleFullscreenToggle` вызывается автоматически при инициализации SDK. Он запоминает позицию прокрутки страницы и восстанавливает её после выхода из полноэкранного режима iframe.

### Минимальная высота iframe

```ts
import { enforceIframeHeight } from 'pumproom-sdk';

enforceIframeHeight(600); // значение по умолчанию
```

Функция увеличивает высоту всех iframe PumpRoom, если указано меньше минимальной.

## Разработка

Установка зависимостей

```bash
bun install
```

Сборка

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
