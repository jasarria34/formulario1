// --- LÓGICA DEL CANVAS PARA LA FIRMA ---
const canvas = document.getElementById("firma");
const ctx = canvas.getContext("2d");
let isDrawing = false;

function limpiarFirma() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx.beginPath();
  const rect = canvas.getBoundingClientRect();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }
});

canvas.addEventListener("mouseup", () => isDrawing = false);
canvas.addEventListener("mouseout", () => isDrawing = false);


// --- FUNCIÓN PARA CONVERTIR ARCHIVO A BASE64 ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// --- LÓGICA DE ENVÍO DEL FORMULARIO ---
document.getElementById("bitacoraForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const respuestaDiv = document.getElementById("respuesta");

  submitBtn.disabled = true;
  respuestaDiv.innerText = "Procesando y enviando datos...";

  try {
    // 1. Obtener datos del formulario
    const formData = new FormData(this);
    const plainFormData = Object.fromEntries(formData.entries());

    // 2. Procesar la firma
    if (canvas.toDataURL() === document.createElement('canvas').toDataURL()) {
        alert("Por favor, añada su firma.");
        submitBtn.disabled = false;
        respuestaDiv.innerText = "";
        return;
    }
    plainFormData.firmaImagen = canvas.toDataURL("image/png");

    // 3. Procesar la imagen (si se seleccionó una)
    const imagenInput = document.getElementById("imagen");
    if (imagenInput.files.length > 0) {
      plainFormData.imagenBase64 = await fileToBase64(imagenInput.files[0]);
    } else {
      plainFormData.imagenBase64 = null; // Enviar null si no hay imagen
    }
    
    // Eliminar el campo de imagen original que no se puede serializar
    delete plainFormData.imagen;

    // 4. Enviar datos al script de Google
    const response = await fetch("https://script.google.com/macros/s/AKfycbxEWvo4A9_nCGx2KI8skPsL05VzM4dTD7-S7NYwlJ1aTWDWPEMMH-BdTascqnuJUGAoSA/exec", {
      method: "POST",
      // Redireccionamiento manual para manejar la respuesta del script
      redirect: "follow", 
      body: JSON.stringify(plainFormData),
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Usar text/plain es más robusto para doPost
      },
    });

    const result = await response.json();

    // 5. Mostrar resultado
    if (result.status === "success") {
      respuestaDiv.innerHTML = `Formulario enviado con éxito. <br> <a href="${result.url}" target="_blank">Ver PDF de la Bitácora</a>`;
      this.reset();
      limpiarFirma();
    } else {
      respuestaDiv.innerText = "Error desde el servidor: " + result.message;
    }

  } catch (error) {
    respuestaDiv.innerText = "Error crítico al enviar el formulario: " + error.message;
    console.error(error);
  } finally {
    submitBtn.disabled = false; // Reactivar el botón al finalizar
  }
});

