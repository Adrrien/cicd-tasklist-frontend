import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

vi.mock('../api/taskApi', () => ({
	getTasks: vi.fn(),
	createTask: vi.fn(),
	updateTask: vi.fn(),
	deleteTask: vi.fn(),
}));

const mockTask: Task = {
	id: 1,
	title: 'Première tâche',
	description: 'Description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

const mockTaskDone: Task = {
	...mockTask,
	completed: true,
};

const mockedTaskApi = vi.mocked(taskApi);

describe('useTasks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads tasks on mount', async () => {
		mockedTaskApi.getTasks.mockResolvedValue([mockTask]);

		const { result } = renderHook(() => useTasks());

		expect(result.current.loading).toBe(true);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(mockedTaskApi.getTasks).toHaveBeenCalledTimes(1);
		expect(result.current.tasks).toEqual([mockTask]);
		expect(result.current.error).toBeNull();
	});

	it('stores an error when loading fails', async () => {
		mockedTaskApi.getTasks.mockRejectedValue(new Error('Erreur serveur'));

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.error).toBe('Erreur serveur');
		expect(result.current.tasks).toEqual([]);
	});

	it('adds a task at the beginning of the list', async () => {
		mockedTaskApi.getTasks.mockResolvedValue([mockTask]);
		mockedTaskApi.createTask.mockResolvedValue(mockTaskDone);

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({
				title: 'Nouvelle tâche',
				description: 'Nouvelle description',
			});
		});

		expect(mockedTaskApi.createTask).toHaveBeenCalledWith({
			title: 'Nouvelle tâche',
			description: 'Nouvelle description',
		});
		expect(result.current.tasks).toEqual([mockTaskDone, mockTask]);
	});

	it('updates a task', async () => {
		mockedTaskApi.getTasks.mockResolvedValue([mockTask]);
		mockedTaskApi.updateTask.mockResolvedValue({
			...mockTask,
			title: 'Tâche modifiée',
		});

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.editTask(1, { title: 'Tâche modifiée' });
		});

		expect(mockedTaskApi.updateTask).toHaveBeenCalledWith(1, {
			title: 'Tâche modifiée',
		});
		expect(result.current.tasks[0].title).toBe('Tâche modifiée');
	});

	it('removes a task', async () => {
		mockedTaskApi.getTasks.mockResolvedValue([mockTask]);
		mockedTaskApi.deleteTask.mockResolvedValue(undefined);

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.removeTask(1);
		});

		expect(mockedTaskApi.deleteTask).toHaveBeenCalledWith(1);
		expect(result.current.tasks).toEqual([]);
	});

	it('toggles completion for an existing task', async () => {
		mockedTaskApi.getTasks.mockResolvedValue([mockTask]);
		mockedTaskApi.updateTask.mockResolvedValue(mockTaskDone);

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(1);
		});

		expect(mockedTaskApi.updateTask).toHaveBeenCalledWith(1, {
			completed: true,
		});
		expect(result.current.tasks[0].completed).toBe(true);
	});

	it('does nothing when toggling a missing task', async () => {
		mockedTaskApi.getTasks.mockResolvedValue([mockTask]);

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(999);
		});

		expect(mockedTaskApi.updateTask).not.toHaveBeenCalled();
		expect(result.current.tasks).toEqual([mockTask]);
	});
});