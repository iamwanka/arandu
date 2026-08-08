import { jsPDF } from 'jspdf';

export interface EnrollmentReceiptData {
    studentName: string;
    studentCode: string | null;
    gradeLevel: string;
    academicPeriodName: string;
    enrollmentDate: string;
    statusLabel: string;
    /** Nombre de quien procesó la matrícula, para trazabilidad del comprobante. */
    processedByName: string;
}

/**
 * Genera y descarga el comprobante de matrícula en el navegador.
 *
 * No se sube a Supabase Storage: es un documento generado en cliente, en
 * línea con "PDF o documento descargable" del alcance del Sprint 3. Si más
 * adelante se necesita conservarlo (p. ej. para `enrollments.certificate_url`),
 * hay que subir el blob a un bucket de Storage en vez de solo descargarlo.
 */
export function generateEnrollmentReceiptPdf(data: EnrollmentReceiptData): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Comprobante de matrícula', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estudiante: ${data.studentName}`, 20, 50);
    if (data.studentCode) {
        doc.text(`Código de estudiante: ${data.studentCode}`, 20, 60);
    }
    doc.text(`Grado o curso: ${data.gradeLevel}`, 20, 70);
    doc.text(`Periodo académico: ${data.academicPeriodName}`, 20, 80);
    doc.text(`Fecha de matrícula: ${data.enrollmentDate}`, 20, 90);
    doc.text(`Procesado por: ${data.processedByName}`, 20, 100);

    doc.setFont('helvetica', 'bold');
    doc.text('Estado:', 20, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(data.statusLabel, 45, 120);

    doc.setFontSize(10);
    doc.text('Este documento es un comprobante generado desde la aplicación Arandu.', 20, 145);
    doc.save(`comprobante-matricula-${data.studentName.replace(/\s+/g, '_')}.pdf`);
}

/* ------------------------------------------------------------------ */
/* Reportes y boletines (Sprint 6)                                    */
/* ------------------------------------------------------------------ */

const PAGE_BOTTOM_MARGIN = 280;
const ROW_HEIGHT = 8;

/**
 * A diferencia de `generateEnrollmentReceiptPdf`, estos builders devuelven el
 * `jsPDF` sin guardarlo: el llamador necesita tanto el blob (para subirlo a
 * Storage y dejar el registro en el historial) como el archivo local
 * inmediato (`doc.save(...)`).
 */
function newReportDoc(title: string, subtitle: string): jsPDF {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(subtitle, 20, 33);

    return doc;
}

/** Escribe una fila de columnas alineadas; agrega página nueva si no cabe. */
function writeRow(doc: jsPDF, cursorY: number, columns: Array<{ x: number; text: string }>): number {
    if (cursorY > PAGE_BOTTOM_MARGIN) {
        doc.addPage();
        cursorY = 25;
    }
    columns.forEach(({ x, text }) => doc.text(text, x, cursorY));
    return cursorY + ROW_HEIGHT;
}

function writeFooter(doc: jsPDF, generatedByName: string): void {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
        `Generado por ${generatedByName} desde la aplicación Arandu.`,
        20,
        doc.internal.pageSize.getHeight() - 10,
    );
}

export interface BoletinData {
    studentName: string;
    studentCode: string | null;
    gradeLevel: string | null;
    academicPeriodName: string;
    subjectAverages: Array<{ subjectName: string; average: number }>;
    overallAverage: number | null;
    attendanceRate: number | null;
    disciplineCount: number;
    generatedByName: string;
}

/** Boletín de un estudiante: notas por asignatura, asistencia y disciplina de un periodo. */
export function buildBoletinPdf(data: BoletinData): jsPDF {
    const doc = newReportDoc(
        'Boletín académico',
        `${data.studentName}${data.studentCode ? ` · ${data.studentCode}` : ''}${data.gradeLevel ? ` · ${data.gradeLevel}` : ''} — ${data.academicPeriodName}`,
    );

    let y = 50;
    doc.setFont('helvetica', 'bold');
    doc.text('Asignatura', 20, y);
    doc.text('Promedio', 150, y);
    doc.setFont('helvetica', 'normal');
    y += ROW_HEIGHT;

    if (data.subjectAverages.length === 0) {
        y = writeRow(doc, y, [{ x: 20, text: 'Sin calificaciones registradas en este periodo.' }]);
    } else {
        for (const subject of data.subjectAverages) {
            y = writeRow(doc, y, [
                { x: 20, text: subject.subjectName },
                { x: 150, text: subject.average.toFixed(2) },
            ]);
        }
    }

    y += ROW_HEIGHT;
    doc.setFont('helvetica', 'bold');
    y = writeRow(doc, y, [{ x: 20, text: 'Promedio general' }, { x: 150, text: data.overallAverage !== null ? data.overallAverage.toFixed(2) : '—' }]);
    y = writeRow(doc, y, [{ x: 20, text: 'Asistencia' }, { x: 150, text: data.attendanceRate !== null ? `${data.attendanceRate}%` : '—' }]);
    writeRow(doc, y, [{ x: 20, text: 'Incidencias disciplinarias' }, { x: 150, text: String(data.disciplineCount) }]);

    writeFooter(doc, data.generatedByName);
    return doc;
}

export interface AttendanceReportRow {
    studentId: string;
    studentName: string;
    daysRecorded: number;
    daysPresent: number;
    rate: number | null;
}

export interface AttendanceReportData {
    gradeLevel: string;
    academicPeriodName: string;
    rows: AttendanceReportRow[];
    generatedByName: string;
}

/** Reporte institucional de asistencia de un grado en un periodo. */
export function buildAttendanceReportPdf(data: AttendanceReportData): jsPDF {
    const doc = newReportDoc('Reporte de asistencia', `${data.gradeLevel} — ${data.academicPeriodName}`);

    let y = 50;
    doc.setFont('helvetica', 'bold');
    doc.text('Estudiante', 20, y);
    doc.text('Días registrados', 110, y);
    doc.text('Asistencia', 170, y);
    doc.setFont('helvetica', 'normal');
    y += ROW_HEIGHT;

    if (data.rows.length === 0) {
        writeRow(doc, y, [{ x: 20, text: 'Sin asistencia registrada en este periodo.' }]);
    } else {
        for (const row of data.rows) {
            y = writeRow(doc, y, [
                { x: 20, text: row.studentName },
                { x: 110, text: String(row.daysRecorded) },
                { x: 170, text: row.rate !== null ? `${row.rate}%` : '—' },
            ]);
        }
    }

    writeFooter(doc, data.generatedByName);
    return doc;
}

export interface PerformanceReportRow {
    studentId: string;
    studentName: string;
    average: number | null;
    gradesCount: number;
}

export interface PerformanceReportData {
    gradeLevel: string;
    academicPeriodName: string;
    rows: PerformanceReportRow[];
    generatedByName: string;
}

/** Reporte institucional de rendimiento (promedio general) de un grado en un periodo. */
export function buildPerformanceReportPdf(data: PerformanceReportData): jsPDF {
    const doc = newReportDoc('Reporte de rendimiento', `${data.gradeLevel} — ${data.academicPeriodName}`);

    let y = 50;
    doc.setFont('helvetica', 'bold');
    doc.text('Estudiante', 20, y);
    doc.text('Notas registradas', 110, y);
    doc.text('Promedio', 170, y);
    doc.setFont('helvetica', 'normal');
    y += ROW_HEIGHT;

    if (data.rows.length === 0) {
        writeRow(doc, y, [{ x: 20, text: 'Sin calificaciones registradas en este periodo.' }]);
    } else {
        for (const row of data.rows) {
            y = writeRow(doc, y, [
                { x: 20, text: row.studentName },
                { x: 110, text: String(row.gradesCount) },
                { x: 170, text: row.average !== null ? row.average.toFixed(2) : '—' },
            ]);
        }
    }

    writeFooter(doc, data.generatedByName);
    return doc;
}

/**
 * Descarga un blob ya obtenido (p. ej. desde Storage) con el nombre dado.
 *
 * Mismo patrón que usa jsPDF internamente para `doc.save()`: el `click()` va
 * en un `setTimeout(0)` en vez de ser síncrono — Chromium no siempre atiende
 * un click sintético inmediato sobre un link con `download` recién creado, y
 * revocar la URL demasiado pronto puede invalidar el blob a medio descargar.
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    setTimeout(() => link.click(), 0);
    setTimeout(() => URL.revokeObjectURL(url), 40000);
}
