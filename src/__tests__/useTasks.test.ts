import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';

const mockTask = {
    id: 1,
    title: 'Test',
    description: null,
    completed: false,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('useTasks', () => {
    it('loads tasks on mount', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([mockTask]);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.tasks).toEqual([mockTask]);
    });

    it('handles load error', async () => {
        vi.spyOn(taskApi, 'getTasks').mockRejectedValue(new Error('fail'));

        const { result } = renderHook(() => useTasks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('fail');
    });

    it('adds task', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);
        vi.spyOn(taskApi, 'createTask').mockResolvedValue(mockTask);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => !result.current.loading);

        await act(async () => {
            await result.current.addTask({ title: 'Test' });
        });

        expect(result.current.tasks).toHaveLength(1);
    });

    it('removes task', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([mockTask]);
        vi.spyOn(taskApi, 'deleteTask').mockResolvedValue();

        const { result } = renderHook(() => useTasks());

        await waitFor(() => !result.current.loading);

        await act(async () => {
            await result.current.removeTask(1);
        });

        expect(result.current.tasks).toHaveLength(0);
    });

    it('toggle complete updates task', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([mockTask]);
        vi.spyOn(taskApi, 'updateTask').mockResolvedValue({
            ...mockTask,
            completed: true,
        });

        const { result } = renderHook(() => useTasks());

        await waitFor(() => !result.current.loading);

        await act(async () => {
            await result.current.toggleComplete(1);
        });

        expect(result.current.tasks[0].completed).toBe(true);
    });

    it('toggleComplete does nothing if task not found', async () => {
        vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);

        const { result } = renderHook(() => useTasks());

        await waitFor(() => !result.current.loading);

        await act(async () => {
            await result.current.toggleComplete(999);
        });

        expect(result.current.tasks).toEqual([]);
    });
});
