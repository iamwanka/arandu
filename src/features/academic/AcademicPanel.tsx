import Tabs from '@cloudscape-design/components/tabs';

import type { AppSession } from '../../types';
import AcademicPeriodsPanel from './AcademicPeriodsPanel';
import EnrollmentsPanel from './EnrollmentsPanel';
import SubjectsPanel from './SubjectsPanel';

interface AcademicPanelProps {
    session: AppSession;
}

/** Catálogo académico: asignaturas, periodos y matrícula, agrupados en una sola sección. */
export default function AcademicPanel({ session }: AcademicPanelProps) {
    return (
        <Tabs
            tabs={[
                { id: 'enrollments', label: 'Matrícula', content: <EnrollmentsPanel session={session} /> },
                { id: 'subjects', label: 'Asignaturas', content: <SubjectsPanel /> },
                { id: 'periods', label: 'Periodos académicos', content: <AcademicPeriodsPanel /> },
            ]}
        />
    );
}
