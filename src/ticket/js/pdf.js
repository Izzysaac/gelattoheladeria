// pdf.js - Generador de PDF usando pdf-lib

import { PDFDocument, StandardFonts, rgb } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

/**
 * Formatea número como moneda colombiana
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Formatea fecha en español
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * Genera PDF del pedido
 */
export async function generateOrderPDF(orderData) {
    try {
        // Crear nuevo documento PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 size
        
        // Obtener fuentes
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        // Configuración de colores
        const primaryColor = rgb(0.17, 0.24, 0.31); // #2c3e50
        const secondaryColor = rgb(0.2, 0.6, 0.86); // #3498db
        const textColor = rgb(0.2, 0.2, 0.2);
        const lightGray = rgb(0.95, 0.95, 0.95);
        
        // Dimensiones de página
        const { width, height } = page.getSize();
        const margin = 50;
        const contentWidth = width - (margin * 2);
        
        let yPosition = height - margin;
        
        // HEADER - Logo y título
        page.drawRectangle({
            x: margin,
            y: yPosition - 80,
            width: contentWidth,
            height: 80,
            color: primaryColor,
        });
        
        page.drawText('EL BROASTER CHEF PITALITO', {
            x: margin + 20,
            y: yPosition - 35,
            size: 24,
            font: boldFont,
            color: rgb(1, 1, 1),
        });
        
        page.drawText('TICKET DE PEDIDO', {
            x: margin + 20,
            y: yPosition - 60,
            size: 16,
            font: font,
            color: rgb(0.8, 0.8, 0.8),
        });
        
        // Número de pedido y fecha
        const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
        const currentDate = formatDate(new Date());
        
        page.drawText(`Pedido: ${orderNumber}`, {
            x: width - margin - 150,
            y: yPosition - 35,
            size: 12,
            font: boldFont,
            color: rgb(1, 1, 1),
        });
        
        page.drawText(`Fecha: ${currentDate}`, {
            x: width - margin - 150,
            y: yPosition - 55,
            size: 10,
            font: font,
            color: rgb(0.8, 0.8, 0.8),
        });
        
        yPosition -= 120;
        
        // INFORMACIÓN DEL CLIENTE (rellenada)
        page.drawText('INFORMACIÓN DEL CLIENTE', {
            x: margin,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: primaryColor,
        });
        yPosition -= 25;
        const client = orderData.client || {};
        page.drawText(`Cliente: ${client.name || ''}`, {
            x: margin,
            y: yPosition,
            size: 10,
            font: font,
            color: textColor,
        });
        page.drawText(`Teléfono: ${client.phone || ''}`, {
            x: margin + 300,
            y: yPosition,
            size: 10,
            font: font,
            color: textColor,
        });
        yPosition -= 20;
        page.drawText(`Dirección/Recogida: ${client.address || ''}`, {
            x: margin,
            y: yPosition,
            size: 10,
            font: font,
            color: textColor,
        });
        yPosition -= 20;
        page.drawText(`Método de pago: ${client.payment || ''}`, {
            x: margin,
            y: yPosition,
            size: 10,
            font: font,
            color: textColor,
        });
        yPosition -= 20;
        page.drawText(`Notas: ${client.notes || ''}`, {
            x: margin,
            y: yPosition,
            size: 10,
            font: font,
            color: textColor,
        });
        yPosition -= 20;
        yPosition -= 20;
        
        // TABLA DE PRODUCTOS
        page.drawText('DETALLE DEL PEDIDO', {
            x: margin,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: primaryColor,
        });
        
        yPosition -= 30;
        
        // Header de la tabla
        const tableHeaders = ['PRODUCTO', 'CANT.', 'UNIDAD', 'PRECIO UNIT.', 'SUBTOTAL'];
        const columnWidths = [200, 60, 80, 100, 100];
        const columnPositions = [margin];
        
        // Calcular posiciones de columnas
        for (let i = 1; i < columnWidths.length; i++) {
            columnPositions.push(columnPositions[i-1] + columnWidths[i-1]);
        }
        
        // Dibujar header de tabla
        page.drawRectangle({
            x: margin,
            y: yPosition - 25,
            width: contentWidth,
            height: 25,
            color: lightGray,
        });
        
        tableHeaders.forEach((header, index) => {
            page.drawText(header, {
                x: columnPositions[index] + 5,
                y: yPosition - 15,
                size: 10,
                font: boldFont,
                color: textColor,
            });
        });
        
        yPosition -= 25;
        
        // Filas de productos
        let rowIndex = 0;
        orderData.items.forEach((item) => {
            const subtotal = item.cantidad * item.precio;
            
            // Alternar color de fondo
            if (rowIndex % 2 === 0) {
                page.drawRectangle({
                    x: margin,
                    y: yPosition - 20,
                    width: contentWidth,
                    height: 20,
                    color: rgb(0.98, 0.98, 0.98),
                });
            }
            
            // Datos de la fila
            const rowData = [
                item.producto.charAt(0).toUpperCase() + item.producto.slice(1),
                item.cantidad.toString(),
                item.unidad,
                formatCurrency(item.precio),
                formatCurrency(subtotal)
            ];
            
            rowData.forEach((data, index) => {
                page.drawText(data, {
                    x: columnPositions[index] + 5,
                    y: yPosition - 12,
                    size: 9,
                    font: font,
                    color: textColor,
                });
            });
            
            yPosition -= 20;
            rowIndex++;
        });
        
        yPosition -= 20;
        
        // TOTALES
        const totalsStartY = yPosition;
        
        // Línea separadora
        page.drawLine({
            start: { x: margin + 300, y: yPosition },
            end: { x: margin + contentWidth, y: yPosition },
            thickness: 1,
            color: textColor,
        });
        
        yPosition -= 25;
        
        // Subtotal
        page.drawText('Subtotal:', {
            x: margin + 350,
            y: yPosition,
            size: 11,
            font: font,
            color: textColor,
        });
        
        page.drawText(formatCurrency(orderData.subtotal), {
            x: margin + 450,
            y: yPosition,
            size: 11,
            font: font,
            color: textColor,
        });
        
        yPosition -= 20;
        
        // IVA
        page.drawText('IVA (19%):', {
            x: margin + 350,
            y: yPosition,
            size: 11,
            font: font,
            color: textColor,
        });
        
        page.drawText(formatCurrency(orderData.iva), {
            x: margin + 450,
            y: yPosition,
            size: 11,
            font: font,
            color: textColor,
        });
        
        yPosition -= 25;
        
        // Total
        page.drawRectangle({
            x: margin + 340,
            y: yPosition - 5,
            width: 200,
            height: 25,
            color: primaryColor,
        });
        
        page.drawText('TOTAL:', {
            x: margin + 350,
            y: yPosition + 5,
            size: 12,
            font: boldFont,
            color: rgb(1, 1, 1),
        });
        
        page.drawText(formatCurrency(orderData.total), {
            x: margin + 450,
            y: yPosition + 5,
            size: 12,
            font: boldFont,
            color: rgb(1, 1, 1),
        });
        
        yPosition -= 60;
        
        // NOTAS Y TÉRMINOS
        page.drawText('NOTAS:', {
            x: margin,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: primaryColor,
        });
        
        yPosition -= 20;
        
        const notes = [
            '• Los precios incluyen IVA',
            '• Productos frescos del día',
            '• Entrega según disponibilidad',
            '• Confirmar pedido por WhatsApp'
        ];
        
        notes.forEach(note => {
            page.drawText(note, {
                x: margin,
                y: yPosition,
                size: 9,
                font: font,
                color: textColor,
            });
            yPosition -= 15;
        });
        
        yPosition -= 20;
        
        // FOOTER
        page.drawLine({
            start: { x: margin, y: yPosition },
            end: { x: margin + contentWidth, y: yPosition },
            thickness: 1,
            color: lightGray,
        });
        
        yPosition -= 20;
        
        page.drawText('Distribuidora de Pollo - Productos frescos y de calidad', {
            x: margin,
            y: yPosition,
            size: 8,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });
        
        page.drawText(`Generado el ${formatDate(new Date())}`, {
            x: margin + 350,
            y: yPosition,
            size: 8,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });
        
        // Serializar PDF
        const pdfBytes = await pdfDoc.save();
        
        return {
            success: true,
            pdfBytes: pdfBytes,
            filename: `pedido_${orderNumber}_${new Date().toISOString().slice(0, 10)}.pdf`
        };
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        return {
            success: false,
            error: `Error al generar PDF: ${error.message}`
        };
    }
}

/**
 * Descarga el PDF generado
 */
export function downloadPDF(pdfBytes, filename) {
    try {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Error descargando PDF:', error);
        return false;
    }
}

/**
 * Previsualiza el PDF en una nueva ventana
 */
export function previewPDF(pdfBytes) {
    try {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
            throw new Error('No se pudo abrir la ventana de previsualización');
        }
        
        // Limpiar URL después de un tiempo
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000);
        
        return true;
    } catch (error) {
        console.error('Error previsualizando PDF:', error);
        return false;
    }
}
