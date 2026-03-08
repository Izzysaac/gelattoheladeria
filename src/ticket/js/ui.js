
// ui.js - Manejo de interfaz de usuario para tabla editable y cálculos
import { DeliveryAction } from "@cloudinary/url-gen/actions/delivery/DeliveryAction";
import { PRODUCTOS_CONFIG, DELIVERY } from "../products-import.js";

let currentOrder = {
    items: [],
    subtotal: 0,
    envio: 0,
    iva: 0,
    total: 0,
};

/* ========== MENSAJES FEEDBACK ========== */
/* Muestra mensaje en la interfaz */
export function showMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.className = type === 'error' ? 'error' : 'success';
    messageDiv.textContent = message;
    
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(messageDiv);
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

/* Limpia todos los mensajes*/
export function clearMessages() {
    document.getElementById('messages').innerHTML = '';
}

/* ========== FORMATEO DE DATOS ========== */
/* Formatea número como moneda colombiana */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        // style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function getDeliveryType() {
    return document.getElementById('clientDeliveryType').value;
}

function getDeliveryValue() {
    return document.getElementById('envio').value;
}

function displayDelivery(boolean, envio) {
    const div = document.getElementById("display-envio");
    div.parentElement.style.display = boolean ? 'flex' : 'none';
    if (boolean) {
        div.textContent = formatCurrency(envio);
    }
}

document.getElementById('clientDeliveryType').addEventListener('change', function() {
    calculateTotals();
});

document.getElementById('envio').addEventListener('change', function() {
    calculateTotals();
});

/* Calcula totales del pedido */
function calculateTotals() {
    const subtotal = currentOrder.items.reduce((sum, item) => {
        return sum + (item.cantidad * item.precio);
    }, 0);
    let total = 0;

    const deliveryType = getDeliveryType();
    let envio = Number(getDeliveryValue());
    if (deliveryType == "Domicilio"){
        total = Number(subtotal) + Number(envio);
        displayDelivery(true, envio);
    } else {
        total = Number(subtotal);
        envio = 0;
        displayDelivery(false, envio);
    }
    currentOrder.subtotal = subtotal;
    currentOrder.envio = envio;
    currentOrder.total = total;
    
    // Actualizar UI
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    // document.getElementById('iva').textContent = formatCurrency(iva);
    document.getElementById('total').textContent = formatCurrency(total);

}

/* ========== TABLA EDITABLE ========== */
/* Crea una fila editable de la tabla */
function createTableRow(item, index) {
    const row = document.createElement('tr');
    row.dataset.index = index;
    const subtotal = item.cantidad * item.precio;
    // Generar opciones de productos dinámicamente
    const productOptions = Object.keys(PRODUCTOS_CONFIG).map(nombre => {
        return `<option value="${nombre}" ${item.producto === nombre ? 'selected' : ''}>${nombre}</option>`;
    }).join('');
    // row.innerHTML = `
    //     <td>
    //         <select class="editable producto-select">
    //             ${productOptions}
    //         </select>
    //     </td>
    //     <td>
    //         <input 
    //             type="number" 
    //             class="editable cantidad-input" 
    //             value="${item.cantidad}" 
    //             min="0.1" 
    //             step="0.1"
    //         />
    //     </td>
    //     <td>
    //         <select class="editable unidad-select">
    //             <option value="unidad" ${item.unidad === 'unidad' ? 'selected' : ''}>Unidad</option>
    //             <option value="kg" ${item.unidad === 'kg' ? 'selected' : ''}>Kg</option>
    //         </select>
    //     </td>
    //     <td>
    //         <input 
    //             type="number" 
    //             class="editable precio-input" 
    //             value="${item.precio}" 
    //             min="0" 
    //             step="100"
    //         />
    //     </td>
    //     <td>
    //         <strong>${formatCurrency(subtotal)}</strong>
    //     </td>
    //     <td>
    //         <button class="btn btn-danger remove-btn" style="padding: 6px 12px; font-size: 12px;">
    //             🗑️ Eliminar
    //         </button>
    //     </td>
    // `;
    
    row.innerHTML = `
        <td>
            <input 
                type="number" 
                class="editable cantidad-input" 
                value="${item.cantidad}" 
                min="1" 
                step="1"
            />
        </td>
        <td>
            <select class="editable producto-select">
                ${productOptions}
            </select>
        </td>
        <td>
            <input 
                type="number" 
                class="editable precio-input" 
                value="${item.precio}" 
                min="0" 
                step="100"
            />
        </td>
        <td>
            <strong>${formatCurrency(subtotal)}</strong>
        </td>
        <td>
            <button class="btn btn-danger remove-btn" style="padding: 6px; font-size: 12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16m-4 0-.27-.812c-.263-.787-.394-1.18-.637-1.471a2 2 0 0 0-.803-.578C13.939 3 13.524 3 12.695 3h-1.388c-.829 0-1.244 0-1.596.139a2 2 0 0 0-.803.578c-.243.29-.374.684-.636 1.471L8 6m10 0v10.2c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C15.72 21 14.88 21 13.2 21h-2.4c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C6 18.72 6 17.88 6 16.2V6m8 4v7m-4-7v7"/></svg>
            </button>
        </td>
    `;
    
    return row;
}

/* Renderiza la tabla completa */
export function renderOrderTable(items = []) {
    currentOrder.items = [...items];
    
    const tbody = document.getElementById('orderTableBody');
    const orderSection = document.getElementById('orderSection');
    const clientSection = document.getElementById('clientSection');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">No hay productos en el pedido</td></tr>';
        orderSection.style.display = 'none';
        if (clientSection) clientSection.style.display = 'block';
        return;
    }
    tbody.innerHTML = '';
    items.forEach((item, index) => {
        tbody.appendChild(createTableRow(item, index));
    });
    calculateTotals();
    orderSection.style.display = 'block';
    if (clientSection) clientSection.style.display = 'block';
}


/* ========== GESTIÓN DE ITEMS ========== */
/* Actualiza un item específico */
function updateItem(index, field, value) {
    if (index < 0 || index >= currentOrder.items.length) return;
    const item = currentOrder.items[index];
    // Validaciones básicas
    if (field === 'cantidad' && (isNaN(value) || value <= 0)) {
        showMessage('La cantidad debe ser un número mayor a 0', 'error');
        return;
    }
    if (field === 'precio' && (isNaN(value) || value < 0)) {
        showMessage('El precio debe ser un número mayor o igual a 0', 'error');
        return;
    }
    item[field] = value;
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (row) {
        const newRow = createTableRow(item, index);
        row.replaceWith(newRow);
    }
    calculateTotals();
    saveToLocalStorage();
}

/* Elimina un item del pedido */
function removeItem(index) {
    if (index < 0 || index >= currentOrder.items.length) return;
    if (confirm('¿Está seguro de eliminar este producto?')) {
        currentOrder.items.splice(index, 1);
        renderOrderTable(currentOrder.items);
        saveToLocalStorage();
        if (currentOrder.items.length === 0) {
            showMessage('Pedido vacío', 'info');
        }
    }
}

/* Agrega un nuevo producto vacío */
function addProduct() {
    // Selecciona el primer producto disponible como default
    const firstProduct = Object.keys(PRODUCTOS_CONFIG)[0];
    const newItem = {
        producto: firstProduct,
        cantidad: 1,
        // unidad: PRODUCTOS_CONFIG[firstProduct]?.unidadDefault || 'unidad',
        precio: PRODUCTOS_CONFIG[firstProduct]?.precio || 0
    };
    currentOrder.items.push(newItem);
    renderOrderTable(currentOrder.items);
    saveToLocalStorage();
    showMessage('Producto agregado. Complete los datos.', 'success');
}

/* ========== GESTIÓN DE ALMACENAMIENTO ========== */
/* Guarda el pedido actual en localStorage */
function saveToLocalStorage() {
    try {
        const orderData = {
            items: currentOrder.items,
            timestamp: new Date().toISOString(),
            subtotal: currentOrder.subtotal,
            envio: currentOrder.envio,
            // iva: currentOrder.iva,
            total: currentOrder.total
        };
        
        localStorage.setItem('currentOrder', JSON.stringify(orderData));
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
    }
}

/*Carga pedido desde localStorage */
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('currentOrder');
        if (saved) {
            const orderData = JSON.parse(saved);
            return orderData.items || [];
        }
    } catch (error) {
        console.error('Error cargando desde localStorage:', error);
    }
    return [];
}

/* Guarda pedido con nombre personalizado */
window.saveOrder = function() {
    if (currentOrder.items.length === 0) {
        showMessage('No hay productos para guardar', 'error');
        return;
    }
    
    const orderName = prompt('Nombre del pedido:', `Pedido_${new Date().toLocaleDateString()}`);
    if (!orderName) return;
    
    try {
        const orderData = {
            name: orderName,
            items: currentOrder.items,
            timestamp: new Date().toISOString(),
            subtotal: currentOrder.subtotal,
            iva: currentOrder.iva,
            envio: currentOrder.envio,
            total: currentOrder.total
        };
        
        // Obtener pedidos guardados
        const savedOrders = JSON.parse(localStorage.getItem('savedOrders') || '[]');
        savedOrders.push(orderData);
        
        // Limitar a 10 pedidos guardados
        if (savedOrders.length > 10) {
            savedOrders.shift();
        }
        
        localStorage.setItem('savedOrders', JSON.stringify(savedOrders));
        showMessage(`Pedido "${orderName}" guardado exitosamente`, 'success');
        
    } catch (error) {
        showMessage('Error al guardar el pedido', 'error');
        console.error('Error guardando pedido:', error);
    }
};

/* Carga pedido guardado */
window.loadOrder = function() {
    try {
        const savedOrders = JSON.parse(localStorage.getItem('savedOrders') || '[]');
        
        if (savedOrders.length === 0) {
            showMessage('No hay pedidos guardados', 'info');
            return;
        }
        
        // Crear lista de opciones
        const options = savedOrders.map((order, index) => 
            `${index}: ${order.name} (${new Date(order.timestamp).toLocaleDateString()})`
        ).join('\n');
        
        const selection = prompt(`Seleccione un pedido:\n${options}\n\nIngrese el número:`);
        if (selection === null) return;
        
        const index = parseInt(selection);
        if (isNaN(index) || index < 0 || index >= savedOrders.length) {
            showMessage('Selección inválida', 'error');
            return;
        }
        
        const selectedOrder = savedOrders[index];
        renderOrderTable(selectedOrder.items);
        showMessage(`Pedido "${selectedOrder.name}" cargado exitosamente`, 'success');
        
    } catch (error) {
        showMessage('Error al cargar el pedido', 'error');
        console.error('Error cargando pedido:', error);
    }
};

/* Limpia todo el pedido y la interfaz */
export const clearAll = function() {
    if (currentOrder.items.length > 0) {
        if (!confirm('¿Está seguro de limpiar todo el pedido?')) {
            return;
        }
    }
    currentOrder.items = [];
    document.getElementById('whatsappMessage').value = '';
    document.getElementById('orderSection').style.display = 'none';
    // Limpiar campos de cliente
    const clientFields = ['clientName', 'clientPhone', 'clientAddress', 'clientDeliveryType', 'clientPayment', 'clientNotes'];
    clientFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                el.value = '';
            }
        }
    });
    const clientSection = document.getElementById('clientSection');
    if (clientSection) clientSection.style.display = 'block';
    clearMessages();
    localStorage.removeItem('currentOrder');
    showMessage('Todo limpiado', 'success');
};

/* Inicializa la UI cargando datos previos si existe */
export function initializeUI() {
    const savedItems = loadFromLocalStorage();
    if (savedItems.length > 0) {
        renderOrderTable(savedItems);
        showMessage('Pedido anterior restaurado', 'info');
    }
    // Delegación de eventos para tabla
    const tbody = document.getElementById('orderTableBody');
    tbody.addEventListener('change', function(e) {
        const row = e.target.closest('tr');
        if (!row) return;
        const index = parseInt(row.dataset.index);
        if (e.target.classList.contains('producto-select')) {
            // Al cambiar producto, actualizar nombre y precio automáticamente
            const newProduct = e.target.value;
            const newPrice = PRODUCTOS_CONFIG[newProduct]?.precio || 0;
            // const newUnidad = PRODUCTOS_CONFIG[newProduct]?.unidadDefault || 'unidad';
            // Actualiza producto, precio y unidad
            updateItem(index, 'producto', newProduct);
            updateItem(index, 'precio', newPrice);
            // updateItem(index, 'unidad', newUnidad);
        } else if (e.target.classList.contains('unidad-select')) {
            // updateItem(index, 'unidad', e.target.value);
        } else if (e.target.classList.contains('cantidad-input')) {
            updateItem(index, 'cantidad', parseFloat(e.target.value));
        } else if (e.target.classList.contains('precio-input')) {
            updateItem(index, 'precio', parseFloat(e.target.value));
        }
    });
    tbody.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-btn')) {
            const row = e.target.closest('tr');
            if (!row) return;
            const index = parseInt(row.dataset.index);
            removeItem(index);
        }
    });
    // Botón agregar producto
    const addBtn = document.querySelector('button.btn:not(.btn-success):not(.btn-danger)[onclick*="addProduct"]');
    if (addBtn) {
        addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addProduct();
        });
        addBtn.removeAttribute('onclick');
    }
    // Botón limpiar todo
    const clearBtn = document.querySelector('button.btn-danger[onclick*="clearAll"]');
    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearAll();
        });
        clearBtn.removeAttribute('onclick');
    }
    // Envio
    document.getElementById('envio').value = DELIVERY;
}

/* Obtiene el pedido actual para exportar */
export function 
getCurrentOrder() {
    // Obtener datos de cliente desde el formulario
    const payment = document.getElementById('clientPayment')?.value || '';
    const deliveryType = document.getElementById('clientDeliveryType')?.value || '';
    const address = document.getElementById('clientAddress')?.value || '';
    const name = document.getElementById('clientName')?.value || '';
    const phone = document.getElementById('clientPhone')?.value || '';
    const notes = document.getElementById('clientNotes')?.value || '';

    return {
        items: [...currentOrder.items],
        subtotal: currentOrder.subtotal,
        iva: currentOrder.iva,
        total: currentOrder.total,
        envio: currentOrder.envio,
        timestamp: new Date().toISOString(),
        client: {
            name,
            phone,
            deliveryType,
            address,
            payment,
            notes
        }
    };
}