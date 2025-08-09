// --- LÓGICA DEL CANVAS PARA LA FIRMA (COMPATIBLE CON MOUSE Y TÁCTIL) ---
const canvas = document.getElementById("firma");
const ctx = canvas.getContext("2d");
let isDrawing = false;

// Función para limpiar la firma
function limpiarFirma() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath(); // Reinicia el trazo para que no continúe un dibujo anterior
}

// Función para obtener las coordenadas correctas (funciona para mouse y touch)
function getCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  // Si es un evento táctil, usa el primer punto de contacto
  if (event.touches && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top
    };
  }
  // Si no, es un evento de mouse
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}
// --- AUTOCOMPLETE DE AEROPUERTOS ---
const API_URL = "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json"; 
let aeropuertos = {};

async function cargarAeropuertos() {
  try {
    const res = await fetch(API_URL);
    aeropuertos = await res.json();
    console.log("Aeropuertos cargados:", Object.keys(aeropuertos).length);
  } catch (err) {
    console.error("Error cargando aeropuertos:", err);
  }
}

function filtrarAeropuertos(texto) {
  const busqueda = texto.toLowerCase();
  return Object.entries(aeropuertos)
    .filter(([icao, datos]) => {
      return (
        icao.toLowerCase().includes(busqueda) ||
        (datos.iata && datos.iata.toLowerCase().includes(busqueda)) ||
        (datos.name && datos.name.toLowerCase().includes(busqueda)) ||
        (datos.city && datos.city.toLowerCase().includes(busqueda))
      );
    })
    .slice(0, 10);
}

function crearSugerencias(input, lista) {
  let dropdown = document.createElement("div");
  dropdown.classList.add("autocomplete-items");

  lista.forEach(([icao, datos]) => {
    let item = document.createElement("div");
    item.innerHTML = `<strong>${icao}</strong> - ${datos.name || "Sin nombre"} (${datos.city || "Ciudad desconocida"})`;
    item.addEventListener("click", () => {
      input.value = icao;
      cerrarSugerencias();
    });
    dropdown.appendChild(item);
  });

  cerrarSugerencias();
  input.parentNode.appendChild(dropdown);
}

function cerrarSugerencias() {
  document.querySelectorAll(".autocomplete-items").forEach(el => el.remove());
}

function activarAutocomplete(idCampo) {
  const input = document.getElementById(idCampo);

  input.addEventListener("input", () => {
    const texto = input.value.trim();
    if (!texto) {
      cerrarSugerencias();
      return;
    }
    const resultados = filtrarAeropuertos(texto);
    crearSugerencias(input, resultados);
  });

  document.addEventListener("click", cerrarSugerencias);
}

// Inicializar búsqueda
cargarAeropuertos().then(() => {
  activarAutocomplete("origen");
  activarAutocomplete("destino");
});

// Función que se activa al empezar a dibujar
function startDrawing(event) {
  isDrawing = true;
  const { x, y } = getCoordinates(event);
  ctx.moveTo(x, y);
}

// Función que dibuja mientras se mueve el puntero/dedo
function draw(event) {
  if (!isDrawing) return;
  // Previene el scroll de la página en móviles al dibujar
  event.preventDefault(); 
  const { x, y } = getCoordinates(event);
  ctx.lineTo(x, y);
  ctx.stroke();
}

// Función que se activa al dejar de dibujar
function stopDrawing() {
  isDrawing = false;
  ctx.beginPath(); // Levanta el "lápiz" para el próximo trazo
}

// Asignar los eventos de Mouse
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing); // Si el mouse se sale del canvas

// Asignar los eventos Táctiles
canvas.addEventListener("touchstart", startDrawing);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", stopDrawing);


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

  // Verificar si el canvas está vacío (comparando con un canvas en blanco)
  const blankCanvas = document.createElement("canvas");
  blankCanvas.width = canvas.width;
  blankCanvas.height = canvas.height;
  if (canvas.toDataURL() === blankCanvas.toDataURL()) {
      alert("Por favor, añada su firma antes de enviar.");
      return; // Detiene el envío del formulario
  }

  submitBtn.disabled = true;
  respuestaDiv.innerText = "Procesando y enviando datos...";

  try {
    const formData = new FormData(this);
    const plainFormData = Object.fromEntries(formData.entries());
    plainFormData.firmaImagen = canvas.toDataURL("image/png");

    const imagenInput = document.getElementById("imagen");
    if (imagenInput.files.length > 0) {
      plainFormData.imagenBase64 = await fileToBase64(imagenInput.files[0]);
    } else {
      plainFormData.imagenBase64 = null;
    }
    
    delete plainFormData.imagen;

    const response = await fetch("https://script.google.com/macros/s/AKfycbxEWvo4A9_nCGx2KI8skPsL05VzM4dTD7-S7NYwlJ1aTWDWPEMMH-BdTascqnuJUGAoSA/exec", {
      method: "POST",
      redirect: "follow", 
      body: JSON.stringify(plainFormData),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    const result = await response.json();

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
    submitBtn.disabled = false;
  }
});

// --- LÓGICA DE CALCULAR HORA 9-28-2025 ---
document.addEventListener("DOMContentLoaded", () => {
  const horaSalida = document.getElementById("horaSalida");
  const horaLlegada = document.getElementById("horaLlegada");
  const duracion = document.getElementById("duracion");

  function calcularDuracion() {
    if (horaSalida.value && horaLlegada.value) {
      const salida = new Date(`1970-01-01T${horaSalida.value}:00`);
      const llegada = new Date(`1970-01-01T${horaLlegada.value}:00`);

      let diferencia = (llegada - salida) / 1000 / 60; // minutos

      // Si la llegada es al día siguiente
      if (diferencia < 0) {
        diferencia += 24 * 60;
      }

      const horas = String(Math.floor(diferencia / 60)).padStart(2, '0');
      const minutos = String(diferencia % 60).padStart(2, '0');
      duracion.value = `${horas}:${minutos}`;

    }
  }

  horaSalida.addEventListener("input", calcularDuracion);
  horaLlegada.addEventListener("input", calcularDuracion);
});

