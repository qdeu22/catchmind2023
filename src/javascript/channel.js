const socket = io();

// 채널 1 요청
socket.emit("request_channel1");

// 채널 1 혼잡도 정보 수신
socket.on("channel1_congestion", (congestion) => {
  const channel1Elem = document.getElementById("channel1");
  channel1Elem.innerHTML = `채널 1 혼잡도: ${congestion}`;
});

// 채널 2 요청
socket.emit("request_channel2");

// 채널 2 혼잡도 정보 수신
socket.on("channel2_congestion", (congestion) => {
  const channel2Elem = document.getElementById("channel2");
  channel2Elem.innerHTML = `채널 2 혼잡도: ${congestion}`;
});
