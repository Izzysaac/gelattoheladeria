// pdf.js - Generador de PDF usando html2pdf.js


/* ====== HELPERS ====== */
async function loadHtml2Pdf() {
    if (typeof window !== 'undefined' && window.html2pdf) {
        return window.html2pdf;
    }
    
    // Dynamically load html2pdf.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';
    document.head.appendChild(script);
    
    // Wait for script to load
    return new Promise((resolve, reject) => {
        script.onload = () => {
            resolve(window.html2pdf);
        };
        script.onerror = reject;
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        // style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/* ====== TEMPLATE LOADER ====== */
async function loadAndPopulateTemplate(orderData) {
    try {
        // Load the HTML template
        const response = await fetch('./ticket.html');
        const htmlTemplate = await response.text();
        
        // Create a temporary DOM element to work with the template
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlTemplate, 'text/html');
        
        // Generate order number and dates
        const orderNumber = `PED-${Date.now().toString().slice(-6)}`;
        const currentDate = formatDate(new Date());

        // Populate header information
        // doc.getElementById('order-number').textContent = orderNumber;
        doc.getElementById('order-date').textContent = currentDate;
        // doc.getElementById('generation-date').textContent = currentDate;
        
        // Populate client information
        const client = orderData.client || {};
        doc.getElementById('client-name').textContent = client.name || '';
        doc.getElementById('client-phone').textContent = client.phone || '';
        if (client.deliveryType == "Domicilio") {
            doc.getElementById('client-delivery-type').textContent = client.deliveryType || '';
            doc.getElementById('client-address').textContent = client.address || '';
        } else {
            doc.getElementById('client-delivery-type').textContent = client.deliveryType || '';
            doc.getElementById('client-address').parentElement.remove();
        }
        doc.getElementById('client-payment').textContent = client.payment || '';
        if (client.notes == "") {
            doc.getElementById('client-notes').parentElement.remove();
        } else {
            doc.getElementById('client-notes').textContent = client.notes || '';
        }
        
        // Populate products table
        const tbody = doc.getElementById('products-tbody');
        tbody.innerHTML = ''; // Clear existing content
        
        orderData.items.forEach((item) => {
            const subtotal = item.cantidad * item.precio;
            const row = doc.createElement('tr');
        
            row.innerHTML = `
                <td class="cantidad">${item.cantidad}</td>
                <td class="product-name">${item.producto.toUpperCase()}</td>
                <td class="precio-unitario">
                    <div>
                        <span>$</span>
                        <span>${formatCurrency(item.precio)}</span>
                    </div>
                </td>
                <td class="subtotal">
                    <div>
                        <span>$</span>
                        <span>${formatCurrency(subtotal)}</span>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
            console.log(tbody);
        });
        
        // Populate totals
        doc.getElementById('subtotal-amount').textContent = formatCurrency(orderData.subtotal);
        doc.getElementById("delivery-amount").textContent = formatCurrency(orderData.envio);
        doc.getElementById('total-amount').textContent = formatCurrency(orderData.total);
        
        return {
            html: doc.documentElement.outerHTML,
            orderNumber: orderNumber
        };
        
    } catch (error) {
        console.error('Error loading template:', error);
        throw new Error(`Error cargando plantilla: ${error.message}`);
    }
}

/* ====== PDF GENERATOR ====== */
export async function generateOrderPDF(orderData) {
    window.scrollTo(0, 0);
    try {
        // Load html2pdf library
        const html2pdf = await loadHtml2Pdf();
        
        // Load and populate the HTML template
        const { html, orderNumber } = await loadAndPopulateTemplate(orderData);
        
        // Create a temporary container for the HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        document.body.appendChild(tempContainer);
        
        // Configure html2pdf options
        const options = {
            // margin: [15, 15, 15, 15], // top, right, bottom, left (in mm)
            margin: [0, 0, 0, 0], 
            filename: `pedido_${orderNumber}_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                allowTaint: false
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };
        
        // Generate PDF
        const pdfBytes = await html2pdf()
            .set(options)
            .from(tempContainer.querySelector('.ticket'))
            .outputPdf('arraybuffer');
        
        // Clean up temporary container
        document.body.removeChild(tempContainer);
        
        return {
            success: true,
            pdfBytes: pdfBytes,
            filename: options.filename
        };
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        return {
            success: false,
            error: `Error al generar PDF: ${error.message}`
        };
    }
}


/* ====== ACTIONS ======*/
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