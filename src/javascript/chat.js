const form = document.querySelector("form");
const input = document.querySelector('input[type="text"]');
const ul = document.querySelector("ul");

function scrollToBottom() {
  ul.scrollTop = ul.scrollHeight;
}

form.addEventListener("submit", (event) => {
  event.preventDefault(); // 폼 기본 동작 방지

  const message = input.value.trim(); // 입력된 메시지 가져오기
  if (message) {
    const li = document.createElement("li"); // 새로운 리스트 아이템 생성
    li.textContent = message; // 리스트 아이템에 메시지 추가
    li.classList.add("message"); // message 클래스 추가
    ul.appendChild(li); // 리스트에 아이템 추가
    input.value = "";
    scrollToBottom(); // 스크롤을 최하단으로 내림
  }
});
