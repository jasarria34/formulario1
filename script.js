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

// --- BASE64 ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// --- API AUTOCOMPLETADO ---
async function buscarAeropuertos(query, listaElement) {
  if (query.length < 2) {
    listaElement.innerHTML = "";
    return;
  }
  const res = await fetch(`https://raw.githubusercontent.com/mwgg/Airports/master/airports.json`);
  const data = await res.json();

  const resultados = Object.values(data)
    .filter(a => 
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.city?.toLowerCase().includes(query.toLowerCase()) ||
      a.iata?.toLowerCase() === query.toLowerCase() ||
      a.icao?.toLowerCase() === query.toLowerCase()
    )
    .slice(0, 10);

  listaElement.innerHTML = resultados.map(a => 
    `<li>${a.icao || ''} - ${a.name} (${a.city || ''})</li>`
  ).join("");

  listaElement.querySelectorAll("li").forEach(item => {
    item.addEventListener("click", () => {
      const input = listaElement.previousElementSibling;
      input.value = item.textContent;
      listaElement.innerHTML = "";
    });
  });
}

document.getElementById("origen").addEventListener("input", e => {
  buscarAeropuertos(e.target.value, document.getElementById("origenLista"));
});

document.getElementById("destino").addEventListener("input", e => {
  buscarAeropuertos(e.target.value, document.getElementById("destinoLista"));
});

// --- DURACIÓN ---
document.getElementById("horaSalida").addEventListener("input", calcularDuracion);
document.getElementById("horaLlegada").addEventListener("input", calcularDuracion);

function calcularDuracion() {
  const salida = document.getElementById("horaSalida").value;
  const llegada = document.getElementById("horaLlegada").value;
  if (!salida || !llegada) return;
  const [h1, m1] = salida.split(":").map(Number);
  const [h2, m2] = llegada.split(":").map(Number);

  let minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (minutos < 0) minutos += 24 * 60;

  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  document.getElementById("duracion").value = `${horas}h ${mins}m`;
}

// --- ENVÍO FORMULARIO ---
document.getElementById("bitacoraForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const submitBtn = document.getElementById("submitBtn");
  const respuestaDiv = document.getElementById("respuesta");

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

    const response = await fetch("https://script.google.com/macros/s/AKfycbxEWvo4A9_nCGx2KI8skPsL05VzM4dTD7-S7NYwlJ1aTWDWPEMMH-BdTascqnuJUGAoSA/exec", {
      method: "POST",
      redirect: "follow", 
      body: JSON.stringify(plainFormData),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });

    const result = await response.json();

    if (result.status === "success") {
      respuestaDiv.innerHTML = `<a href="${result.url}" target="_blank" id="pdfLink">📄 Ver PDF de la Bitácora</a>`;

      const pdfLink = document.getElementById("pdfLink");
      pdfLink.addEventListener("click", () => {
        setTimeout(() => { respuestaDiv.innerHTML = ""; }, 500);
      });

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



