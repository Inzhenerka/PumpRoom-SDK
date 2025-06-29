import {setConfig} from "./state.js"
import {enforceIframeHeight, handleFullscreenToggle} from './fullscreen.ts';
import {PumpRoomConfig} from './types.ts';

export {setConfig, getCurrentUser} from './state.ts';
export {authenticate} from './auth.ts';
export {handleFullscreenToggle, enforceIframeHeight} from './fullscreen.ts';
export * from './types.ts';

export function init(cfg: PumpRoomConfig): void {
    setConfig(cfg)
    handleFullscreenToggle();
    if (cfg.minHeight) {
        enforceIframeHeight(cfg.minHeight);
    }
}
