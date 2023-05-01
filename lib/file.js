const fs = require("fs"); // 파일 시스템 모듈을 불러옵니다.

// 파일 내용을 읽어와서 문자열로 저장합니다.
const fileContent = fs.readFileSync("lib/word.txt", "utf-8");

// 쉼표로 구분된 단어를 배열로 만듭니다.
const words = fileContent.split(",");

// 무작위 단어를 반환하는 함수
function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

// 모듈에서 외부로 공개할 함수를 정의합니다.
module.exports = {
  getRandomWord,
};
