const chatSocket = io("/chat");

const form = document.querySelector("form");
const input = document.querySelector('input[type="text"]');
const ul = document.querySelector("ul");

function scrollToBottom() {
  ul.scrollTop = ul.scrollHeight;
}

const url = "/chat"; // 요청할 URL

form.addEventListener("submit", (event) => {
  event.preventDefault(); // 폼 기본 동작 방지

  fetch(url)
    .then((response) => response.json()) // JSON 형태로 파싱
    .then((data) => {
      const name = data.key;
      const message = input.value.trim(); // 입력된 메시지 가져오기
      if (message) {
        const li = document.createElement("li"); // 새로운 리스트 아이템 생성
        li.textContent = `${name}: ${message}`; // 리스트 아이템에 메시지 추가
        li.classList.add("message"); // message 클래스 추가
        ul.appendChild(li); // 리스트에 아이템 추가
        input.value = "";
        chatSocket.emit("message", { name, message });
        scrollToBottom(); // 스크롤을 최하단으로 내림
      }
    }) // 서버로부터 받은 데이터 처리
    .catch((error) => console.error("Error:", error));
});

chatSocket.on("message", onChat);

function onChat(data) {
  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = `${data.name}: ${data.message}`; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가
}
