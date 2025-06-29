import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleFullscreenToggle, enforceIframeHeight } from '../src/index.js';

beforeEach(() => {
  // reset listeners
  (window as any).scrollTo = vi.fn();
});

describe('fullscreen helpers', () => {
  it('restores scroll position on exit fullscreen', () => {
    handleFullscreenToggle();
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    const event = new MessageEvent('message', {
      data: {
        service: 'pumproom',
        type: 'toggleFullscreen',
        payload: { fullscreenState: false },
      },
      origin: 'https://pumproom.tech',
    });
    window.dispatchEvent(event);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 120, left: 0, behavior: 'instant' });
  });

  it('enforces iframe minimal height', () => {
    const frame = document.createElement('iframe');
    frame.src = 'https://pumproom.test/embed';
    frame.setAttribute('height', '300');
    document.body.appendChild(frame);
    enforceIframeHeight(600);
    expect(frame.getAttribute('height')).toBe('600px');
  });
});
