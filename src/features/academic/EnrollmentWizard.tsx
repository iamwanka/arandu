import { useState } from 'react';

import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import DatePicker from '@cloudscape-design/components/date-picker';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Wizard, { type WizardProps } from '@cloudscape-design/components/wizard';

import { FeedbackAlert, StudentSelect } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { generateEnrollmentReceiptPdf } from '../../lib/pdf';
import { getRoleLabel } from '../../lib/roles';
import { enrollmentsService, hasActiveEnrollment } from '../../services';
import type { AcademicPeriod, AppSession, Enrollment, Student } from '../../types';
import AcademicPeriodSelect from './AcademicPeriodSelect';

const WIZARD_I18N: WizardProps.I18nStrings = {
    stepNumberLabel: (stepNumber) => `Paso ${stepNumber}`,
    collapsedStepsLabel: (stepNumber, stepsCount) => `Paso ${stepNumber} de ${stepsCount}`,
    navigationAriaLabel: 'Pasos de la matrícula',
    cancelButton: 'Cancelar',
    previousButton: 'Atrás',
    nextButton: 'Siguiente',
    submitButton: 'Matricular',
    optional: 'opcional',
};

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

interface EnrollmentWizardProps {
    session: AppSession;
    onDismiss: () => void;
    onCreated: (enrollment: Enrollment) => void;
}

/**
 * Flujo de matrícula paso a paso: estudiante → periodo y grado → confirmar.
 * Valida que no exista ya una matrícula activa del estudiante en ese periodo
 * antes de dejar avanzar, y genera el comprobante en PDF al finalizar.
 */
export default function EnrollmentWizard({ session, onDismiss, onCreated }: EnrollmentWizardProps) {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [stepError, setStepError] = useState<string | null>(null);

    const [studentId, setStudentId] = useState<string | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [periodId, setPeriodId] = useState<string | null>(null);
    const [period, setPeriod] = useState<AcademicPeriod | null>(null);
    const [gradeLevel, setGradeLevel] = useState('');
    const [enrollmentDate, setEnrollmentDate] = useState(todayIso());

    const { data: alreadyEnrolled, loading: checkingDuplicate } = useAsyncData(
        () => (studentId && periodId ? hasActiveEnrollment(studentId, periodId) : Promise.resolve(false)),
        [studentId, periodId],
    );

    const create = useAsyncAction(
        () =>
            enrollmentsService.create({
                studentId: studentId!,
                academicPeriodId: periodId!,
                gradeLevel: gradeLevel.trim(),
                status: 'active',
                enrollmentDate,
                certificateUrl: null,
            }),
        {
            successMessage: 'Matrícula creada. Descargando comprobante…',
            onSuccess: (enrollment) => {
                generateEnrollmentReceiptPdf({
                    studentName: student?.fullName ?? '—',
                    studentCode: student?.studentCode ?? null,
                    gradeLevel: enrollment.gradeLevel,
                    academicPeriodName: period?.name ?? '—',
                    enrollmentDate: enrollment.enrollmentDate,
                    statusLabel: 'Activa',
                    processedByName: `${session.user.name} (${getRoleLabel(session.user.role)})`,
                });
                onCreated(enrollment);
            },
        },
    );

    const handleNavigate = ({ detail }: { detail: WizardProps.NavigateDetail }) => {
        if (detail.reason === 'next') {
            if (activeStepIndex === 0 && !studentId) {
                setStepError('Selecciona un estudiante para continuar.');
                return;
            }
            if (activeStepIndex === 1) {
                if (!periodId) {
                    setStepError('Selecciona un periodo académico.');
                    return;
                }
                if (!gradeLevel.trim()) {
                    setStepError('El grado o curso es obligatorio.');
                    return;
                }
                if (checkingDuplicate) {
                    setStepError('Espera un momento: verificando matrículas existentes…');
                    return;
                }
                if (alreadyEnrolled) {
                    setStepError('Este estudiante ya tiene una matrícula activa en el periodo seleccionado.');
                    return;
                }
            }
        }

        setStepError(null);
        setActiveStepIndex(detail.requestedStepIndex);
    };

    const steps: WizardProps.Step[] = [
        {
            title: 'Estudiante',
            description: 'Elige a quién se va a matricular.',
            content: (
                <SpaceBetween size="l">
                    <FormField label="Estudiante" errorText={activeStepIndex === 0 ? stepError : undefined}>
                        <StudentSelect
                            value={studentId}
                            onChange={(id, selected) => {
                                setStudentId(id);
                                setStudent(selected);
                                if (selected?.gradeLevel && !gradeLevel) {
                                    setGradeLevel(selected.gradeLevel);
                                }
                            }}
                        />
                    </FormField>
                </SpaceBetween>
            ),
        },
        {
            title: 'Periodo y grado',
            description: 'Elige el periodo académico y confirma el grado que cursará.',
            content: (
                <SpaceBetween size="l">
                    <FormField label="Periodo académico" errorText={activeStepIndex === 1 ? stepError : undefined}>
                        <AcademicPeriodSelect
                            value={periodId}
                            onChange={(id, selected) => {
                                setPeriodId(id);
                                setPeriod(selected);
                            }}
                        />
                    </FormField>

                    <FormField label="Grado o curso">
                        <Input value={gradeLevel} onChange={(event) => setGradeLevel(event.detail.value)} />
                    </FormField>

                    <FormField label="Fecha de matrícula">
                        <DatePicker
                            value={enrollmentDate}
                            onChange={(event) => setEnrollmentDate(event.detail.value)}
                            placeholder="AAAA/MM/DD"
                        />
                    </FormField>

                    {alreadyEnrolled ? (
                        <Alert type="warning">
                            Este estudiante ya tiene una matrícula activa en el periodo seleccionado.
                        </Alert>
                    ) : null}
                </SpaceBetween>
            ),
        },
        {
            title: 'Confirmar',
            description: 'Revisa los datos antes de generar la matrícula.',
            content: (
                <SpaceBetween size="l">
                    <FeedbackAlert error={create.error} />
                    <ColumnLayout columns={2} variant="text-grid">
                        <div>
                            <Box variant="awsui-key-label">Estudiante</Box>
                            <Box>{student?.fullName ?? '—'}</Box>
                        </div>
                        <div>
                            <Box variant="awsui-key-label">Periodo académico</Box>
                            <Box>{period?.name ?? '—'}</Box>
                        </div>
                        <div>
                            <Box variant="awsui-key-label">Grado o curso</Box>
                            <Box>{gradeLevel || '—'}</Box>
                        </div>
                        <div>
                            <Box variant="awsui-key-label">Fecha de matrícula</Box>
                            <Box>{enrollmentDate}</Box>
                        </div>
                    </ColumnLayout>
                    <Box color="text-body-secondary">
                        Al confirmar se creará la matrícula con estado «Activa» y se descargará el comprobante en PDF.
                    </Box>
                </SpaceBetween>
            ),
        },
    ];

    return (
        <Wizard
            i18nStrings={WIZARD_I18N}
            activeStepIndex={activeStepIndex}
            onNavigate={handleNavigate}
            onCancel={onDismiss}
            onSubmit={() => void create.run()}
            isLoadingNextStep={create.pending}
            steps={steps}
        />
    );
}
