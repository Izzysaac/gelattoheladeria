import { debugLog } from "./debug.js";

let modalStack = [];

export const openModal = (name, dialog) => {
    dialog.name = name;
    dialog.showModal();
    modalStack.push(dialog);
    history.pushState({ modal: name }, "");
    console.log("OPEN", history.state);
    debugLog("OPEN", history.state);
};

export const manualClose = () => {
    if (modalStack.length) history.back();
    console.log("manualClose", history.state);
    debugLog("manualClose", history.state);
};

export const resetModals = () => {

};

const syncModalsWithState = (activeModalName) => {
    while (
        modalStack.length &&
        modalStack[modalStack.length - 1].name !== activeModalName
    ) {
        const modal = modalStack.pop();
        modal.close();
    }
};

window.addEventListener("popstate", (event) => {
    console.log("POPSTATE", event.state);
    debugLog("POPSTATE", event.state);
    const activeModalName = event.state?.modal || null;

    // Si no hay estado en el modal, cerrar todos los modales
    if (!activeModalName) {
        while (modalStack.length) {
            const modal = modalStack.pop();
            if (modal.open) modal.close();
        }
        document.body.classList.remove("no-scroll");
        debugLog("NO MODAL - CERRANDO TODOS");
        return;
    }
    // Si sí hay modal -> sincronizar stack en el stado
    syncModalsWithState(activeModalName);
    debugLog("MODAL ACTIVO", activeModalName);
});


// window.addEventListener("popstate", () => {
//     alert(modalStack);
//     const lastModal = modalStack.pop();
//     if (lastModal) {
//         lastModal.close();
//         alert("cerrando popstate");
//     }
//     if (lastModal?.id == "modal-pedido")
//         document.body.classList.remove("no-scroll");
//     console.log("POPSTATE", history.state);
// });
