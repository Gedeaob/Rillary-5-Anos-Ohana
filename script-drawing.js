document.addEventListener('DOMContentLoaded', () => {
    const drawingCanvas = document.getElementById('drawing-canvas');
    const bgCanvas = document.getElementById('background-canvas');
    const ctx = drawingCanvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    
    // Elementos novos
    const brushSizeSlider = document.getElementById('brush-size-slider');
    const currentSizeDisplay = document.getElementById('current-size-display');
    const saveOptionsDiv = document.getElementById('save-options');
    const shareButton = document.getElementById('share-drawing');
    
    // Verifica se o navegador suporta compartilhamento
    if (navigator.share) {
        shareButton.style.display = 'inline-block';
    }

    const drawingImages = [
        'drawing 1.jpg', 'drawing 2.jpg', 'drawing 3.jpg', 
        'drawing 4.jpg', 'drawing 5.jpg'
    ];
    let selectedImageObj = null; 
    let lastLoadedImageName = null; 
    
    let drawing = false;
    let currentColor = '#4D87E6'; 
    let brushSize = 10;
    let currentTool = 'brush'; 

    // Configuração Inicial
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = currentColor;

    // --- FUNÇÃO DE REDIMENSIONAR (CORRIGIDA) ---
    function resizeCanvas() {
        const wrapper = drawingCanvas.parentElement;
        const size = wrapper.clientWidth; // Largura do quadrado

        // Se o tamanho mudou, precisamos salvar o desenho atual antes de redimensionar
        // para ele não sumir.
        // NOTA: Para simplificar, neste código, ao redimensionar a tela (girar celular),
        // mantemos o tamanho relativo.
        
        if (drawingCanvas.width !== size) {
            drawingCanvas.width = size;
            drawingCanvas.height = size;
            bgCanvas.width = size;
            bgCanvas.height = size;
            
            // Redesenha a imagem de fundo
            if (selectedImageObj) {
                bgCtx.drawImage(selectedImageObj, 0, 0, size, size);
            }
            
            // Reconfigura o pincel (o resize reseta o contexto)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = brushSize;
            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentColor;
            }
        }
    }

    // --- CARREGAR IMAGEM ---
    function setupImageSelection() {
        const grid = document.getElementById('image-selection-grid');
        grid.innerHTML = '';
        drawingImages.forEach((fileName) => {
            const option = document.createElement('div');
            option.classList.add('image-option');
            const img = document.createElement('img');
            img.src = `images/drawing/${fileName}`;
            option.appendChild(img);
            
            option.addEventListener('click', () => {
                // Remove seleção visual dos outros
                document.querySelectorAll('.image-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');

                const newImg = new Image();
                newImg.crossOrigin = "anonymous";
                newImg.onload = () => {
                    selectedImageObj = newImg;
                    // Limpa desenho e fundo
                    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
                    // Desenha novo fundo
                    bgCtx.drawImage(newImg, 0, 0, bgCanvas.width, bgCanvas.height);
                };
                newImg.src = `images/drawing/${fileName}`;
            });
            grid.appendChild(option);
        });
    }

    // --- DESENHO (Toque e Mouse) ---
    function getPosition(e) {
        const rect = drawingCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function start(e) { e.preventDefault(); drawing = true; ctx.beginPath(); ctx.moveTo(getPosition(e).x, getPosition(e).y); }
    function move(e) { if(!drawing) return; e.preventDefault(); ctx.lineTo(getPosition(e).x, getPosition(e).y); ctx.stroke(); }
    function stop() { drawing = false; ctx.closePath(); }

    drawingCanvas.addEventListener('mousedown', start);
    drawingCanvas.addEventListener('mousemove', move);
    drawingCanvas.addEventListener('mouseup', stop);
    drawingCanvas.addEventListener('touchstart', start, {passive: false});
    drawingCanvas.addEventListener('touchmove', move, {passive: false});
    drawingCanvas.addEventListener('touchend', stop);

    // --- FERRAMENTAS ---
    // Slider
    brushSizeSlider.addEventListener('input', (e) => {
        brushSize = e.target.value;
        ctx.lineWidth = brushSize;
        currentSizeDisplay.textContent = `${brushSize}px`;
    });

    // Cores
    document.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', (e) => setColor(e.target.dataset.color, e.target));
    });
    document.getElementById('color-input').addEventListener('input', (e) => setColor(e.target.value, document.querySelector('.color-picker-button')));

    function setColor(color, element) {
        currentColor = color;
        currentTool = 'brush';
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        
        // UI Updates
        document.querySelectorAll('.color-swatch, .color-picker-button').forEach(el => el.classList.remove('selected'));
        if(element) element.classList.add('selected');
        document.getElementById('brush-tool').classList.add('selected-tool');
        document.getElementById('eraser-tool').classList.remove('selected-tool');
    }

    // Pincel vs Borracha
    document.getElementById('brush-tool').addEventListener('click', () => {
        currentTool = 'brush';
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        document.getElementById('brush-tool').classList.add('selected-tool');
        document.getElementById('eraser-tool').classList.remove('selected-tool');
    });

    document.getElementById('eraser-tool').addEventListener('click', () => {
        currentTool = 'eraser';
        ctx.globalCompositeOperation = 'destination-out';
        document.getElementById('brush-tool').classList.remove('selected-tool');
        document.getElementById('eraser-tool').classList.add('selected-tool');
    });

    // Limpar e Tela Branca
    document.getElementById('clear-canvas').addEventListener('click', () => {
        if(confirm("Limpar seu desenho?")) ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    });
    document.getElementById('free-draw-button').addEventListener('click', () => {
        selectedImageObj = null;
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        alert("Tela Branca Livre!");
    });

    // --- SALVAR E COMPARTILHAR ---
    document.getElementById('open-save-options').addEventListener('click', () => {
        saveOptionsDiv.style.display = (saveOptionsDiv.style.display === 'none') ? 'block' : 'none';
    });

    // Função auxiliar para criar o canvas final mesclado
    // Função auxiliar para criar o canvas final com a Marca D'água Estilizada
    function getFinalCanvas() {
        const tempCanvas = document.createElement('canvas');
        // Usa o tamanho real do desenho para alta qualidade
        tempCanvas.width = drawingCanvas.width;
        tempCanvas.height = drawingCanvas.height;
        const tCtx = tempCanvas.getContext('2d');
        
        // 1. Fundo branco (para evitar transparência indesejada no JPG)
        tCtx.fillStyle = '#FFFFFF';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // 2. Desenha a Imagem de Contorno (Fundo)
        tCtx.drawImage(bgCanvas, 0, 0);
        
        // 3. Desenha o Desenho do Usuário por cima
        tCtx.drawImage(drawingCanvas, 0, 0);
        
        // 4. --- MARCA D'ÁGUA ESTILIZADA ---
        
        // Configurações de tamanho baseadas na largura da imagem (responsivo)
        const w = tempCanvas.width;
        const padding = w * 0.05; // Margem de 5%
        
        // A. Nome "Rillary" (Fonte Pacifico - Azul com Sombra Rosa)
        const nameFontSize = w * 0.12; // Tamanho proporcional
        tCtx.font = `${nameFontSize}px 'Pacifico', cursive`;
        tCtx.textAlign = 'left';
        tCtx.textBaseline = 'top';
        
        // Sombra Rosa
        tCtx.shadowColor = '#FF8BA0'; 
        tCtx.shadowBlur = 0;
        tCtx.shadowOffsetX = 3;
        tCtx.shadowOffsetY = 3;
        
        // Cor Azul
        tCtx.fillStyle = '#4D87E6';
        tCtx.fillText("Rillary", padding, padding);
        
        // B. "5 aninhos" (Fonte Bubblegum Sans - Rosa sem sombra)
        // Reset da sombra para não borrar o texto de baixo
        tCtx.shadowColor = 'transparent';
        tCtx.shadowOffsetX = 0;
        tCtx.shadowOffsetY = 0;
        
        const ageFontSize = w * 0.06; // Menor que o nome
        tCtx.font = `${ageFontSize}px 'Bubblegum Sans', cursive`;
        tCtx.fillStyle = '#FF8BA0'; // Rosa Angel
        
        // Posiciona abaixo do nome Rillary
        // (Ajuste fino da posição vertical)
        tCtx.fillText("5 aninhos 🌸", padding, padding + nameFontSize);
        
        // C. (Opcional) Assinatura pequena no rodapé
        const footerFontSize = w * 0.03;
        tCtx.font = `${footerFontSize}px 'Bubblegum Sans', sans-serif`;
        tCtx.fillStyle = '#cccccc';
        tCtx.textAlign = 'right';
        tCtx.fillText("Feito na festa da Rillary", w - padding, tempCanvas.height - padding);
        
        return tempCanvas;
    }

    // Botões de Download
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format; // png ou jpg
            const canvas = getFinalCanvas();
            const link = document.createElement('a');
            link.download = `Rillary_Arte.${format}`;
            link.href = canvas.toDataURL(`image/${format}`, 0.9);
            link.click();
            saveOptionsDiv.style.display = 'none';
        });
    });

    // Botão Compartilhar
    shareButton.addEventListener('click', () => {
        const canvas = getFinalCanvas();
        canvas.toBlob(blob => {
            const file = new File([blob], "rillary_desenho.png", { type: "image/png" });
            navigator.share({
                title: 'Meu desenho da Rillary',
                text: 'Olha o desenho que fiz na festa da Rillary!',
                files: [file]
            }).catch(console.error);
        });
    });

    // Init
    setupImageSelection();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});
