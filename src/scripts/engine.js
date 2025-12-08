const photos = [
  "r1.png", "r1.png",
  "r2.png", "r2.png",
  "r3.png", "r3.png",
  "r4.png", "r4.png",
  "r5.png", "r5.png",
  "r6.png", "r6.png",
  "r7.png", "r7.png",
  "r8.png", "r8.png"
];
let openCards = [];

// Embaralha as fotos usando o algoritmo aleatório [cite: 68]
let shufflePhotos = photos.sort(() => (Math.random() > 0.5 ? 2 : -1));

const gameContainer = document.querySelector(".game");

for (let i = 0; i < photos.length; i++) {
  let box = document.createElement("div");
  box.className = "item";
  
  // Cria a imagem para cada carta apontando para a pasta images
  let img = document.createElement("img");
  img.src = `./images/${shufflePhotos[i]}`;
  
  box.appendChild(img);
  box.onclick = handleClick;
  gameContainer.appendChild(box);
}

function handleClick() {
  if (openCards.length < 2 && !this.classList.contains("boxOpen")) {
    this.classList.add("boxOpen");
    openCards.push(this);
  }

  if (openCards.length == 2) {
    setTimeout(checkMatch, 500);
  }
}

function checkMatch() {
  // Compara o atributo src das imagens dentro dos divs [cite: 71]
  if (openCards[0].querySelector("img").src === openCards[1].querySelector("img").src) {
    openCards[0].classList.add("boxMatch");
    openCards[1].classList.add("boxMatch");
  } else {
    openCards[0].classList.remove("boxOpen");
    openCards[1].classList.remove("boxOpen");
  }

  openCards = [];

  // Verifica se todos os pares foram encontrados [cite: 72]
  if (document.querySelectorAll(".boxMatch").length === photos.length) {
    alert("Parabéns, Rillary! Você venceu todo o seu Ohana! 🎉");
  }
}