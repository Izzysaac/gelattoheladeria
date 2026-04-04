// app.js - Controlador principal de la aplicación

import { parseWhatsAppMessage, validateOrderItem } from './parser.js';
import { renderOrderTable, showMessage, clearMessages, initializeUI, getCurrentOrder, addProduct, clearAll } from './ui.js';
import { generateOrderPDF, downloadPDF, previewPDF } from './pdf.js';


/* Parsea el mensaje de WhatsApp y actualiza la UI */

window.parseMessage = async function() {
    const messageTextarea = document.getElementById('whatsappMessage');
    const message = messageTextarea.value.trim();
    if (!message) {
        // Si no hay mensaje, mostrar la sección de pedido vacía y cliente para flujo manual
        clearMessages();
        renderOrderTable([]);
        // Forzar mostrar secciones si están ocultas
        const orderSection = document.getElementById('orderSection');
        if (orderSection) orderSection.style.display = 'block';
        const clientSection = document.getElementById('clientSection');
        if (clientSection) clientSection.style.display = 'block';
        showMessage('Puede agregar productos manualmente.', 'info');
        return;
    }
    clearMessages();
    try {
        showMessage('Analizando mensaje...', 'info');
        const result = parseWhatsAppMessage(message);
        if (!result.success) {
            showMessage(result.error, 'error');
            if (result.suggestions) {
                const suggestionText = `Productos disponibles: ${result.suggestions.join(', ')}`;
                setTimeout(() => {
                    showMessage(suggestionText, 'info');
                }, 2000);
            }
            return;
        }
        // Validar items parseados
        const validItems = [];
        const errors = [];
        result.items.forEach((item, index) => {
            const validation = validateOrderItem(item);
            if (validation.isValid) {
                validItems.push(validation.item);
            } else {
                errors.push(`Producto ${index + 1}: ${validation.errors.join(', ')}`);
            }
        });

        if (validItems.length === 0) {
            showMessage('No se encontraron productos válidos en el mensaje', 'error');
            if (errors.length > 0) {
                setTimeout(() => {
                    showMessage(`Errores: ${errors.join('; ')}`, 'error');
                }, 2000);
            }
            return;
        }

        // --- Extraer y actualizar datos de cliente ---
        const paymentMatch = message.match(/\*M[eé]todo de pago:?\*\s*([^\n\r]*)/i);
        const deliveryType = message.match(/\*Entrega:?\*\s*([^\n\r]*)/i);
        const addressMatch = message.match(/\*Direcci[oó]n:?\*\s*([^\n\r]*)/i);
        const nameMatch = message.match(/\*Nombre:?\*\s*([^\n\r]*)/i);
        const phoneMatch = message.match(/\*Tel[eé]fono:?\*\s*([^\n\r]*)/i);
        const notesMatch = message.match(/\*Notas:?\*\s*([^\n\r]*)/i);
        if (paymentMatch) document.getElementById('clientPayment').value = paymentMatch[1].trim();
        if (deliveryType?.[1] == "Domicilio") document.getElementById('clientDeliveryType').value = "Domicilio";
        if (deliveryType?.[1] == "Recogida en local") document.getElementById('clientDeliveryType').value = "Recogida en local";
        if (addressMatch) document.getElementById('clientAddress').value = addressMatch[1].trim();
        if (nameMatch) document.getElementById('clientName').value = nameMatch[1].trim();
        if (phoneMatch) document.getElementById('clientPhone').value = phoneMatch[1].trim();
        if (notesMatch) document.getElementById('clientNotes').value = notesMatch[1].trim();
        // --- Fin actualización cliente ---

        // Renderizar tabla con productos válidos
        renderOrderTable(validItems);


        const successMsg = `✅ Mensaje procesado: ${validItems.length} producto(s) encontrado(s)`;
        showMessage(successMsg, 'success');
        if (errors.length > 0) {
            setTimeout(() => {
                showMessage(`⚠️ Algunos productos tuvieron errores: ${errors.join('; ')}`, 'error');
            }, 3000);
        }
    } catch (error) {
        console.error('Error procesando mensaje:', error);
        showMessage(`Error inesperado: ${error.message}`, 'error');
    }
};

/*Genera y descarga el PDF del pedido */
window.generatePDF = async function() {
    const currentOrder = getCurrentOrder();
    
    if (!currentOrder.items || currentOrder.items.length === 0) {
        showMessage('No hay productos en el pedido para generar PDF', 'error');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        showMessage('Generando PDF...', 'info');
        
        // Generar PDF
        const result = await generateOrderPDF(currentOrder);
        
        if (!result.success) {
            showMessage(result.error, 'error');
            return;
        }
        
        // Previsualizar PDF
        const previewed = previewPDF(result.pdfBytes);
        if (previewed) {
            showMessage('PDF abierto en nueva ventana', 'success');
        } else {
            showMessage('Error al abrir previsualización. Verifique que no esté bloqueando ventanas emergentes.', 'error');
        }
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        showMessage(`Error al generar PDF: ${error.message}`, 'error');
    }
};

/* Inicializa la aplicación cuando el DOM está listo */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicación de tickets iniciada');
    // Inicializar UI
    initializeUI();
    
    // Configurar eventos adicionales
    setupEventListeners();
    
    // Mostrar mensaje de bienvenida
    showMessage('Aplicación lista. Pegue un mensaje de WhatsApp para comenzar.', 'info');
});

/* Configura event listeners adicionales */
function setupEventListeners() {
    // Auto-guardar cuando se modifica el textarea
    const messageTextarea = document.getElementById('whatsappMessage');
    let saveTimeout;
    
    messageTextarea.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem('lastMessage', this.value);
        }, 1000);
    });
    
    // Restaurar último mensaje
    const lastMessage = localStorage.getItem('lastMessage');
    if (lastMessage) {
        messageTextarea.value = lastMessage;
    }

    // Boton añadir producto
    const btnAddProduct = document.getElementById('btn-add-product');
    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', function() {
            addProduct();
        });
    }
    
    // Atajos de teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter para parsear mensaje
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generatePDF();
        }
        
        // Ctrl/Cmd + S para guardar pedido
        if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
            e.preventDefault();
            clearAll();
        }
        
        // Ctrl/Cmd + E para generar PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            parseMessage();
        }
    });
    
    // Detectar pegado en textarea
    messageTextarea.addEventListener('paste', function() {
        setTimeout(() => {
            if (this.value.trim()) {
                showMessage('Mensaje pegado. Presione "Analizar Mensaje" o Ctrl+Enter', 'info');
            }
        }, 100);
    });
    
    // Prevenir pérdida de datos
    window.addEventListener('beforeunload', function(e) {
        const currentOrder = getCurrentOrder();
        if (currentOrder.items && currentOrder.items.length > 0) {
            e.preventDefault();
            e.returnValue = '¿Está seguro de salir? Los cambios no guardados se perderán.';
            return e.returnValue;
        }
    });
}

/* Manejo de errores globales */
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    showMessage('Error inesperado en la aplicación. Revise la consola para más detalles.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rechazada:', e.reason);
    showMessage('Error de procesamiento. Revise la consola para más detalles.', 'error');
});
