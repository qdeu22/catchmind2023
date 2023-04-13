const socket = io();
socket.on("visitorsUpdated", (visitors) => {
  console.log(1);
  document.getElementById(
    "visitors"
  ).textContent = `${visitors}명이 방문 중입니다.`;
});
