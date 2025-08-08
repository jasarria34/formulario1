    const canvas = document.getElementById('firma');
    const ctx = canvas.getContext('2d');
    let drawing = false;

    const resize = () => {
      const imageData = canvas.toDataURL();
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = imageData;
    };

    window.addEventListener('resize', resize);
    resize();

    canvas.addEventListener('mousedown', () => drawing = true);
    canvas.addEventListener('mouseup', () => drawing = false);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; });
    canvas.addEventListener('touchend', () => drawing = false);
    canvas.addEventListener('touchmove', draw);

    function draw(e) {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    function limpiarFirma() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
    }

    document.getElementById("flightForm").addEventListener("submit", function (e) {
      e.preventDefault();
      document.getElementById("firmaData").value = canvas.toDataURL();
      const formData = new FormData(this);
      fetch("https://script.google.com/macros/s/AKfycbyrrKCRr8oGc9L6_MCg3Qzg1_1fAzrHN-x5kxturN5i3lxquZwX7cKz6Rr_0Ef3O57FWg/exec", {
        method: "POST",
        body: formData,
      })
      .then(res => res.text())
      .then(alert)
      .catch(err => alert("Error: " + err));
    });
 

