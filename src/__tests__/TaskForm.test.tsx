import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
    it('shows validation error', () => {
        const submit = vi.fn();

        render(<TaskForm onSubmit={submit} />);

        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByText('Le titre est requis')).toBeInTheDocument();
    });

    it('submits form', () => {
        const submit = vi.fn();

        render(<TaskForm onSubmit={submit} />);

        fireEvent.change(screen.getByLabelText('Titre'), {
            target: { value: 'Nouvelle tâche' },
        });

        fireEvent.click(screen.getByRole('button'));

        expect(submit).toHaveBeenCalledWith({
            title: 'Nouvelle tâche',
            description: undefined,
        });
    });

    it('clears form after submit in create mode', () => {
        const submit = vi.fn();

        render(<TaskForm onSubmit={submit} mode="create" />);

        fireEvent.change(screen.getByLabelText('Titre'), {
            target: { value: 'Test' },
        });

        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByLabelText('Titre')).toHaveValue('');
    });

    it('does not clear form in edit mode', () => {
        const submit = vi.fn();

        render(
            <TaskForm
                onSubmit={submit}
                mode="edit"
                initialValues={{ title: 'Test' }}
            />
        );

        fireEvent.change(screen.getByLabelText('Titre'), {
            target: { value: 'Modifié' },
        });

        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByLabelText('Titre')).toHaveValue('Modifié');
    });
});
