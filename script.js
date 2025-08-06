
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", dibujar);

function dibujar(e) {
  if (!drawing) return;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function limpiarFirma() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

document.getElementById("formulario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const firma = canvas.toDataURL();
  formData.append("firma", firma);

  const jsonData = {};
  formData.forEach((value, key) => jsonData[key] = value);
  jsonData["firma"] = firma;

  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbxZ4S_KFmdF8swTlgyC73oUAI6JZVqK89M9FuZFqIOU7q6ysDxALXDxxL6tKByh4llfGQ/exec", {
      method: "POST",
      body: JSON.stringify(jsonData),
      headers: { "Content-Type": "application/json" }
    });

    const result = await response.json();
    if (result.success) {
      alert("Formulario enviado correctamente.");
      e.target.reset();
      limpiarFirma();
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    alert("Error de red al enviar el formulario.");
  }
});
