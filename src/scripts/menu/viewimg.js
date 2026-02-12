const imageViewer = document.getElementById("imageViewer");
const imageViewerImg = document.getElementById("imageViewerImg");
const imageViewerCloseBtn = document.getElementById("imageViewerCloseBtn");

// Null checks for critical elements
if (!imageViewer || !imageViewerImg || !imageViewerCloseBtn) {
    console.error('ImageViewer: Required DOM elements not found');
}

export const showImageViewer = (img) => {
    if (!img?.src) return;

    const smallSrc = img.src;
    const bigSrc = img.getAttribute("data-image") || smallSrc;
    
    // 1. Setup inicial del modal
    imageViewerImg.src = smallSrc;
    imageViewerImg.alt = img.alt || "";
    imageViewerImg.classList.add("blurred");
    imageViewer.showModal();
    
    // 2. Si no hay imagen grande diferente, terminamos temprano
    if (bigSrc === smallSrc) {
        imageViewerImg.classList.remove("blurred");
        return;
    }

    // 3. Crear instancia local para evitar conflictos globales
    const loader = new Image();
    
    loader.onload = () => {
        // Solo actualizamos si el usuario no ha cambiado de imagen o cerrado el modal
        if (imageViewer.open && imageViewerImg.src === smallSrc) {
            imageViewerImg.src = bigSrc;
            imageViewerImg.classList.remove("blurred");
        }
    };

    loader.onerror = () => {
        imageViewerImg.classList.remove("blurred");
        console.warn('Error cargando:', bigSrc);
    };

    loader.src = bigSrc;
};

imageViewerCloseBtn.addEventListener("click", () => imageViewer.close());
imageViewer.addEventListener("click", (e) => {
	if(e.target === imageViewer) imageViewer.close()
});

// Use event delegation for better performance
document.getElementById("menu").addEventListener("click", (e) => {
	const action = e.target.getAttribute("data-action");
	if (action === "view-image") showImageViewer(e.target);
});
