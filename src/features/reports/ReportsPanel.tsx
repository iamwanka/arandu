import Tabs from '@cloudscape-design/components/tabs';

import type { AppSession } from '../../types';
import AttendanceReportGenerator from './AttendanceReportGenerator';
import BoletinGenerator from './BoletinGenerator';
import PerformanceReportGenerator from './PerformanceReportGenerator';
import ReportsHistoryPanel from './ReportsHistoryPanel';

interface ReportsPanelProps {
    session: AppSession;
}

/** Sección "Reportes": solo admin/coordinador la ven (ruta restringida en `appRoutes.ts`). */
export default function ReportsPanel({ session }: ReportsPanelProps) {
    return (
        <Tabs
            tabs={[
                { id: 'boletin', label: 'Boletines', content: <BoletinGenerator session={session} /> },
                { id: 'asistencia', label: 'Asistencia', content: <AttendanceReportGenerator session={session} /> },
                { id: 'rendimiento', label: 'Rendimiento', content: <PerformanceReportGenerator session={session} /> },
                { id: 'historial', label: 'Historial', content: <ReportsHistoryPanel /> },
            ]}
        />
    );
}
