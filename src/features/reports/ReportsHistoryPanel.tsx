import { useMemo, useState } from 'react';

import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { DataTable, FeedbackAlert } from '../../components/ui';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getErrorMessage } from '../../lib/errors';
import { downloadBlob } from '../../lib/pdf';
import {
    academicPeriodsService,
    downloadReportFile,
    generatedReportsService,
    listProfiles,
    studentsService,
} from '../../services';
import type { GeneratedReport } from '../../types';
import { getReportTypeLabel } from './REPORT_TYPE_OPTIONS';

/** Historial de reportes generados por el staff: quién, cuándo, para quién y de qué tipo. */
export default function ReportsHistoryPanel() {
    const { data: reports, loading, error, reload } = useAsyncData(() => generatedReportsService.list(), []);
    const { data: students } = useAsyncData(() => studentsService.list(), []);
    const { data: periods } = useAsyncData(() => academicPeriodsService.list(), []);
    const { data: profiles } = useAsyncData(() => listProfiles(), []);

    const studentById = useMemo(() => new Map((students ?? []).map((student) => [student.id, student])), [students]);
    const periodById = useMemo(() => new Map((periods ?? []).map((period) => [period.id, period])), [periods]);
    const profileById = useMemo(() => new Map((profiles ?? []).map((profile) => [profile.id, profile])), [profiles]);

    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const handleDownload = async (report: GeneratedReport) => {
        setDownloadingId(report.id);
        setDownloadError(null);
        try {
            const blob = await downloadReportFile(report.fileUrl);
            const label = studentById.get(report.studentId ?? '')?.fullName ?? report.gradeLevel ?? 'institucional';
            downloadBlob(blob, `${report.reportType}-${label.replace(/\s+/g, '_')}.pdf`);
        } catch (caught) {
            setDownloadError(getErrorMessage(caught));
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <SpaceBetween size="l">
            <FeedbackAlert error={error ?? downloadError} onRetry={error ? () => void reload() : undefined} />

            <DataTable
                title="Historial de reportes"
                description="Todos los boletines y reportes institucionales generados."
                trackBy="id"
                items={reports ?? []}
                loading={loading}
                loadingText="Cargando historial"
                emptyTitle="Sin reportes generados"
                emptyDescription="Los boletines y reportes que generes aparecerán aquí."
                actions={
                    <Button iconName="refresh" onClick={() => void reload()} loading={loading}>
                        Actualizar
                    </Button>
                }
                columns={[
                    { id: 'type', header: 'Tipo', cell: (item) => getReportTypeLabel(item.reportType) },
                    {
                        id: 'target',
                        header: 'Estudiante / grado',
                        cell: (item) => studentById.get(item.studentId ?? '')?.fullName ?? item.gradeLevel ?? '—',
                    },
                    {
                        id: 'period',
                        header: 'Periodo académico',
                        cell: (item) => periodById.get(item.academicPeriodId ?? '')?.name ?? '—',
                    },
                    {
                        id: 'generatedBy',
                        header: 'Generado por',
                        cell: (item) => profileById.get(item.generatedBy)?.name ?? '—',
                    },
                    { id: 'date', header: 'Fecha', cell: (item) => new Date(item.generatedAt).toLocaleString('es-CO') },
                    {
                        id: 'download',
                        header: 'Descargar',
                        cell: (item) => (
                            <Button
                                variant="inline-link"
                                loading={downloadingId === item.id}
                                onClick={() => void handleDownload(item)}
                            >
                                Descargar
                            </Button>
                        ),
                    },
                ]}
            />
        </SpaceBetween>
    );
}
