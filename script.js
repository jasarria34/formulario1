// --- LÓGICA DEL CANVAS ---
const canvas = document.getElementById("firma");
const ctx = canvas.getContext("2d");
let isDrawing = false;

function limpiarFirma() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
}

function getCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  if (event.touches && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top
    };
  }
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function startDrawing(event) {
  isDrawing = true;
  const { x, y } = getCoordinates(event);
  ctx.moveTo(x, y);
}

function draw(event) {
  if (!isDrawing) return;
  event.preventDefault();
  const { x, y } = getCoordinates(event);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function stopDrawing() {
  isDrawing = false;
  ctx.beginPath();
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);

canvas.addEventListener("touchstart", startDrawing);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", stopDrawing);

// --- FUNCIÓN BASE64 ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// --- ENVÍO DE FORMULARIO ---
document.getElementById("bitacoraForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submitBtn");
  const respuestaDiv = document.getElementById("respuesta");

  // Validar que haya firma
  const blankCanvas = document.createElement("canvas");
  blankCanvas.width = canvas.width;
  blankCanvas.height = canvas.height;
  if (canvas.toDataURL() === blankCanvas.toDataURL()) {
    alert("Por favor, añada su firma antes de enviar.");
    return;
  }

  submitBtn.disabled = true;
  respuestaDiv.innerText = "Procesando y enviando datos...";

  try {
    const formData = new FormData(this);
    const plainFormData = Object.fromEntries(formData.entries());
    plainFormData.firmaImagen = canvas.toDataURL("image/png");

    const imagenInput = document.getElementById("imagen");
    plainFormData.imagenBase64 = imagenInput.files.length > 0 
      ? await fileToBase64(imagenInput.files[0]) 
      : null;

    delete plainFormData.imagen;

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxEWvo4A9_nCGx2KI8skPsL05VzM4dTD7-S7NYwlJ1aTWDWPEMMH-BdTascqnuJUGAoSA/exec",
      {
        method: "POST",
        redirect: "follow", 
        body: JSON.stringify(plainFormData),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      // Mostrar el enlace pero solo dejarlo abrir una vez
      respuestaDiv.innerHTML = `<a href="${result.url}" target="_blank" id="pdfLink">📄 Ver PDF de la Bitácora</a>`;
      
      const pdfLink = document.getElementById("pdfLink");
      pdfLink.addEventListener("click", () => {
        setTimeout(() => {
          respuestaDiv.innerHTML = ""; // Eliminar enlace
        }, 1000);
      });

      // Reset del formulario
      this.reset();
      limpiarFirma();
    } else {
      respuestaDiv.innerText = "Error desde el servidor: " + result.message;
    }

  } catch (error) {
    respuestaDiv.innerText = "Error crítico al enviar el formulario: " + error.message;
  } finally {
    submitBtn.disabled = false;
  }
});


