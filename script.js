const canvas = document.getElementById("firma");
const ctx = canvas.getContext("2d");
let dibujando = false;

canvas.addEventListener("mousedown", () => dibujando = true);
canvas.addEventListener("mouseup", () => dibujando = false);
canvas.addEventListener("mouseout", () => dibujando = false);
canvas.addEventListener("mousemove", dibujar);

function dibujar(e) {
  if (!dibujando) return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function limpiarFirma() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

document.getElementById("bitacoraForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const data = new FormData(this);
  const firma = canvas.toDataURL("image/png");

  const payload = {
    fecha: data.get("fecha"),
    hora1: data.get("hora1"),
    hora2: data.get("hora2"),
    piloto: data.get("piloto"),
    modelo: data.get("modelo"),
    origen: data.get("origen"),
    destino: data.get("destino"),
    duracion: data.get("duracion"),
    maniobras: data.get("maniobras"),
    firma: firma
  };

  const URL = "https://script.google.com/macros/s/AKfycbzR31gOQf9rhlmGPXW6lcTKe0iKAmqiJ_Mr3Uw67fbl3mlVo6eW8Jt_QIdHfj9SbiigUA/exec";

  try {
    const res = await fetch(URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const json = await res.json();
    if (json.success) {
      alert("Bitácora enviada con éxito.");
      this.reset();
      limpiarFirma();
    } else {
      alert("Error del servidor: " + json.error);
    }
  } catch (err) {
    alert("Error al enviar: " + err.message);
  }
});

