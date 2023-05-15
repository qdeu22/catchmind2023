const express = require("express");
const path = require("path");
const router = express.Router();

const rooms = require("../rooms");
const roomOfInfo = require("../roomOfInfo");

const wordGenerator = require("../lib/file");

const roomOfWord = new Map();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

router.get("/rooms", (req, res) => {
  res.json(rooms.getRooms());
});

router.get("/getRandomWord", (req, res) => {
  const id = req.query.id;

  roomOfWord.set(id, wordGenerator.getRandomWord().trim());

  console.log("roomOfWord", roomOfWord);

  const data = { message: roomOfWord.get(id) };
  res.json(data);
});

router.get("/getReader", (req, res) => {
  const id = req.query.id;
  const targetRoom = rooms.find(parseInt(id));
  const [reader] = targetRoom.users.entries().next().value;
  const data = { reader };
  console.log(`${id}번 방의 방장은 ${reader}님 입니다.`);
  res.json(data);
});

router.get("/getPlayer", (req, res) => {
  const id = req.query.id;
  const targetRoom = rooms.find(parseInt(id));

  let data = true;
  const number = targetRoom.users.size;
  if (number < 2) {
    data = false;
  }
  console.log(`${id}번 방의 인원은 ${number}명 입니다.`);
  res.json(data);
});

router.post("/checkChat", (req, res) => {
  let clientVal = req.body.message;

  let id = req.body.roomId;

  let serverVal = roomOfWord.get(id);

  if (clientVal === serverVal) {
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

router.post("/checkRoom", (req, res) => {
  const roomId = req.body.roomId;

  let myRoom = roomOfInfo.find(roomId); // 와 이거때문에 와 싱글톤으로 해결...

  let data = false;
  // 게임중이면
  if (myRoom) {
    data = true;
  }
  res.json(data);
});
module.exports = router;
