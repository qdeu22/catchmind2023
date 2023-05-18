// data.js
class Rooms {
  constructor() {
    this.Rooms = [];
  }
  addItem(item) {
    this.Rooms.push(item);
  }
  filter(roomId) {
    this.Rooms = this.Rooms.filter((room) => room.id !== parseInt(roomId));
  }
  find(roomId) {
    return this.Rooms.find((room) => {
      return room.id === parseInt(roomId);
    });
  }
  findByName(name) {
    return this.Rooms.find((room) => {
      return room.name === name;
    });
  }
  getRooms() {
    return this.Rooms;
  }
}
module.exports = new Rooms();
