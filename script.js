
document.getElementById("bitacoraForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const canvas = document.getElementById("firma");
  const firmaBase64 = canvas.toDataURL("image/png");
  document.getElementById("firmaImagen").value = firmaBase64;

  const formData = new FormData(this);
  const plainFormData = Object.fromEntries(formData.entries());

  document.getElementById("respuesta").innerText = "Enviando...";

  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbxEWvo4A9_nCGx2KI8skPsL05VzM4dTD7-S7NYwlJ1aTWDWPEMMH-BdTascqnuJUGAoSA/exec", {
      method: "POST",
      body: JSON.stringify(plainFormData),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    if (result.status === "success") {
      document.getElementById("respuesta").innerText = "Formulario enviado con éxito.";
      this.reset();
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      document.getElementById("respuesta").innerText = "Error: " + result.message;
    }
  } catch (error) {
    document.getElementById("respuesta").innerText = "Error al enviar: " + error.message;
  }
});

function limpiarFirma() {
  const canvas = document.getElementById("firma");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const canvas = document.getElementById("firma");
const ctx = canvas.getContext("2d");
let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});


