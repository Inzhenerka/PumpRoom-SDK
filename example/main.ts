import * as PumpRoomSdk from '../src/index.ts';

const apiKey = import.meta.env.VITE_PUMPROOM_API_KEY;
const realm  = import.meta.env.VITE_PUMPROOM_REALM;

const user = {
  courses: [
    {
      alias: 'demo_user_course',
      name: 'demo_user_course',
      created: new Date(2024, 0, 1, 0, 0, 0)
    }
  ],
  istutor: false,
  lang: 'ru',
  login: 'demo_user@inzhenerka.tech',
  name: 'demo_user',
  projectid: '000000'
};

PumpRoomSdk.init({
  apiKey,
  realm,
  cacheUser: true
});

PumpRoomSdk.authenticate(user);


