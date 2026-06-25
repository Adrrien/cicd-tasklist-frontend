import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskItem } from '../components/TaskItem';

const mockTask = {
    id: 1,
    title: 'Test',
    description: 'Desc',
    completed: false,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
    it('renders task', () => {
        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
            />
        );

        expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('toggles task', () => {
        const toggle = vi.fn();

        render(
            <TaskItem
                task={mockTask}
                onToggle={toggle}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(toggle).toHaveBeenCalledWith(1);
    });

    it('enters edit mode and saves', () => {
        const edit = vi.fn();

        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={edit}
            />
        );

        fireEvent.click(screen.getByLabelText('Modifier'));

        fireEvent.change(screen.getByLabelText('Modifier le titre'), {
            target: { value: 'New title' },
        });

        fireEvent.click(screen.getByText('Enregistrer'));

        expect(edit).toHaveBeenCalled();
    });

    it('cancels edit', () => {
        const edit = vi.fn();

        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={vi.fn()}
                onEdit={edit}
            />
        );

        fireEvent.click(screen.getByLabelText('Modifier'));
        fireEvent.click(screen.getByText('Annuler'));

        expect(edit).not.toHaveBeenCalled();
    });

    it('delete requires confirmation', () => {
        const del = vi.fn();

        render(
            <TaskItem
                task={mockTask}
                onToggle={vi.fn()}
                onDelete={del}
                onEdit={vi.fn()}
            />
        );

        fireEvent.click(screen.getByLabelText('Supprimer'));
        expect(del).not.toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText('Supprimer'));
        expect(del).toHaveBeenCalledWith(1);
    });
});
