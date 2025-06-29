import {getPumpRoomEventMessage} from './messaging.ts';
import {getVersion} from './version.ts';

export interface PumpRoomEnvironment {
    pageURL: string;
    sdkVersion: string;
}

function buildEnvironment(): PumpRoomEnvironment {
    return {
        pageURL: window.location.href,
        sdkVersion: getVersion(),
    };
}

export function sendEnvironment(target: Window, origin: string): void {
    const env = buildEnvironment();
    target.postMessage({service: 'pumproom', type: 'setEnvironment', payload: env}, origin);
}

function handleEnvironmentMessage(event: MessageEvent): void {
    const data = getPumpRoomEventMessage(event);
    if (data?.type === 'getEnvironment') {
        if (event.source) {
            sendEnvironment(event.source as Window, event.origin);
        }
    }
}

export function listenEnvironment(): void {
    window.addEventListener('message', handleEnvironmentMessage);
}
