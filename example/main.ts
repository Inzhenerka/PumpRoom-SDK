import * as PumpRoomSdk from '../src/index.ts';

const apiKey = import.meta.env.VITE_PUMPROOM_API_KEY;
const realm = import.meta.env.VITE_PUMPROOM_REALM;

const profile = {
    id: 'demo_user@inzhenerka.tech',
    name: 'demo_user',
};

PumpRoomSdk.init({
    apiKey,
    realm,
    cacheUser: true,
});

PumpRoomSdk.authenticate({lms: profile}).catch(console.error);
