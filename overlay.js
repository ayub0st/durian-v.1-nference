const overlayCanvas = document.getElementById("overlay");
const previewImage = document.querySelector("#preview img");

const resizeCanvas = () => {
  if (previewImage.naturalWidth && previewImage.naturalHeight) {
    overlayCanvas.width = previewImage.naturalWidth;
    overlayCanvas.height = previewImage.naturalHeight;
  }
};

previewImage.onload = () => resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawPredictions(predictions) {
  const ctx = overlayCanvas.getContext("2d");
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (!predictions?.length) return;

  ctx.font = "16px Arial";
  ctx.textBaseline = "top";

  predictions.forEach((p) => {
    if (!p.box_2d) return;
    const { x1, y1, x2, y2 } = p.box_2d;
    const width = x2 - x1;
    const height = y2 - y1;
    const label = p.label || "Unknown";
    const confidence = (p.confidence ?? p.score ?? 1) * 100;

    ctx.strokeStyle = "#FF4500";
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, y1, width, height);

    const text = `${label} (${confidence.toFixed(1)}%)`;
    const padding = 4;
    const textWidth = ctx.measureText(text).width;
    const textHeight = 16;

    ctx.fillStyle = "#FF4500";
    ctx.fillRect(
      x1,
      y1 - textHeight - padding * 2,
      textWidth + padding * 2,
      textHeight + padding * 2
    );

    ctx.fillStyle = "#fff";
    ctx.fillText(text, x1 + padding, y1 - textHeight - padding);
  });
}

window.drawPredictions = drawPredictions;
