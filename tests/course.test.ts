import {describe, it, expect, vi, beforeEach} from 'vitest';
import {loadCourseData} from '../src/course.ts';
import {getCourseFromLocalStorage, saveCourseToLocalStorage} from '../src/storage.ts';
import {setupSdk} from './test-utils.ts';

// Mock fetch
global.fetch = vi.fn();

describe('course', () => {
    beforeEach(() => {
        setupSdk();
        global.fetch = vi.fn();
        (global.fetch as any).mockReset();
    });

    it('returns cached data via callback and refreshes from backend', async () => {
        const cached = {
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
        saveCourseToLocalStorage(cached);

        const fresh = {
            course: {
                uid: 'course-1',
                visible_name: 'Course One',
                url: 'https://example.com/course',
                is_paid: true,
                student_chat_url: 'https://example.com/chat',
                helper_task: {
                    uid: 'task-1',
                    task_name: 'Helper',
                    repo_name: 'repo',
                    realm: 'test'
                },
                vote_task: null
            }
        };
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => fresh
        });

        const callback = vi.fn();
        const result = await loadCourseData(callback);

        expect(result).toEqual(fresh);
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.mock.calls[0][0]).toEqual(cached);
        expect(callback.mock.calls[1][0]).toEqual(fresh);
        expect(getCourseFromLocalStorage()).toEqual(fresh);
    });

    it('calls callback once when cache is missing', async () => {
        const fresh = {
            course: {
                uid: 'course-2',
                visible_name: 'Course Two',
                url: 'https://example.com/course-2',
                is_paid: false,
                student_chat_url: null,
                helper_task: null,
                vote_task: null
            }
        };
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => fresh
        });

        const callback = vi.fn();
        const result = await loadCourseData(callback);

        expect(result).toEqual(fresh);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(fresh);
    });
});
