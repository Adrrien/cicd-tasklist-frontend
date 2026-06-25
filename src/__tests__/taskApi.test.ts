import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, createTask, updateTask, deleteTask } from '../api/taskApi';

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

describe('taskApi', () => {
	it('getTasks returns array', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([mockTask]),
			})
		);

		const tasks = await getTasks();
		expect(tasks).toEqual([mockTask]);
		expect(fetch).toHaveBeenCalledWith('/api/tasks');
	});

	it('createTask creates a task', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTask),
			})
		);

		const payload = {
			title: 'Test',
			description: 'Description',
		};

		const task = await createTask(payload);

		expect(task).toEqual(mockTask);
		expect(fetch).toHaveBeenCalledWith('/api/tasks', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});
	});

	it('updateTask updates a task', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({
					...mockTask,
					completed: true,
				}),
			})
		);

		const payload = { completed: true };

		const task = await updateTask(1, payload);

		expect(task.completed).toBe(true);
		expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});
	});

	it('deleteTask deletes a task', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
			})
		);

		await deleteTask(1);

		expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
			method: 'DELETE',
		});
	});

	it('throws when getTasks fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.resolve('Internal Server Error'),
			})
		);

		await expect(getTasks()).rejects.toThrow(
			'HTTP 500: Internal Server Error'
		);
	});
});
