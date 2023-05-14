let { timerInfo } = require("../../rooms");
module.exports = function (io) {
  const timerIO = io.of("/timer");

  timerIO.on("connection", function (socket) {
    let roomID;

    socket.on("joinRoom", (roomId) => {
      roomID = roomId;
      socket.join(roomId);
      // console.log(`${roomId}방에 타이머 소켓 연결`);
    });

    socket.on("start", function () {
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      // 게임 대기 중 다시 눌렀을 경우
      if (myTimer) {
        timerInfo = timerInfo.filter((info) => info.id !== roomID);
        clearInterval(myTimer.countInterval);
        timerIO.to(roomID).emit("waitstop");
        return;
      }

      const timer = {
        id: roomID,
        elapsedTime: 0,
        remainingTime: 60,
        elapsedTimeInterval: null,
        remainingTimeInterval: null,
        countInterval: null,
      };
      timerInfo.push(timer);

      console.log("저장된 모든 방의 타이머 =>", timerInfo);

      myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      let count = 5;

      timerIO.to(roomID).emit("count", count);

      myTimer.countInterval = setInterval(function () {
        count--;

        timerIO.to(roomID).emit("count", count);

        if (count === 0) {
          clearInterval(myTimer.countInterval);
          timerIO.to(roomID).emit("start");
        }
      }, 1000);
    });

    socket.on("elapsedTime", function () {
      // 경과시간
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      myTimer.elapsedTime = 0;

      myTimer.elapsedTimeInterval = setInterval(function () {
        myTimer.elapsedTime++;

        // console.log(`방${roomID}의 경과시간 =>`, timerInfo);

        timerIO.to(roomID).emit("elapsedTime", {
          elapsedTime: myTimer.elapsedTime,
        });
      }, 1000);
    });

    socket.on("remainingTime", function () {
      // 남은 시간
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      myTimer.remainingTime = 60;

      myTimer.remainingTimeInterval = setInterval(function () {
        myTimer.remainingTime--;

        timerIO.to(roomID).emit("remainingTime", {
          remainingTime: myTimer.remainingTime,
        });

        if (myTimer.remainingTime === 0) {
          clearInterval(myTimer.remainingTimeInterval);
        }
      }, 1000);
    });

    socket.on("stop", function () {
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      clearInterval(myTimer.elapsedTimeInterval);
      clearInterval(myTimer.remainingTimeInterval);

      // 배열에 타이머 삭제
      timerInfo = timerInfo.filter((info) => info.id !== roomID);

      console.log("게임정지에 대한 타이머 삭제후 모든 방 정보 =>", timerInfo);
    });

    socket.on("disconnect", () => {
      //console.log("타이머 소켓에 접근해지");
    });
  });
  return timerIO;
};
