import { jsPDF } from 'jspdf';

export interface EnrollmentReceiptData {
    studentName: string;
    studentEmail: string;
    gradeLevel: string;
    programName: string;
    advisorName: string;
    enrollmentDate: string;
}

export function generateEnrollmentReceiptPdf(data: EnrollmentReceiptData): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Comprobante de matrícula', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre del estudiante: ${data.studentName}`, 20, 50);
    doc.text(`Correo electrónico: ${data.studentEmail}`, 20, 60);
    doc.text(`Grado/curso: ${data.gradeLevel}`, 20, 70);
    doc.text(`Programa académico: ${data.programName}`, 20, 80);
    doc.text(`Responsable académico: ${data.advisorName}`, 20, 90);
    doc.text(`Fecha de matrícula: ${data.enrollmentDate}`, 20, 100);

    doc.setFont('helvetica', 'bold');
    doc.text('Estado:', 20, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('Aprobada', 45, 120);

    doc.setFontSize(10);
    doc.text('Este documento es un comprobante provisional generado desde la aplicación Arandu.', 20, 145);
    doc.save(`comprobante-matricula-${data.studentName.replace(/\s+/g, '_')}.pdf`);
}
