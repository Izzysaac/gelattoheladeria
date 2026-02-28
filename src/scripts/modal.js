import { debugLog } from "./debug.js";
import { dom } from "./order/dom.js";

let modalStack = [];

const body = document.body;

const syncModalsWithState = (activeModalName) => {
    while (
        modalStack.length &&
        modalStack[modalStack.length - 1].name !== activeModalName
    ) {
        const modal = modalStack.pop();
        modal.close();
    }
};

export const openModal = (name, dialog) => {
    dialog.name = name;
    dialog.showModal();
    // scrollLock.enable();
    modalStack.push(dialog);
    history.pushState({ modal: name }, "");
    // console.log("OPEN", history.state);
    debugLog("OPEN", history.state);
};

export const manualClose = () => {
    if (modalStack.length) history.back();
    // console.log("manualClose", history.state);
    debugLog("manualClose", history.state);
};

async function nextTickPopState() {
    return new Promise(resolve => {
        window.addEventListener('popstate', resolve, { once: true });
    });
}

export const resetModals = async () => {
    // console.log("Iniciando reset de modales...");

    // Mientras el estado actual diga que hay un modal...
    while (history.state?.modal) {

        if (history.state.modal === "pedido") {
            console.log("modal pedido, no cierro y salgo");
            dom.modalVerPedido.showModal();
            // scrollLock.enable();
            modalStack.push(dom.modalVerPedido);
            return;
        };

        console.log("Cerrando nivel de historial:", history.state.modal);
        
        history.back();
        
        // ESPERAMOS a que el navegador termine de navegar antes de seguir el bucle
        await nextTickPopState(); 
        
        console.log("Estado actual tras back:", history.state);
    }
    
    console.log("Historial limpio de modales.");
};

const modals = document.getElementsByTagName("dialog");

Array.from(modals).forEach((modal) => {
    modal.addEventListener("cancel", (e) => {
        e.preventDefault();
        console.log("CANCEL", e);
        debugLog("CANCEL", e);
        manualClose();
    });
});

window.addEventListener("popstate", (event) => {
    // console.log("POPSTATE", event.state);
    debugLog("POPSTATE", event.state);
    const activeModalName = event.state?.modal || null;

    // Si no hay estado en el modal, cerrar todos los modales
    if (!activeModalName) {
        while (modalStack.length) {
            const modal = modalStack.pop();
            if (modal.open) {
                modal.close();
                // scrollLock.disable();
            }
        }
        // document.body.classList.remove("no-scroll");
        // scrollLock.disable();
        debugLog("NO MODAL - CERRANDO TODOS");
        return;
    }
    // Si sí hay modal -> sincronizar stack en el stado
    syncModalsWithState(activeModalName);
    debugLog("MODAL ACTIVO", activeModalName);
});


// NO SCROLL EN IPHONE
// const scrollLock = {
//     savePosition: 0,
    
//     enable() {
//         // Guardamos la posición actual
//         this.savePosition = window.pageYOffset;
        
//         // Aplicamos el bloqueo
//         document.body.style.top = `-${this.savePosition}px`;
//         document.body.classList.add('is-locked');
//         console.log("IS-LOCKED");
//     },
    
//     disable() {
//         // Quitamos el bloqueo
//         document.body.classList.remove('is-locked');
//         document.body.style.top = '';
//         console.log("IS-UNLOCKED");
        
//         // Volvemos a la posición original
//         window.scrollTo(0, this.savePosition);
//     }
// };

const scrollLock = {
  enable() {
    // document.documentElement.style.overflow = "hidden";
    // document.body.style.overflow = "hidden";
  },

  disable() {
    // document.documentElement.style.overflow = "";
    // document.body.style.overflow = "";
  }
};
