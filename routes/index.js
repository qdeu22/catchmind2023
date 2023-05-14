const express = require("express");
const path = require("path");
const router = express.Router();

const { rooms } = require("../rooms");

const wordModule = require("../lib/file");
let randomWord;

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

router.get("/rooms", (req, res) => {
  res.json(rooms);
});

router.get("/getRandomWord", (req, res) => {
  // getRandomWord 함수를 호출하여 무작위 단어를 얻습니다.
  randomWord = wordModule.getRandomWord().trim();
  const data = { message: randomWord };
  res.json(data);
});

router.get("/getReader", (req, res) => {
  const id = req.query.id;
  const targetRoom = rooms.find((room) => {
    return room.id === parseInt(id);
  });
  const [reader, readerId] = targetRoom.users.entries().next().value;
  const data = { reader, readerId };
  console.log(
    `${id}방의 방장은 ${reader}님 입니다. 그리고 소켓 ID는 ${readerId}입니다.`
  );
  res.json(data);
});

router.post("/checkChat", (req, res) => {
  let clientVal = req.body.message;
  let serverVal = randomWord;

  if (clientVal === serverVal) {
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

module.exports = router;
