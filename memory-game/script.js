// Kart görselleri
const cardImages = [
    '🌍', // gezegen
    '🚀', // roket
    '👨‍🚀', // astronot
    '🛸', // UFO
    '🛰️', // uydu
    '☄️', // meteor
    '⭐', // yıldız
    '🌌'  // galaksi
];

document.addEventListener('DOMContentLoaded', () => {
    // Materialize başlatma
    M.Modal.init(document.querySelectorAll('.modal'));

    // Yıldız animasyonu oluşturma
    createStars();
    createShootingStars();

    const gameBoard = document.getElementById('game-board');
    const playerStats = document.getElementById('playerStats');
    let cards = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let currentPlayer = 1;
    let gameMode = 'single';
    let botTimeout;
    
    // Oyun durumu
    const gameState = {
        player1: { moves: 0, matches: 0, score: 0 },
        player2: { moves: 0, matches: 0, score: 0 },
        gameStarted: false,
        totalMatches: 0
    };
    
    // Oyun modu seçimi
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            gameMode = card.dataset.mode;
            const modal = M.Modal.getInstance(document.getElementById('gameModeModal'));
            modal.close();
            resetGame();
        });
    });

    // Oyun modu değiştirme butonu
    document.getElementById('changeGameMode').addEventListener('click', () => {
        const modal = M.Modal.getInstance(document.getElementById('gameModeModal'));
        modal.open();
    });
    
    // Yeni oyun butonu
    document.getElementById('newGameBtn').addEventListener('click', resetGame);
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        const modal = M.Modal.getInstance(document.getElementById('winModal'));
        modal.close();
        setTimeout(resetGame, 300);
    });

    function createStars() {
        const starsContainer = document.querySelector('.stars');
        const numberOfStars = 100;

        for (let i = 0; i < numberOfStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.width = `${Math.random() * 3}px`;
            star.style.height = star.style.width;
            star.style.animationDuration = `${Math.random() * 3 + 1}s`;
            starsContainer.appendChild(star);
        }
    }

    function createShootingStars() {
        setInterval(() => {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star';
            
            // Rastgele animasyon seç
            const animations = ['shooting1', 'shooting2', 'shooting3'];
            const randomAnim = animations[Math.floor(Math.random() * animations.length)];
            
            // Rastgele başlangıç pozisyonu
            const randomX = Math.random() * window.innerWidth;
            const randomY = Math.random() * window.innerHeight / 2;
            shootingStar.style.left = `${randomX}px`;
            shootingStar.style.top = `${randomY}px`;
            
            // Animasyonu uygula
            shootingStar.style.animation = `${randomAnim} 3s linear`;
            
            document.body.appendChild(shootingStar);
            
            setTimeout(() => {
                shootingStar.remove();
            }, 3000);
        }, 5000); // Her 5 saniyede bir
    }

    function updatePlayerStats() {
        const statsHTML = `
            <div class="player-stats">
                <div class="player-info ${currentPlayer === 1 ? 'active' : ''}">
                    <h5>Oyuncu 1</h5>
                    <p>Hamleler: ${gameState.player1.moves}</p>
                    <p>Eşleşmeler: ${gameState.player1.matches}</p>
                    <p>Skor: ${gameState.player1.score}</p>
                </div>
                ${gameMode !== 'single' ? `
                    <div class="player-info ${currentPlayer === 2 ? 'active' : ''}">
                        <h5>${gameMode === 'bot' ? 'Bot' : 'Oyuncu 2'}</h5>
                        <p>Hamleler: ${gameState.player2.moves}</p>
                        <p>Eşleşmeler: ${gameState.player2.matches}</p>
                        <p>Skor: ${gameState.player2.score}</p>
                    </div>
                ` : ''}
            </div>
        `;
        playerStats.innerHTML = statsHTML;
    }

    function initializeGame() {
        const doubledImages = [...cardImages, ...cardImages];
        cards = shuffle(doubledImages);
        renderCards();
        updatePlayerStats();
        gameState.gameStarted = true;
        gameState.totalMatches = 0;
    }

    function renderCards() {
        gameBoard.innerHTML = '';
        cards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.setAttribute('data-card', emoji);
            
            card.innerHTML = `
                <div class="front">
                    <div class="card-content">${emoji}</div>
                </div>
                <div class="back"></div>
            `;
            
            card.addEventListener('click', flipCard);
            card.classList.add('animate__animated', 'animate__fadeIn');
            card.style.animationDelay = `${index * 0.1}s`;
            gameBoard.appendChild(card);
        });
    }

    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;
        if (gameMode === 'bot' && currentPlayer === 2) return;

        this.classList.add('flip');

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;
            return;
        }

        secondCard = this;
        checkForMatch();
    }

    function checkForMatch() {
        const currentPlayerState = currentPlayer === 1 ? gameState.player1 : gameState.player2;
        currentPlayerState.moves++;
        
        const isMatch = firstCard.getAttribute('data-card') === secondCard.getAttribute('data-card');

        if (isMatch) {
            currentPlayerState.matches++;
            currentPlayerState.score += 100;
            gameState.totalMatches++;
            disableCards();
        } else {
            unflipCards();
            switchPlayer();
        }
        
        updatePlayerStats();
        
        if (gameState.totalMatches === cardImages.length) {
            setTimeout(showWinModal, 500);
        } else if (gameMode === 'bot' && currentPlayer === 2) {
            botTimeout = setTimeout(botMove, 1000);
        }
    }

    function botMove() {
        if (currentPlayer !== 2 || gameMode !== 'bot') return;
        
        const unmatched = Array.from(document.querySelectorAll('.memory-card:not(.matched)'));
        const unflipped = unmatched.filter(card => !card.classList.contains('flip'));
        
        if (unflipped.length === 0) return;
        
        const firstChoice = unflipped[Math.floor(Math.random() * unflipped.length)];
        firstChoice.classList.add('flip');
        firstCard = firstChoice;
        hasFlippedCard = true;
        
        setTimeout(() => {
            if (unflipped.length <= 1) {
                resetBoard();
                switchPlayer();
                return;
            }
            
            const remainingCards = unflipped.filter(card => card !== firstChoice);
            const secondChoice = remainingCards[Math.floor(Math.random() * remainingCards.length)];
            secondChoice.classList.add('flip');
            secondCard = secondChoice;
            checkForMatch();
        }, 1000);
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        firstCard.querySelector('.front').classList.add('animate__animated', 'animate__pulse');
        secondCard.querySelector('.front').classList.add('animate__animated', 'animate__pulse');

        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;

        setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            resetBoard();
        }, 1500);
    }

    function switchPlayer() {
        if (gameMode !== 'single') {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updatePlayerStats();
            
            if (gameMode === 'bot' && currentPlayer === 2) {
                botTimeout = setTimeout(botMove, 1000);
            }
        }
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function showWinModal() {
        let winnerStats;
        if (gameMode === 'single') {
            winnerStats = `
                <div class="achievement">
                    <i class="material-icons">military_tech</i>
                    <p>Toplam Hamle: ${gameState.player1.moves}</p>
                </div>
                <div class="achievement">
                    <i class="material-icons">stars</i>
                    <p>Skor: ${gameState.player1.score}</p>
                </div>
            `;
        } else {
            const winner = gameState.player1.matches > gameState.player2.matches ? 1 :
                         gameState.player2.matches > gameState.player1.matches ? 2 :
                         gameState.player1.score > gameState.player2.score ? 1 : 2;
            
            winnerStats = `
                <h5>${winner === 1 ? 'Oyuncu 1' : (gameMode === 'bot' ? 'Bot' : 'Oyuncu 2')} Kazandı!</h5>
                <div class="achievement">
                    <i class="material-icons">military_tech</i>
                    <p>Eşleşmeler: ${winner === 1 ? gameState.player1.matches : gameState.player2.matches}</p>
                </div>
                <div class="achievement">
                    <i class="material-icons">stars</i>
                    <p>Skor: ${winner === 1 ? gameState.player1.score : gameState.player2.score}</p>
                </div>
            `;
        }
        
        document.getElementById('winnerStats').innerHTML = winnerStats;
        const modal = M.Modal.getInstance(document.getElementById('winModal'));
        modal.open();
    }

    function resetGame() {
        if (botTimeout) {
            clearTimeout(botTimeout);
        }
        
        currentPlayer = 1;
        gameState.player1 = { moves: 0, matches: 0, score: 0 };
        gameState.player2 = { moves: 0, matches: 0, score: 0 };
        gameState.totalMatches = 0;
        
        const cards = document.querySelectorAll('.memory-card');
        cards.forEach(card => {
            card.classList.remove('flip', 'matched');
            card.querySelector('.front').classList.remove('animate__animated', 'animate__pulse');
        });
        
        setTimeout(() => {
            initializeGame();
        }, 500);
    }

    // Oyunu başlat
    const modeModal = M.Modal.getInstance(document.getElementById('gameModeModal'));
    modeModal.open();
});
