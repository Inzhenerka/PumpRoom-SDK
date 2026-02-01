import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  retrieveData,
  storeData,
  generateStateKey,
  saveStatesToLocalStorage,
  getStatesFromLocalStorage,
  generateCourseKey,
  saveCourseToLocalStorage,
  getCourseFromLocalStorage
} from '../src/storage.ts';
import { USER_STORAGE_KEY, STORAGE_PREFIX, COURSE_STORAGE_PREFIX } from "../src/constants.ts";
import * as utils from '../src/utils.ts';

// Mock getCurrentNormalizedUrl to avoid window dependency
vi.mock('../src/utils.ts', () => ({
  getCurrentNormalizedUrl: vi.fn().mockReturnValue('http://localhost/test-page')
}));

beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  vi.clearAllMocks();
});

describe('storage', () => {
  describe('basic storage operations', () => {
    it('returns null when storage empty', () => {
      expect(retrieveData(USER_STORAGE_KEY)).toBeNull();
    });

    it('saves and reads user', () => {
      const user = { uid: 'u', token: 't', is_admin: false };
      storeData(USER_STORAGE_KEY, user);
      expect(retrieveData(USER_STORAGE_KEY)).toEqual(user);
    });

    it('handles JSON parse error', () => {
      localStorage.setItem('pumproomUser', '{bad json');
      expect(retrieveData(USER_STORAGE_KEY)).toBeNull();
    });

    it('ignores storage failures', () => {
      const orig = global.localStorage;
      global.localStorage = {
        setItem: () => { throw new Error('fail'); },
        getItem: orig.getItem.bind(orig),
        clear: orig.clear.bind(orig),
        removeItem: orig.removeItem.bind(orig),
      } as any;
      const user = { uid: 'u', token: 't', is_admin: false };
      expect(() => storeData(USER_STORAGE_KEY, user)).not.toThrow();
      global.localStorage = orig;
    });
  });

  describe('state storage operations', () => {
    it('generates correct state key', () => {
      const stateName = 'testState';
      const userId = 'user123';

      // getCurrentNormalizedUrl is already mocked to return 'http://localhost/test-page'
      const key = generateStateKey(stateName, userId);
      expect(key).toBe(`${STORAGE_PREFIX}:http://localhost/test-page:${stateName}:${userId}`);

      // Verify that getCurrentNormalizedUrl was called
      expect(utils.getCurrentNormalizedUrl).toHaveBeenCalled();
    });

    it('saves states to localStorage', () => {
      const userId = 'user123';
      const states = [
        { name: 'state1', value: 'value1', data_type: 'str' },
        { name: 'state2', value: 42, data_type: 'int' }
      ];

      saveStatesToLocalStorage(states, userId);

      // Verify states were saved
      const key1 = generateStateKey('state1', userId);
      const key2 = generateStateKey('state2', userId);

      const savedState1 = JSON.parse(localStorage.getItem(key1) || '');
      const savedState2 = JSON.parse(localStorage.getItem(key2) || '');

      expect(savedState1).toEqual(states[0]);
      expect(savedState2).toEqual(states[1]);
    });

    it('retrieves states from localStorage', () => {
      const userId = 'user123';
      const states = [
        { name: 'state1', value: 'value1', data_type: 'str' },
        { name: 'state2', value: 42, data_type: 'int' }
      ];

      // Save states directly
      states.forEach(state => {
        const key = generateStateKey(state.name, userId);
        localStorage.setItem(key, JSON.stringify(state));
      });

      // Retrieve states
      const retrievedStates = getStatesFromLocalStorage(['state1', 'state2'], userId);
      expect(retrievedStates).toEqual(states);
    });

    it('handles missing states gracefully', () => {
      const userId = 'user123';
      const retrievedStates = getStatesFromLocalStorage(['nonexistent'], userId);
      expect(retrievedStates).toEqual([]);
    });

    it('handles localStorage errors when saving', () => {
      const orig = global.localStorage;
      global.localStorage = {
        setItem: () => { throw new Error('fail'); },
        getItem: orig.getItem.bind(orig),
        clear: orig.clear.bind(orig),
        removeItem: orig.removeItem.bind(orig),
      } as any;

      const userId = 'user123';
      const states = [{ name: 'state1', value: 'value1', data_type: 'str' }];

      // Should not throw
      expect(() => saveStatesToLocalStorage(states, userId)).not.toThrow();

      global.localStorage = orig;
    });

    it('handles localStorage errors when retrieving', () => {
      const orig = global.localStorage;
      global.localStorage = {
        setItem: orig.setItem.bind(orig),
        getItem: () => { throw new Error('fail'); },
        clear: orig.clear.bind(orig),
        removeItem: orig.removeItem.bind(orig),
      } as any;

      const userId = 'user123';

      // Should not throw and return empty array
      const retrievedStates = getStatesFromLocalStorage(['state1'], userId);
      expect(retrievedStates).toEqual([]);

      global.localStorage = orig;
    });
  });

  describe('course storage operations', () => {
    it('generates correct course key', () => {
      const key = generateCourseKey();
      expect(key).toBe(`${COURSE_STORAGE_PREFIX}:http://localhost/test-page`);
      expect(utils.getCurrentNormalizedUrl).toHaveBeenCalled();
    });

    it('saves and retrieves course data', () => {
      const data = {
        course: {
          uid: 'course-1',
          visible_name: 'Course One',
          url: 'https://example.com/course',
          is_paid: true,
          student_chat_url: null,
          helper_task: null,
          vote_task: null
        }
      };

      saveCourseToLocalStorage(data);
      const cached = getCourseFromLocalStorage();
      expect(cached).toEqual(data);
    });

    it('returns null when course cache is missing', () => {
      const cached = getCourseFromLocalStorage();
      expect(cached).toBeNull();
    });
  });
});
