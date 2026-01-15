// Tamaño fijo para todos los lienzos (las dos entradas y el resultado)
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;

let image1Loaded = false;
let image2Loaded = false;
let widgetClicks = 0;
function onOpenCvReady() {
  loadCascadeFile()
    .then(() => setStatus("OpenCV listo. Cascade cargado."))
    .catch(() => setStatus("OpenCV listo, pero NO se pudo cargar el cascade."));
}

if (typeof cv !== "undefined") {
  cv["onRuntimeInitialized"] = onOpenCvReady;
}

function getSessionId() {
  const key = "sessionId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random();
    localStorage.setItem(key, id);
  }
  return id;
}

async function sendTelemetry(payload) {
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("Telemetry failed:", e);
  }
}

function updateTelemetryUI(extraText = "") {
  const el = document.getElementById("telemetryInfo");
  if (!el) return;
  el.textContent = `Clicks: ${widgetClicks}. ${extraText}`.trim();
}


window.addEventListener("DOMContentLoaded", () => {
  const canvasIds = ["canvasInput1", "canvasInput2", "canvasOutput"];
  canvasIds.forEach((id) => {
    const c = document.getElementById(id);
    c.width = CANVAS_WIDTH;
    c.height = CANVAS_HEIGHT;
    document.getElementById("btnFaceDetect").addEventListener("click", onFaceDetect);

  });

  function onFaceDetect() {
  if (!image1Loaded) {
    alert("Carga primero la Imagen 1.");
    return;
  }
  if (!faceClassifier) {
    alert("El clasificador aún no está listo. Espera un momento y prueba otra vez.");
    return;
  }

  const src = cv.imread("canvasInput1");
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

  const faces = new cv.RectVector();
  const msize = new cv.Size(0, 0);
  faceClassifier.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

  const facesCount = faces.size();

  // dibujar rectángulos (opcional, pero ayuda a evidenciar)
  for (let i = 0; i < facesCount; i++) {
    const r = faces.get(i);
    cv.rectangle(src, new cv.Point(r.x, r.y), new cv.Point(r.x + r.width, r.y + r.height), [255, 0, 0, 255], 2);
  }

  cv.imshow("canvasOutput", src);

  // Telemetría
  sendTelemetry({
    type: "faces",
    facesCount,
    sessionId: getSessionId(),
    ts: Date.now(),
  });

  updateTelemetryUI(`Caras detectadas (Imagen 1): ${facesCount}`);
  setStatus(`Detección completada. Caras: ${facesCount}`);

  // cleanup
  src.delete();
  gray.delete();
  faces.delete();
  msize.delete();
}


  const fileInput1 = document.getElementById("fileInput1");
  const fileInput2 = document.getElementById("fileInput2");

  fileInput1.addEventListener("change", (e) =>
    handleFileChange(e, "canvasInput1", 1)
  );
  fileInput2.addEventListener("change", (e) =>
    handleFileChange(e, "canvasInput2", 2)
  );

  // Botones de operaciones
  document.getElementById("btnAdd").addEventListener("click", async () => {
    widgetClicks++;
    updateTelemetryUI();
    await sendTelemetry({
      type: "widget",
      widget: "btnAdd",
      action: "click",
      sessionId: getSessionId(),
      ts: Date.now(),
    });
    onAdd();
  });
  document.getElementById("btnSub").addEventListener("click", async () => {
    widgetClicks++;
    updateTelemetryUI();
    await sendTelemetry({
      type: "widget",
      widget: "btnSub",
      action: "click",
      sessionId: getSessionId(),
      ts: Date.now(),
    });
    onSub();
  });
  document.getElementById("btnAnd").addEventListener("click", async () => {
    widgetClicks++;
    updateTelemetryUI();
    await sendTelemetry({
      type: "widget",
      widget: "btnAnd",
      action: "click",
      sessionId: getSessionId(),
      ts: Date.now(),
    });
    onAnd();
  });
  document.getElementById("btnOr").addEventListener("click", async () => {
    widgetClicks++;
    updateTelemetryUI();
    await sendTelemetry({
      type: "widget",
      widget: "btnOr",
      action: "click",
      sessionId: getSessionId(),
      ts: Date.now(),
    });
    onOr();
  });
  document.getElementById("btnXor").addEventListener("click", async () => {
    widgetClicks++;
    updateTelemetryUI();
    await sendTelemetry({
      type: "widget",
      widget: "btnXor",
      action: "click",
      sessionId: getSessionId(),
      ts: Date.now(),
    });
    onXor();
  });
  document.getElementById("btnBlend").addEventListener("click", async () => {
    widgetClicks++;
    updateTelemetryUI();
    await sendTelemetry({
      type: "widget",
      widget: "btnBlend",
      action: "click",
      sessionId: getSessionId(),
      ts: Date.now(),
    });
    onBlend();
  });


  // Slider de alpha
  const alphaSlider = document.getElementById("alphaSlider");
  const alphaValue = document.getElementById("alphaValue");
  alphaSlider.addEventListener("input", () => {
    alphaValue.textContent = Number(alphaSlider.value).toFixed(2);
  });

  setStatus(
    "Carga dos imágenes (idealmente del mismo tamaño similar) y luego aplica una operación."
  );
});

function setStatus(text) {
  document.getElementById("status").textContent = text;
}

function handleFileChange(event, canvasId, index) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const img = new Image();

  reader.onload = (e) => {
    img.onload = () => {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");

      // Escalado manteniendo proporción, centrado en el canvas
      const scale = Math.min(
        CANVAS_WIDTH / img.width,
        CANVAS_HEIGHT / img.height
      );
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = (CANVAS_WIDTH - drawWidth) / 2;
      const offsetY = (CANVAS_HEIGHT - drawHeight) / 2;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      if (index === 1) {
        image1Loaded = true;
      } else if (index === 2) {
        image2Loaded = true;
      }

      setStatus(
        "Imágenes cargadas correctamente. Ahora puedes aplicar una operación."
      );
    };
    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

function ensureImagesLoaded() {
  if (!image1Loaded || !image2Loaded) {
    alert("Por favor, carga las dos imágenes antes de aplicar la operación.");
    return false;
  }
  return true;
}

// Utilidad para leer las dos imágenes como cv.Mat y devolverlas
function getInputMats() {
  const src1 = cv.imread("canvasInput1");
  const src2 = cv.imread("canvasInput2");
  return { src1, src2 };
}

// Mostrar y limpiar memoria
function showResult(dst) {
  cv.imshow("canvasOutput", dst);
  dst.delete();
}

// ===== Operaciones =====

function onAdd() {
  if (!ensureImagesLoaded()) return;

  const { src1, src2 } = getInputMats();
  const dst = new cv.Mat();

  cv.add(src1, src2, dst); // suma elemento a elemento
  showResult(dst);

  src1.delete();
  src2.delete();
  setStatus("Operación: Suma de imágenes (cv.add).");
}

function onSub() {
  if (!ensureImagesLoaded()) return;

  const { src1, src2 } = getInputMats();
  const dst = new cv.Mat();

  // img1 - img2
  cv.subtract(src1, src2, dst);
  showResult(dst);

  src1.delete();
  src2.delete();
  setStatus("Operación: Resta de imágenes (cv.subtract).");
}

function onAnd() {
  if (!ensureImagesLoaded()) return;

  const { src1, src2 } = getInputMats();
  const dst = new cv.Mat();

  cv.bitwise_and(src1, src2, dst);
  showResult(dst);

  src1.delete();
  src2.delete();
  setStatus("Operación: AND bit a bit (cv.bitwise_and).");
}

function onOr() {
  if (!ensureImagesLoaded()) return;

  const { src1, src2 } = getInputMats();
  const dst = new cv.Mat();

  cv.bitwise_or(src1, src2, dst);
  showResult(dst);

  src1.delete();
  src2.delete();
  setStatus("Operación: OR bit a bit (cv.bitwise_or).");
}

function onXor() {
  if (!ensureImagesLoaded()) return;

  const { src1, src2 } = getInputMats();
  const dst = new cv.Mat();

  cv.bitwise_xor(src1, src2, dst);
  showResult(dst);

  src1.delete();
  src2.delete();
  setStatus("Operación: XOR bit a bit (cv.bitwise_xor).");
}

function onBlend() {
  if (!ensureImagesLoaded()) return;

  const alpha = parseFloat(document.getElementById("alphaSlider").value);
  const beta = 1.0 - alpha;
  const gamma = 0.0;

  const { src1, src2 } = getInputMats();
  const dst = new cv.Mat();

  // dst = src1 * alpha + src2 * beta + gamma
  cv.addWeighted(src1, alpha, src2, beta, gamma, dst);
  showResult(dst);

  src1.delete();
  src2.delete();
  setStatus(
    `Operación: Blend (cv.addWeighted) con α=${alpha.toFixed(
      2
    )} y β=${beta.toFixed(2)}.`
  );
}

async function loadCascadeFile() {
  const url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml";
  const response = await fetch(url);
  const data = new Uint8Array(await response.arrayBuffer());

  cv.FS_createDataFile("/", "haarcascade_frontalface_default.xml", data, true, false, false);

  faceClassifier = new cv.CascadeClassifier();
  faceClassifier.load("haarcascade_frontalface_default.xml");
}

(async () => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("prof") === "1") {
    try {
      await fetch("/api/prof-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ts: Date.now(),
          sessionId: getSessionId(),
          userAgent: navigator.userAgent,
          path: window.location.pathname + window.location.search,
        }),
      });
      setStatus("Acceso del profesor registrado.");
    } catch (e) {
      console.warn("No se pudo registrar acceso profesor:", e);
    }
  }
})();