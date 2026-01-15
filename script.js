const cursorBlur = document.getElementById('cursor-blur');
const customCursor = document.querySelector('.custom-cursor');
const robotHead = document.querySelector('.robot-head');
const eyes = document.querySelectorAll('.eye');
const mouth = document.querySelector('.mouth');

/* Global Mouse Management */
let lastX = 0;
let lastY = 0;
let lastTime = Date.now();
let shieldCooldown = false;

document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const currentTime = Date.now();
    const dt = currentTime - lastTime;

    /* 1. Cursor Effects (Blur & Point) */
    if (cursorBlur) {
        cursorBlur.style.left = x + 'px';
        cursorBlur.style.top = y + 'px';
    }
    if (customCursor) {
        customCursor.style.left = x + 'px';
        customCursor.style.top = y + 'px';
    }

    /* 2. Robot Head Tracking */
    if (robotHead && !robotHead.classList.contains('proud')) {
        // Head Tilt
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const rotateY = ((x - centerX) / centerX) * 30;
        const rotateX = ((y - centerY) / centerY) * -20;
        robotHead.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        // Eye Tracking
        eyes.forEach(eye => {
            const rect = eye.getBoundingClientRect();
            const eyeX = rect.left + rect.width / 2;
            const eyeY = rect.top + rect.height / 2;
            const angle = Math.atan2(y - eyeY, x - eyeX);
            const radius = 15;
            const pupilX = Math.cos(angle) * radius;
            const pupilY = Math.sin(angle) * radius;
            const pupilContainer = eye.querySelector('.pupil-container');
            if (pupilContainer) {
                pupilContainer.style.transform = `translate(calc(-50% + ${pupilX}px), calc(-50% + ${pupilY}px))`;
            }
        });

        // Smile Logic
        const headRect = robotHead.getBoundingClientRect();
        const hCX = headRect.left + headRect.width / 2;
        const hCY = headRect.top + headRect.height / 2;
        const distance = Math.sqrt(Math.pow(x - hCX, 2) + Math.pow(y - hCY, 2));
        if (mouth) {
            if (distance < 50) mouth.classList.add('smile');
            else mouth.classList.remove('smile');
        }

        /* 2.5 Laser Beam Tracking (Kill Mode) */
        if (robotHead.classList.contains('angry')) {
            const lasers = document.querySelectorAll('.laser');
            lasers.forEach(laser => {
                const parentEye = laser.closest('.eye');
                const eyeRect = parentEye.getBoundingClientRect();
                const eyeCenterX = eyeRect.left + eyeRect.width / 2;
                const eyeCenterY = eyeRect.top + eyeRect.height / 2;

                const dx = x - eyeCenterX;
                const dy = y - eyeCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // Update laser
                laser.style.width = `${dist}px`;
                laser.style.transform = `rotate(${angle}rad)`;
            });
        }
        /* 3. Energy Shield Logic (Throttled Velocity Check) */
        if (dt > 80) {
            const dx = x - lastX;
            const dy = y - lastY;
            const speed = Math.sqrt(dx * dx + dy * dy) / dt;
            const prevDist = Math.sqrt(Math.pow(lastX - hCX, 2) + Math.pow(lastY - hCY, 2));

            const isAgitating = distance < 150 && prevDist < 180 && speed > 1.2;

            if (isAgitating && !shieldCooldown && !document.body.classList.contains('system-breach')) {
                const shield = document.querySelector('.shield');
                if (shield) {
                    shield.classList.add('active');
                    robotHead.classList.add('angry');
                    shieldCooldown = true;
                    setTimeout(() => {
                        shield.classList.remove('active');
                        robotHead.classList.remove('angry');
                        shieldCooldown = false;
                    }, 4000); // Increased duration to 4 seconds as requested
                }
            }
            lastX = x;
            lastY = y;
            lastTime = currentTime;
        }
    }
});

/* 3.5 Touch Interaction for Robot (Kill Mode) */
if (robotHead) {
    // Helper to update lasers to a specific point
    const updateLasers = (x, y) => {
        const lasers = document.querySelectorAll('.laser');
        lasers.forEach(laser => {
            const parentEye = laser.closest('.eye');
            const eyeRect = parentEye.getBoundingClientRect();
            const eyeCenterX = eyeRect.left + eyeRect.width / 2;
            const eyeCenterY = eyeRect.top + eyeRect.height / 2;

            const dx = x - eyeCenterX;
            const dy = y - eyeCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            laser.style.width = `${dist}px`;
            laser.style.transform = `rotate(${angle}rad)`;
        });
    };

    robotHead.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const shield = document.querySelector('.shield');

        // Immediate laser update to touch point
        updateLasers(touch.clientX, touch.clientY);

        if (shield && !shieldCooldown) {
            shield.classList.add('active');
            robotHead.classList.add('angry');
            shieldCooldown = true;
            setTimeout(() => {
                const s = document.querySelector('.shield');
                if (s) s.classList.remove('active');
                if (robotHead) robotHead.classList.remove('angry');
                shieldCooldown = false;
            }, 4000);
        }
    }, { passive: false });

    // Track finger while holding/moving
    document.addEventListener('touchmove', (e) => {
        if (robotHead.classList.contains('angry')) {
            const touch = e.touches[0];
            updateLasers(touch.clientX, touch.clientY);
        }
    }, { passive: false });
}

/* Particle System */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let width, height;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3.5;
        this.color = Math.random() > 0.5 ? 'rgba(0, 243, 255, 0.7)' : 'rgba(176, 38, 255, 0.7)';
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < 150; i++) particles.push(new Particle());
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p, index) => {
        p.update();
        p.draw();
        for (let j = index + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 150) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 - distance / 1500})`;
                ctx.stroke();
            }
        }
    });
    requestAnimationFrame(animateParticles);
}
initParticles();
animateParticles();

/* Hover Effects for Cursor & Interactions */
const interactiveElements = document.querySelectorAll('a, button, .glass-card, .section-title, h1');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        if (customCursor) customCursor.classList.add('active');
        if (cursorBlur) {
            cursorBlur.style.width = '450px'; // Focused glow (was 600/700)
            cursorBlur.style.height = '450px';
            cursorBlur.style.background = 'radial-gradient(circle, rgba(189, 0, 255, 0.12), rgba(0, 243, 255, 0.05), transparent 70%)';
        }
    });

    el.addEventListener('mouseleave', () => {
        if (customCursor) customCursor.classList.remove('active');
        if (cursorBlur) {
            cursorBlur.style.width = '600px';
            cursorBlur.style.height = '600px';
            cursorBlur.style.background = 'radial-gradient(circle, rgba(0, 243, 255, 0.2), rgba(176, 38, 255, 0.1), transparent 70%)';
        }
    });

    if (el.classList.contains('glass-card') && !el.classList.contains('contact-card')) {
        el.addEventListener('mousemove', (e) => {
            el.style.transition = 'none';
            const rect = el.getBoundingClientRect();
            const rX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -10;
            const rY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 10;
            el.style.transform = `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.02, 1.02, 1.02) translateY(-10px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transition = 'transform 0.5s ease';
            el.style.transform = `perspective(1000px) rotateX(0) rotateY(0) translateY(0)`;
        });
    }
});

/* Proud Effect & Glitch Logic */
const nameHeader = document.querySelector('h1');
if (nameHeader && robotHead) {
    nameHeader.addEventListener('mouseenter', () => robotHead.classList.add('proud'));
    nameHeader.addEventListener('mouseleave', () => robotHead.classList.remove('proud'));

    robotHead.addEventListener('click', () => {
        const glitchOverlay = document.getElementById('glitch-overlay');
        glitchOverlay.classList.add('active');
        const titleSpan = document.querySelector('h1 .gradient-text');
        const originalText = titleSpan.innerText;
        let iteration = 0;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$";

        const glitchInterval = setInterval(() => {
            titleSpan.innerText = titleSpan.innerText.split("").map((letter, index) => {
                if (index < iteration) return "SYSTEM FAILURE"[index] || "";
                return letters[Math.floor(Math.random() * 26)];
            }).join("");

            if (iteration >= 15) {
                clearInterval(glitchInterval);
                titleSpan.innerText = originalText;
            }
            iteration += 1 / 2;
        }, 30);

        setTimeout(() => document.body.classList.toggle('system-breach'), 200);
        setTimeout(() => {
            glitchOverlay.classList.remove('active');
            if (!document.body.classList.contains('system-breach')) titleSpan.innerText = originalText;
        }, 800);
    });
}

/* Matrix Title Function */
function decodeText(element) {
    if (element.classList.contains('decoded')) return;
    element.classList.add('decoded');
    const originalText = element.innerText;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$0123456789";
    let iterations = 0;

    const interval = setInterval(() => {
        element.innerText = element.innerText.split("").map((letter, index) => {
            if (index < iterations) return originalText[index];
            return letters[Math.floor(Math.random() * letters.length)];
        }).join("");

        if (iterations >= originalText.length) clearInterval(interval);
        iterations += 1 / 3;
    }, 30);
}

/* Typewriter Effect */
const typewriterElement = document.getElementById('typewriter');
const textToType = "Junior Software Developer";
let charIndex = 0;
function typeWriter() {
    if (typewriterElement && charIndex < textToType.length) {
        typewriterElement.textContent += textToType.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 100);
    }
}

/* Scroll Reveal Observer */
document.querySelectorAll('.glass-card, h2.section-title, .about-content').forEach(el => el.classList.add('reveal'));
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');

            // Specialized Matrix Reveal for contact
            if (entry.target.classList.contains('contact-card')) {
                const matrixTitle = entry.target.querySelector('.matrix-title');
                if (matrixTitle) decodeText(matrixTitle);
            }

            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* Active Menu Tracker */
const navLinks = document.querySelectorAll('nav ul li a');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            let current = entry.target.getAttribute('id');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').includes(current)) link.classList.add('active');
            });
        }
    });
}, { threshold: 0.6 });
document.querySelectorAll('section').forEach(section => sectionObserver.observe(section));

/* Matrix Decoder Effect */
const matrixLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
document.querySelectorAll('nav ul li a').forEach(item => {
    item.dataset.value = item.innerText;
    item.addEventListener('mouseenter', event => {
        let iterations = 0;
        const interval = setInterval(() => {
            event.target.innerText = event.target.innerText.split("").map((letter, index) => {
                if (index < iterations) return event.target.dataset.value[index];
                return matrixLetters[Math.floor(Math.random() * 26)];
            }).join("");
            if (iterations >= event.target.dataset.value.length) clearInterval(interval);
            iterations += 1 / 3;
        }, 30);
    });
});

/* Launch Sequence (Preloader) */
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const textElement = preloader.querySelector('.text');
    if (preloader && textElement) {
        const messages = ["Initializing Neural Link...", "Loading Assets...", "Access Granted"];
        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            if (msgIndex < messages.length) {
                textElement.innerText = messages[msgIndex];
                msgIndex++;
            } else {
                clearInterval(msgInterval);
                setTimeout(() => preloader.classList.add('loaded'), 500);
            }
        }, 800);
    }
    setTimeout(typeWriter, 500);
    // Failsafe
    setTimeout(() => { if (preloader) preloader.classList.add('loaded'); }, 5000);
});

/* Jetpack Scroll Button */
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
});
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
