const info = document.getElementById("informacion");
const infoBtn = document.getElementById("infoBtn");
const fixedInfoBtn = document.getElementById("fixedInfoBtn");
const fixedHeader = document.getElementById("fixedHeader");
const mainHeader = document.getElementById("mainHeader");
const statusLight = document.getElementById("statusLight");
const fixedStatusLight = document.getElementById("fixedStatusLight");
const closeInfoBtn = document.getElementById("closeInfoBtn");

// Info modal functionality Open / Close
const showModal = () => info.showModal();
infoBtn.addEventListener("click", showModal);
fixedInfoBtn.addEventListener("click", showModal);
info.addEventListener("click", (e) => {if (e.target  === info) info.close()});
closeInfoBtn.addEventListener("click", () => info.close());

//! Scroll functionality for fixed header Mirar Esto
let lastScrollY = 0;
let ticking = false;

const updateFixedHeader = () => {

    const scrollY = window.scrollY;
    const headerHeight = mainHeader.offsetHeight;

    // Show fixed header when scrolled past the main header
    if (scrollY > headerHeight - 60) {
        fixedHeader.classList.add("show");
    } else {
        fixedHeader.classList.remove("show");
    }

    // Sync status light classes
    if (statusLight && fixedStatusLight) {
        fixedStatusLight.className =
            statusLight.className
                .replace("h-4 w-4", "")
                .replace("absolute bottom-1 right-1", "")
                .trim() + " fixed-status-light";
    }

    lastScrollY = scrollY;
    ticking = false;
}
const requestTick = () => {
    if (!ticking) {
        requestAnimationFrame(updateFixedHeader);
        ticking = true;
    }
}
// Throttled scroll listener
window.addEventListener("scroll", requestTick, { passive: true });

// Initial check
updateFixedHeader();
