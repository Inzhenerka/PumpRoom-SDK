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

PumpRoomSdk.setOnInitCallback(async (data) => {
    console.log('[CB] Instance initialized:', data);
    console.log('[CB] All instances', PumpRoomSdk.getInstances())
});

PumpRoomSdk.setOnTaskLoadedCallback(async (data) => {
    console.log('[CB] Task loaded:', data);
});

PumpRoomSdk.setOnTaskSubmittedCallback(async (data) => {
    console.log('[CB] Task submitted:', data);
});

PumpRoomSdk.setOnResultReadyCallback(async (data) => {
    console.log('[CB] Result ready:', data);
});
