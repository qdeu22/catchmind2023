const fs = require("fs"); // 파일 시스템 모듈을 불러옵니다.

class WordGenerator {
  constructor() {
    this.words = [];
    this.loadWords();
  }

  loadWords() {
    const fileContent = fs.readFileSync("lib/word.txt", "utf-8");
    this.words = fileContent.split(",");
  }

  getRandomWord() {
    return this.words[Math.floor(Math.random() * this.words.length)];
  }
}

module.exports = new WordGenerator();
