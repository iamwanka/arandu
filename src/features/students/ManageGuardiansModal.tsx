import { useMemo, useState } from 'react';

import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Modal from '@cloudscape-design/components/modal';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Toggle from '@cloudscape-design/components/toggle';

import { DataTable, EmptyState, FeedbackAlert, ProfileSelect } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { createParentLink, listParentLinksForStudent, listProfilesByRole, updateParentLinkActive } from '../../services';
import type { ParentStudentLink, Student } from '../../types';

const RELATIONSHIP_OPTIONS = [
    { value: 'madre', label: 'Madre' },
    { value: 'padre', label: 'Padre' },
    { value: 'acudiente', label: 'Acudiente' },
    { value: 'tutor_legal', label: 'Tutor legal' },
];

function getRelationshipLabel(value: string): string {
    return RELATIONSHIP_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

interface ManageGuardiansModalProps {
    student: Student;
    onDismiss: () => void;
}

/**
 * Vínculos entre un estudiante y sus acudientes.
 *
 * Un acudiente solo puede tener una fila por estudiante (restricción única en
 * `parent_student_relationships`), así que "quitar" un acudiente desactiva el
 * vínculo en vez de borrarlo — conserva el historial y evita choques si se
 * vuelve a vincular más adelante.
 */
export default function ManageGuardiansModal({ student, onDismiss }: ManageGuardiansModalProps) {
    const { data: links, loading, error, reload, setData } = useAsyncData(
        () => listParentLinksForStudent(student.id),
        [student.id],
    );
    const { data: parents } = useAsyncData(() => listProfilesByRole('parent'), []);

    const parentById = useMemo(() => new Map((parents ?? []).map((parent) => [parent.id, parent])), [parents]);

    const [newParentId, setNewParentId] = useState<string | null>(null);
    const [relationship, setRelationship] = useState(RELATIONSHIP_OPTIONS[2]);

    const addLink = useAsyncAction(
        () => createParentLink({ parentProfileId: newParentId!, studentId: student.id, relationship: relationship.value }),
        {
            successMessage: 'Acudiente vinculado.',
            onSuccess: (created) => {
                setData((current) => [...(current ?? []), created]);
                setNewParentId(null);
            },
        },
    );

    const toggleLink = useAsyncAction(
        (link: ParentStudentLink, active: boolean) => updateParentLinkActive(link.id, active),
        {
            onSuccess: (updated) => {
                setData((current) => (current ?? []).map((link) => (link.id === updated.id ? updated : link)));
            },
        },
    );

    // Ya vinculado (activo o no) no se puede volver a elegir: reinsertarlo
    // chocaría con la restricción única del acudiente por estudiante.
    const linkedParentIds = (links ?? []).map((link) => link.parentProfileId);

    return (
        <Modal
            visible
            onDismiss={onDismiss}
            header={`Acudientes de ${student.fullName}`}
            closeAriaLabel="Cerrar"
            size="large"
        >
            <SpaceBetween size="l">
                <FeedbackAlert
                    error={error ?? addLink.error ?? toggleLink.error}
                    success={addLink.success}
                    onRetry={error ? () => void reload() : undefined}
                />

                <DataTable
                    variant="embedded"
                    title="Acudientes vinculados"
                    trackBy="id"
                    items={links ?? []}
                    loading={loading}
                    loadingText="Cargando acudientes"
                    emptyTitle="Sin acudientes vinculados"
                    emptyDescription="Agrega uno con el formulario de abajo."
                    columns={[
                        {
                            id: 'name',
                            header: 'Acudiente',
                            cell: (item) => parentById.get(item.parentProfileId)?.name ?? item.parentProfileId,
                        },
                        {
                            id: 'email',
                            header: 'Correo',
                            cell: (item) => parentById.get(item.parentProfileId)?.email ?? '—',
                        },
                        {
                            id: 'relationship',
                            header: 'Relación',
                            cell: (item) => getRelationshipLabel(item.relationship),
                        },
                        {
                            id: 'active',
                            header: 'Vinculado',
                            cell: (item) => (
                                <Toggle
                                    checked={item.active}
                                    disabled={toggleLink.pending}
                                    onChange={({ detail }) => void toggleLink.run(item, detail.checked)}
                                >
                                    {item.active ? 'Sí' : 'No'}
                                </Toggle>
                            ),
                        },
                    ]}
                />

                <FormField label="Agregar acudiente">
                    <SpaceBetween size="s">
                        {(parents ?? []).length === 0 ? (
                            <EmptyState
                                title="No hay cuentas con rol Padre o acudiente"
                                description="Asigna ese rol desde Usuarios y roles antes de vincular un acudiente."
                            />
                        ) : (
                            <SpaceBetween direction="horizontal" size="s">
                                <ProfileSelect
                                    role="parent"
                                    excludeProfileIds={linkedParentIds}
                                    value={newParentId}
                                    onChange={(id) => setNewParentId(id)}
                                    placeholder="Selecciona un acudiente"
                                />
                                <Select
                                    selectedOption={relationship}
                                    onChange={({ detail }) =>
                                        setRelationship(
                                            RELATIONSHIP_OPTIONS.find((o) => o.value === detail.selectedOption.value) ??
                                            RELATIONSHIP_OPTIONS[2],
                                        )
                                    }
                                    options={RELATIONSHIP_OPTIONS}
                                />
                                <Button
                                    disabled={!newParentId}
                                    loading={addLink.pending}
                                    onClick={() => void addLink.run()}
                                >
                                    Agregar
                                </Button>
                            </SpaceBetween>
                        )}
                    </SpaceBetween>
                </FormField>
            </SpaceBetween>
        </Modal>
    );
}
