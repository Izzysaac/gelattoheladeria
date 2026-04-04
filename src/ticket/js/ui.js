
// ui.js - Manejo de interfaz de usuario para tabla editable y cálculos
import { PRODUCTOS_CONFIG, DELIVERY } from "../products-import.js";
import { formatCurrency, calculateItemPrice, escapeHtml } from "./calculations.js";

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


/* Calcula totales del pedido */
function calculateTotals() {
    const subtotal = currentOrder.items.reduce((sum, item) => {
        const itemPrice = calculateItemPrice(item);
        return sum + (item.cantidad * itemPrice);
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
function renderGroupCheckboxTable(group, selectedVariant, rowIndex) {
    const selectedIds = selectedVariant?.option_ids || [];

    return `
        <div class="variant-group" data-group-id="${group.id}">
            <small>${escapeHtml(group.nombre)}</small>
            ${group.options.filter(o => o.activo).map(opt => `
                <label>
                    <input type="checkbox"
                        value="${opt.option_id}"
                        ${selectedIds.includes(opt.option_id) ? 'checked' : ''}/>
                    ${escapeHtml(opt.nombre)}
                </label>
            `).join('')}
        </div>
    `;
}


function renderGroupSingleTable(group, selectedVariant, rowIndex) {
    const selectedId = selectedVariant?.option_ids?.[0];
    return `
        <div class="variant-group">
            <small>${escapeHtml(group.nombre)}</small>
            ${group.options.filter(o => o.activo).map(opt => `
                <label>
                    <input type="radio"
                        name="group-${group.id}-${rowIndex}"
                        value="${opt.option_id}"
                        ${selectedId === opt.option_id ? 'checked' : ''}/>
                    ${escapeHtml(opt.nombre)}
                </label>
            `).join('')}
        </div>
    `;
}

function renderGroupSelectTable(group, selectedVariant, rowIndex) {
    const selectedIds = selectedVariant?.option_ids || [];

    const selectsHTML = Array.from({ length: group.min }, (_, i) => {
        const selectedId = selectedIds[i]; // 🔥 clave: uno por select

        const optionsHTML = group.options
            .filter(opt => opt.activo)
            .map(opt => `
                <option 
                    value="${opt.option_id}" 
                    ${selectedId === opt.option_id ? 'selected' : ''}
                >
                    ${escapeHtml(opt.nombre)}
                </option>
            `).join('');

        return `
            <select 
                data-group-id="${group.id}" 
                data-index="${i}"
            >
                <option value="">Selecciona</option>
                ${optionsHTML}
            </select>
        `;
    }).join('');

    return `
        <div class="variant-group">
            <small>${escapeHtml(group.nombre)}</small>
            ${selectsHTML}
        </div>
    `;
}

function createTableRow(item, index) {
    const row = document.createElement('tr');
    row.dataset.index = index;

    const itemPrice = calculateItemPrice(item);
    const subtotal = item.cantidad * itemPrice;

    // Verificar si hay variantes con precio_extra
    const productoConfig = PRODUCTOS_CONFIG[item.producto_id];
    const hasVariantsWithExtra = productoConfig?.groups?.some(group => 
        group.options?.some(option => option.precio_extra && option.precio_extra > 0)
    ) || false;

    // 🔹 Select de productos (ID correcto)
    const productOptions = Object.values(PRODUCTOS_CONFIG).map(p => `
        <option value="${p.id}" ${item.producto_id === p.id ? 'selected' : ''}>
            ${escapeHtml(p.nombre)}
        </option>
    `).join('');

    row.innerHTML = `
        <td>
            <input type="number" class="editable cantidad-input"
                value="${item.cantidad}" min="1" step="1"/>
        </td>

        <td>
            <select class="editable producto-select">
                ${productOptions}
            </select>

            <div class="variants-container">
                <!-- Variantes se renderizan aquí dinámicamente -->
            </div>
        </td>

        <td>
            <input type="number" class="editable precio-input"
                value="${hasVariantsWithExtra ? itemPrice : item.precio}" min="0" step="100" ${hasVariantsWithExtra ? 'readonly' : ''}/>
        </td>

        <td>
            <strong>${formatCurrency(subtotal)}</strong>
        </td>

        <td>
            <button class="btn btn-danger remove-btn" style="padding: 6px; font-size: 12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" style="pointer-events: none;"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16m-4 0-.27-.812c-.263-.787-.394-1.18-.637-1.471a2 2 0 0 0-.803-.578C13.939 3 13.524 3 12.695 3h-1.388c-.829 0-1.244 0-1.596.139a2 2 0 0 0-.803.578c-.243.29-.374.684-.636 1.471L8 6m10 0v10.2c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C15.72 21 14.88 21 13.2 21h-2.4c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C6 18.72 6 17.88 6 16.2V6m8 4v7m-4-7v7"/></svg>
            </button>
        </td>
    `;

    return row;
}

/* Renderiza variantes dinámicamente en una fila */
function renderVariants(row, item, rowIndex) {
    const container = row.querySelector('.variants-container');
    const productoConfig = PRODUCTOS_CONFIG[item.producto_id];

    let variantsHTML = '';

    if (productoConfig?.groups?.length) {
        variantsHTML = productoConfig.groups.map(group => {
            const selectedVariant = item.variants?.find(v => v.group_id === group.id);

            if (group.tipo === 'select') {
                return renderGroupSelectTable(group, selectedVariant, rowIndex);
            }

            if (group.tipo === 'single') {
                return renderGroupSingleTable(group, selectedVariant, rowIndex);
            }

            if (group.tipo === 'checkbox') {
                return renderGroupCheckboxTable(group, selectedVariant, rowIndex);
            }

            return '';
        }).join('');
    }

    container.innerHTML = variantsHTML;
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
        const row = createTableRow(item, index);
        renderVariants(row, item, index);
        tbody.appendChild(row);
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

    if (field === 'producto_id') {
        item.variants = []; // Reset variants
        item.nombre = PRODUCTOS_CONFIG[value]?.nombre || '';
        item.precio = PRODUCTOS_CONFIG[value]?.precio || 0; // Reset to base price
    }

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
        renderVariants(newRow, item, index);
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
export function addProduct() {
    // Selecciona el primer producto disponible como default
    const firstProductId = Object.keys(PRODUCTOS_CONFIG)[0];
    const newItem = {
        producto_id: firstProductId,
        nombre: PRODUCTOS_CONFIG[firstProductId]?.nombre || '',
        cantidad: 1,
        precio: PRODUCTOS_CONFIG[firstProductId]?.precio || 0,
        variants: []
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
            updateItem(index, 'producto_id', e.target.value);
        } else if (e.target.classList.contains('cantidad-input')) {
            updateItem(index, 'cantidad', parseFloat(e.target.value));
        } else if (e.target.classList.contains('precio-input') && !e.target.readOnly) {
            updateItem(index, 'precio', parseFloat(e.target.value));
        } else if (e.target.matches('select[data-group-id]')) {
            // Handle select change
            const groupId = e.target.dataset.groupId;
            const idx = parseInt(e.target.dataset.index);
            const optionId = e.target.value;
            const item = currentOrder.items[index];
            let variant = item.variants.find(v => v.group_id === groupId);
            if (!variant) {
                variant = { group_id: groupId, option_ids: [] };
                item.variants.push(variant);
            }
            variant.option_ids[idx] = optionId;
            variant.option_ids = variant.option_ids.filter(id => id);
            if (variant.option_ids.length === 0) {
                item.variants = item.variants.filter(v => v.group_id !== groupId);
            }
            // Re-render row to update price
            const row = document.querySelector(`tr[data-index="${index}"]`);
            if (row) {
                const newRow = createTableRow(item, index);
                renderVariants(newRow, item, index);
                row.replaceWith(newRow);
            }
            calculateTotals();
            saveToLocalStorage();
        } else if (e.target.type === 'radio' && e.target.name.startsWith('group-')) {
            // Handle radio change
            const nameParts = e.target.name.split('-');
            const groupId = nameParts[1]; // group-${group.id}-${rowIndex}
            const optionId = e.target.value;
            const item = currentOrder.items[index];
            let variant = item.variants.find(v => v.group_id === groupId);
            if (!variant) {
                variant = { group_id: groupId, option_ids: [] };
                item.variants.push(variant);
            }
            variant.option_ids = [optionId];
            // Re-render row to update price
            const row = document.querySelector(`tr[data-index="${index}"]`);
            if (row) {
                const newRow = createTableRow(item, index);
                renderVariants(newRow, item, index);
                row.replaceWith(newRow);
            }
            calculateTotals();
            saveToLocalStorage();
        } else if (e.target.type === 'checkbox') {
            // Handle checkbox change
            const groupId = e.target.closest('[data-group-id]').dataset.groupId;
            const optionId = e.target.value;
            const item = currentOrder.items[index];
            let variant = item.variants.find(v => v.group_id === groupId);
            if (!variant) {
                variant = { group_id: groupId, option_ids: [] };
                item.variants.push(variant);
            }
            if (e.target.checked) {
                if (!variant.option_ids.includes(optionId)) {
                    variant.option_ids.push(optionId);
                }
            } else {
                variant.option_ids = variant.option_ids.filter(id => id !== optionId);
            }
            if (variant.option_ids.length === 0) {
                item.variants = item.variants.filter(v => v.group_id !== groupId);
            }
            // Re-render row to update price
            const row = document.querySelector(`tr[data-index="${index}"]`);
            if (row) {
                const newRow = createTableRow(item, index);
                renderVariants(newRow, item, index);
                row.replaceWith(newRow);
            }
            calculateTotals();
            saveToLocalStorage();
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
    // Recalcular totales al cambiar tipo de entrega o valor de envío
    document.getElementById('clientDeliveryType').addEventListener('change', function() {
        calculateTotals();
    });
    document.getElementById('envio').addEventListener('change', function() {
        calculateTotals();
    });
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