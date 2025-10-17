// assets/js/art-background.js

function inicializarAnimacaoDeFundo(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas com ID '${canvasId}' não encontrado.`);
        return;
    }
    const ctx = canvas.getContext("2d");
    let particlesArray;

    function setCanvasSize() {
        // Para a página de login, o canvas ocupa a janela inteira.
        // Para o dashboard, ele ocupa o container do conteúdo principal.
        if (canvasId === 'art-background') {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        } else {
            const mainContent = document.querySelector(".main-content");
            if (mainContent) {
                canvas.width = mainContent.clientWidth;
                canvas.height = mainContent.clientHeight;
            } else {
                 canvas.width = window.innerWidth;
                 canvas.height = window.innerHeight;
            }
        }
    }
    setCanvasSize();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        particlesArray = [];
        let numberOfParticles = (canvas.height * canvas.width) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    init();

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        for (let i = 0; i < particlesArray.length; i++) {
            for (let j = i; j < particlesArray.length; j++) {
                let dx = particlesArray[i].x - particlesArray[j].x;
                let dy = particlesArray[i].y - particlesArray[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = particlesArray[i].color;
                    ctx.lineWidth = 0.2;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener("resize", () => {
        setCanvasSize();
        init();
    });
}

// Exporta a função para que ela possa ser importada em outros arquivos
export { inicializarAnimacaoDeFundo };