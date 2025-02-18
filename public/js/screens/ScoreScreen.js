export class ScoreScreen {
  constructor(socket) {
    this.socket = socket;
    this.element = document.createElement('div');
    this.element.className = 'score-screen';
    document.body.appendChild(this.element);

    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  initialize() {
    document.addEventListener('keydown', this.handleKeyPress);

    this.socket.onRoundEnded((data) => {
      this.show(data);
    });
  }

  handleKeyPress(e) {
    if (e.code === 'Space' && this.socket.isHost) {
      this.socket.startNewRound();
      this.hide();
    }
  }

  show(data) {
    const { winner, scores, gameWinner } = data;

    // Create score display HTML
    let html = '<div class="score-container">';

    if (gameWinner) {
      html += `<h1>Game Over!</h1>
               <h2>Player ${gameWinner === this.socket.getId() ? 'You' : gameWinner.slice(0, 4)} Wins the Game!</h2>`;
    } else {
      html += `<h2>Round Winner: ${winner === this.socket.getId() ? 'You' : 'Player ' + winner.slice(0, 4)}</h2>`;
    }

    html += '<div class="scores-list">';
    scores.forEach(([playerId, score]) => {
      html += `<div class="score-entry">
                 <span>${playerId === this.socket.getId() ? 'You' : 'Player ' + playerId.slice(0, 4)}</span>
                 <span>${score}</span>
               </div>`;
    });
    html += '</div>';

    if (this.socket.isHost && !gameWinner) {
      html += '<p class="instruction">Press SPACE to start next round</p>';
    }

    html += '</div>';

    this.element.innerHTML = html;
    this.element.style.display = 'flex';
  }

  hide() {
    this.element.style.display = 'none';
  }

  cleanup() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }
}
