import {describe, it, expect, vi} from 'vitest';

const addPlugin = vi.fn();
const highlightAll = vi.fn();
const pluginCtor = vi.fn(function() {
  return { name: 'plugin' };
});

vi.mock('highlight.js', () => ({
  default: { addPlugin, highlightAll }
}));
vi.mock('highlightjs-copy', () => ({
  default: pluginCtor
}));
vi.mock('./src/styles/bootstrap.scss', () => ({}), { virtual: true });
vi.mock('bootstrap/dist/js/bootstrap.bundle.min.js', () => ({}), { virtual: true });
vi.mock('highlight.js/styles/github.css', () => ({}), { virtual: true });
vi.mock('highlightjs-copy/dist/highlightjs-copy.min.css', () => ({}), { virtual: true });

describe('site script', () => {
  it('initializes highlight.js on DOMContentLoaded', async () => {
    await import('../site.ts');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(pluginCtor).toHaveBeenCalledWith({ autohide: false });
    expect(addPlugin).toHaveBeenCalledWith({ name: 'plugin' });
    expect(highlightAll).toHaveBeenCalled();
  });
});
