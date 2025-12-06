document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bouncing-ball-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const statusDisplay = document.getElementById('game-status');
    const restartButton = document.getElementById('restart-button');
    const wrapper = canvas.parentElement;

    // ----------------------------------------------------
    // Variáveis de Jogo e Estado
    // ----------------------------------------------------
    let gameLoopId;
    let score = 0;
    let gameActive = false;
    
    // Objeto Bolinha (Stitch)
    let ball = {
        x: 0, y: 0, radius: 10, dx: 4, dy: -4, color: '#4D87E6' 
    };

    // Objeto Paleta (Paddle)
    let paddle = {
        height: 10, width: 75, x: 0, color: '#FF8BA0' 
    };
    
    // Objetos Suspensos (Flores)
    const flowerImage = new Image();
    flowerImage.src = 'images/hawaiian_flower.png'; // Caminho da imagem da flor
    let imageLoaded = false;
    
    flowerImage.onload = () => {
        imageLoaded = true;
        draw(); 
    };

    let blocks = [];
    const blockRowCount = 4; // 4 fileiras
    const blockColumnCount = 8;
    const blockWidth = 35;
    const blockHeight = 35; // Altura para a imagem
    const blockPadding = 5;
    const blockOffsetTop = 1;
    const blockOffsetLeft = 10;

    // ----------------------------------------------------
    // Funções de Inicialização e Responsividade
    // ----------------------------------------------------
    
    function resizeCanvas() {
        const size = Math.min(wrapper.clientWidth - 20, 600);
        canvas.width = size;
        canvas.height = size;
        
        paddle.width = canvas.width * 0.25; // Paleta mais larga (25%)
        paddle.x = (canvas.width - paddle.width) / 2;
        ball.x = canvas.width / 2;
        ball.y = canvas.height - paddle.height - ball.radius - 5;
    }
    
    function initGame() {
        score = 0;
        scoreDisplay.textContent = `Pontos: ${score}`;
        
        ball.dx = 4;
        ball.dy = -4;
        ball.radius = canvas.width * 0.03;
        
        statusDisplay.textContent = 'Clique/Toque para Iniciar!';
        restartButton.style.display = 'none';
        gameActive = false;
        
        resizeCanvas();
        createBlocks();
        if (imageLoaded) {
            draw();
        }
    }

    /** Cria o layout de 4 fileiras de Flores **/
    function createBlocks() {
        blocks = [];
        for (let r = 0; r < blockRowCount; r++) {
            for (let c = 0; c < blockColumnCount; c++) {
                let blockX = (c * (blockWidth + blockPadding)) + blockOffsetLeft;
                let blockY = (r * (blockHeight + blockPadding)) + blockOffsetTop;
                
                blocks.push({ 
                    x: blockX, y: blockY, width: blockWidth, height: blockHeight, status: 1 
                });
            }
        }
    }

    // ----------------------------------------------------
    // Funções de Desenho
    // ----------------------------------------------------

    function drawBall() {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
        ctx.fillStyle = paddle.color;
        ctx.fill();
        ctx.closePath();
    }

    /** Desenha a imagem da flor em vez do bloco **/
    function drawBlocks() {
        blocks.forEach(block => {
            if (block.status === 1) {
                if (imageLoaded) {
                    ctx.drawImage(flowerImage, block.x, block.y, block.width, block.height);
                } else {
                    // Desenha um bloco de backup se a imagem não carregar
                    ctx.beginPath();
                    ctx.rect(block.x, block.y, block.width, block.height);
                    ctx.fillStyle = '#FF8BA0';
                    ctx.fill();
                    ctx.closePath();
                }
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBlocks();
        drawBall();
        drawPaddle();
    }

    // ----------------------------------------------------
    // Lógica de Colisão
    // ----------------------------------------------------

    /** Colisão Bolinha vs. Flores **/
    function collisionDetection() {
        blocks.forEach(block => {
            if (block.status === 1) {
                let center_x = ball.x;
                let center_y = ball.y;

                if (center_x > block.x && center_x < block.x + block.width &&
                    center_y > block.y && center_y < block.y + block.height) 
                {
                    ball.dy = -ball.dy;   // Inverte a direção vertical
                    block.status = 0;     // "Murcha" a flor
                    score += 5;         
                    scoreDisplay.textContent = `Pontos: ${score}`;
                }
            }
        });

        if (blocks.every(block => block.status === 0)) {
             statusDisplay.textContent = "Parabéns, Rillary! Você VENCEU!";
             gameOver(false);
        }
    }

    function update() {
        // Colisão com as paredes esquerda/direita
        if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx;
        }

        // Colisão com a parede superior
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy;
        } 
        
        // Colisão com a paleta
        else if (ball.y + ball.dy > canvas.height - ball.radius - paddle.height) {
            
            // Colisão vertical (no topo da paleta) ou lateral
            if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                
                // Colisão no topo da paleta
                if (ball.y < canvas.height - paddle.height - ball.radius) {
                    ball.dy = -ball.dy; 
                } else {
                     // Colisão lateral, inverte o DX
                     ball.dx = -ball.dx;
                }
                
                score++;
                scoreDisplay.textContent = `Pontos: ${score}`;
            } 
        }
        
        // LÓGICA DE PERDA: SE a bolinha cair ABAIXO da linha de base
        if (ball.y + ball.dy > canvas.height - ball.radius) {
             gameOver(true);
             return; 
        }

        collisionDetection();

        ball.x += ball.dx;
        ball.y += ball.dy;
        
        draw();
        
        if (gameActive) {
            gameLoopId = requestAnimationFrame(update);
        }
    }

    function gameOver(loss) {
        gameActive = false;
        cancelAnimationFrame(gameLoopId);
        
        if (loss) {
            statusDisplay.textContent = `Fim de Jogo! Pontuação Final: ${score}`;
        }
        restartButton.style.display = 'block'; 
    }
    
    function startGame() {
        if (!gameActive) {
            gameActive = true;
            statusDisplay.textContent = 'Jogue!';
            gameLoopId = requestAnimationFrame(update);
        }
    }

    // ----------------------------------------------------
    // Controle da Paleta (Mouse e Touch)
    // ----------------------------------------------------
    
    function movePaddle(e) {
        if (!gameActive) return;

        let clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        
        const rect = canvas.getBoundingClientRect();
        let relativeX = clientX - rect.left;

        if (relativeX > 0 && relativeX < canvas.width) {
            paddle.x = relativeX - paddle.width / 2;
        }
    }

    // Event Listeners
    canvas.addEventListener('mousemove', movePaddle);
    canvas.addEventListener('touchmove', movePaddle, { passive: true });
    
    canvas.addEventListener('click', startGame);
    canvas.addEventListener('touchstart', startGame, { once: true });

    restartButton.addEventListener('click', () => {
        initGame();
        startGame();
    });

    window.addEventListener('resize', initGame);

    // Inicialização
    initGame();
});