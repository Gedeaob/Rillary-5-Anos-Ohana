document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bouncing-ball-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const statusDisplay = document.getElementById('game-status');
    const restartButton = document.getElementById('restart-button');
    const wrapper = canvas.parentElement;
    const controlZone = document.getElementById('control-zone'); // NOVO: Mapeia a zona de controle

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
// Array de blocos (cabeça do stitch)
    let blocks = [];
    const blockRowCount = 4; // 4 fileiras
    const blockColumnCount = 8;
    const blockWidth = 35;
    const blockHeight = 35; 
    const blockPadding = 5;
    const blockOffsetTop = 1;
    const blockOffsetLeft = 10;

    // ----------------------------------------------------
    // Funções de Inicialização e Responsividade
    // ----------------------------------------------------
    
    function resizeCanvas() {
        const size = Math.min(wrapper.clientWidth, 600);
        canvas.width = size;
        canvas.height = size;
        
        paddle.width = canvas.width * 0.25; 
        paddle.x = (canvas.width - paddle.width) / 2;
        
        ball.radius = canvas.width * 0.03;

        // --- CORREÇÃO DE VELOCIDADE ---
        // A velocidade é 0.8% da largura da tela. 
        // Em 300px = 2.4px/frame. Em 600px = 4.8px/frame.
        // Isso mantém a dificuldade consistente.
        let baseSpeed = canvas.width * 0.008; 
        
        // Mantém a direção atual, mas ajusta a magnitude
        ball.dx = (ball.dx > 0 ? 1 : -1) * baseSpeed;
        ball.dy = (ball.dy > 0 ? 1 : -1) * baseSpeed;

        ball.x = canvas.width / 2;
        ball.y = canvas.height - paddle.height - ball.radius - 5;
    }
     
    // Inicializa o Jogo
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
        // Ajusta o offset inicial para centralizar os blocos
        const totalBlockWidth = blockColumnCount * blockWidth + (blockColumnCount - 1) * blockPadding;
        const initialOffset = (canvas.width - totalBlockWidth) / 2;
        
        for (let r = 0; r < blockRowCount; r++) {
            for (let c = 0; c < blockColumnCount; c++) {
                let blockX = (c * (blockWidth + blockPadding)) + initialOffset;
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

    function collisionDetection() {
        blocks.forEach(block => {
            if (block.status === 1) {
                let center_x = ball.x;
                let center_y = ball.y;

                if (center_x > block.x && center_x < block.x + block.width &&
                    center_y > block.y && center_y < block.y + block.height) 
                {
                    ball.dy = -ball.dy;
                    block.status = 0;
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
            
            // Verifica se a bolinha está DENTRO da largura da paleta
            if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                
                // Colisão no topo da paleta (evita colisão dupla)
                if (ball.y < canvas.height - paddle.height - ball.radius) {
                    ball.dy = -ball.dy; 
                } else {
                     // Colisão lateral, inverte o DX para rebote lateral
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
    
    // Funcao movePaddle agora usa a ZONA DE CONTROLE ou o CANVAS
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
    // MOUSE: Usa o canvas para movimento
    canvas.addEventListener('mousemove', movePaddle); 
    
    // TOUCH: Usa a ZONA DE CONTROLE para movimento (resolve o problema de usabilidade)
    controlZone.addEventListener('touchmove', movePaddle, { passive: true });
    
    // Inicia o jogo no toque/clique
    canvas.addEventListener('click', startGame);
    canvas.addEventListener('touchstart', startGame, { once: true });
    controlZone.addEventListener('click', startGame);
    controlZone.addEventListener('touchstart', startGame, { once: true });


    // Reiniciar
    restartButton.addEventListener('click', () => {
        initGame();
        startGame();
    });

    window.addEventListener('resize', initGame);

    // Inicialização
    initGame();
});
