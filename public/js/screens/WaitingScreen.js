export class WaitingScreen {
  constructor(socket) {
    this.socket = socket;
    this.element = document.getElementById('waitingScreen');
    this.roomCodeDisplay = document.getElementById('roomCodeDisplay');
    this.playersList = document.getElementById('playersList');
    this.hostControls = document.getElementById('hostControls');
    this.startGameBtn = document.getElementById('startGameBtn');
  }

  initialize() {
    document.addEventListener('showWaitingScreen', (event) => {
      this.show(event.detail.roomCode);
    });

    this.startGameBtn.addEventListener('click', () => {
      this.socket.startGame();
    });

    this.socket.onPlayerList((players) => {
      this.updatePlayerList(players);
    });

    this.socket.onGameStarted(() => {
      this.hide();
      document.dispatchEvent(new CustomEvent('showGameScreen'));
    });

    this.socket.onRoomClosed(() => {
      alert('Room has been closed');
      window.location.reload();
    });
  }

  updatePlayerList(players) {
    this.playersList.innerHTML = '';
    players.forEach(playerId => {
      const li = document.createElement('li');
      li.textContent = playerId === this.socket.getId() ? 'You' : 'Player ' + playerId.slice(0, 4);
      this.playersList.appendChild(li);
    });
  }

  show(roomCode) {
    this.element.style.display = 'block';
    this.roomCodeDisplay.textContent = `Room Code: ${roomCode}`;
    if (this.socket.isHost) {
      this.hostControls.style.display = 'block';
    }
  }

  hide() {
    this.element.style.display = 'none';
  }
}
