const canvasSocket = io("/canvas");

const canvas = document.getElementById("jsCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 500;

ctx.strokeStyle = "black";
ctx.lineWidth = 2.5;

let painting = false;

var drawingTool = false; // 접속자들의 그릴 권한 통제

function startPainting() {
  if (drawingTool) {
    return;
  }

  painting = true;
}

function stopPainting(event) {
  painting = false;
}

function onMouseMove(event) {
  if (drawingTool) {
    return;
  }

  const x = event.offsetX;
  const y = event.offsetY;

  if (!painting) {
    ctx.beginPath();
    ctx.moveTo(x, y);

    // 서버로 새로운 경로를 시작한다는 신호 전송
    canvasSocket.emit("draw", { x, y, start: true });
  } else {
    ctx.lineTo(x, y);
    ctx.stroke();

    // 서버로 그린 데이터 전송
    canvasSocket.emit("draw", { x, y, start: false });
  }
}

if (canvas) {
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", startPainting);
  canvas.addEventListener("mouseup", stopPainting);
  canvas.addEventListener("mouseleave", stopPainting);
}

canvasSocket.on("draw", onDraw);

function onDraw(data) {
  if (data.start) {
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
  } else {
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
  }
}

function onCanvasInit() {
  //캔버스 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function isPainterPaint() {
  drawingTool = true; // 접속자들의 그릴 권한 통제
}
