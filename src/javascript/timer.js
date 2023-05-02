let time = 0;
let timerInterval;

function startTimer() {
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  time++;
  const hours = Math.floor(time / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (time % 60).toString().padStart(2, "0");
  document.getElementById("timer").innerHTML = `${hours}:${minutes}:${seconds}`;
}

function stopTimer() {
  clearInterval(timerInterval);
  time = 0;
  document.getElementById("timer").innerHTML = "00:00:00";
}
