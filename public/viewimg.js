const dialogImageViewer = document.getElementById("dialogImageViewer");
const dialogImageViewerImg = document.getElementById("imageViewerImg");
const dialogImageViwerCloseBtn = document.getElementById(
  "dialogImageViewerClose",
);

dialogImageViwerCloseBtn.addEventListener("click", () =>
  dialogImageViewer.close(),
);
dialogImageViewer.addEventListener("click", (e) => {
  if (e.target === dialogImageViewer) dialogImageViewer.close();
});

document.addEventListener("click", (e) => {
  if (!e.target) return;

  if (e.target.tagName == "IMG") {
    const imageUrl = e.target.dataset.full || e.target.src;
    dialogImageViewerImg.src = imageUrl;
    dialogImageViewerImg.alt = e.target.alt || "";
    dialogImageViewer.showModal();
  }
});
