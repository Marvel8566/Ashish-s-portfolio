document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ---- contact form ---------------------------------------------------
const CONTACT_EMAIL = "ashishgurav.work@gmail.com";

const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("cfStatus");
const contactSubmit = document.getElementById("cfSubmit");

function setStatus(message, kind) {
  if (!contactStatus) return;
  contactStatus.textContent = message;
  contactStatus.className = "form-status " + (kind || "");
}

function openMailFallback(payload) {
  const body = `From: ${payload.name} (${payload.email})\nSubject: ${payload.subject}\n\n${payload.message}`;
  const mailto =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("[Portfolio] " + payload.subject + " — " + payload.name)}` +
    `&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      subject: contactForm.subject.value,
      message: contactForm.message.value.trim(),
      company: contactForm.company.value, // honeypot, should stay empty
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus("Please fill in your name, email, and message.", "error");
      return;
    }

    contactSubmit.disabled = true;
    contactSubmit.textContent = "Sending…";
    setStatus("", "");

    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("Message sent — I'll get back to you soon.", "success");
        contactForm.reset();
      } else {
        // Server reachable but not configured (or send failed) — fall back
        // to opening the visitor's own email client, pre-filled.
        setStatus("Opening your email client to send this instead…", "success");
        openMailFallback(payload);
      }
    } catch (err) {
      setStatus("Opening your email client to send this instead…", "success");
      openMailFallback(payload);
    } finally {
      contactSubmit.disabled = false;
      contactSubmit.textContent = "Send message";
    }
  });
}

// ---- AI chat widget ---------------------------------------------------
const chatWidget = document.getElementById("chatWidget");
const chatFab = document.getElementById("chatFab");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

let chatHistory = [];
let chatConfigured = true; // optimistic; corrected on first failed call

if (chatFab && chatWidget) {
  chatFab.addEventListener("click", () => {
    const isOpen = chatWidget.classList.toggle("open");
    chatFab.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) setTimeout(() => chatInput && chatInput.focus(), 150);
  });
}

function addChatBubble(text, role) {
  const div = document.createElement("div");
  div.className = "chat-msg chat-msg-" + role;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const div = document.createElement("div");
  div.className = "chat-msg-typing";
  div.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || !chatConfigured) return;

    addChatBubble(text, "user");
    chatHistory.push({ role: "user", content: text });
    chatInput.value = "";

    const typing = addTypingIndicator();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory.slice(-8) }),
      });
      const data = await res.json();
      typing.remove();

      if (res.ok && data.ok) {
        addChatBubble(data.reply, "assistant");
        chatHistory.push({ role: "assistant", content: data.reply });
      } else if (data.error === "not_configured") {
        chatConfigured = false;
        addChatBubble(
          "This assistant isn't switched on yet — reach out through the contact form below instead.",
          "error"
        );
      } else if (data.error === "rate_limited") {
        addChatBubble("That's a lot of questions! Please try again in a bit.", "error");
      } else {
        addChatBubble("Something went wrong on my end — try again, or use the contact form below.", "error");
      }
    } catch (err) {
      typing.remove();
      addChatBubble("Couldn't reach the server — check your connection and try again.", "error");
    }
  });
}

// ---- project image sliders --------------------------------------------
// Auto-advance every few seconds. Hovering (or focusing) a slider jumps to
// the next image immediately and cycles faster while the pointer is on it.
// Dots, swipe (touch) and tap also change the image. Sliders pause when
// off-screen or the tab is hidden, and autoplay is disabled for users who
// prefer reduced motion.
(function () {
  const sliders = document.querySelectorAll("[data-slider]");
  if (!sliders.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const IDLE_MS = 4200;
  const HOVER_MS = 1600;

  sliders.forEach((root, idx) => {
    const slides = Array.from(root.querySelectorAll(".slide"));
    const dots = Array.from(root.querySelectorAll(".dot"));
    const counter = root.querySelector("[data-current]");
    const bar = root.querySelector(".slider-bar");
    if (slides.length < 2) return;

    let current = 0;
    let timer = null;
    let hovering = false;
    let visible = true;

    function show(n) {
      current = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
      if (counter) counter.textContent = String(current + 1);
    }

    function restartBar(ms) {
      if (!bar) return;
      bar.classList.remove("run");
      void bar.offsetWidth; // restart CSS animation
      bar.style.setProperty("--slide-ms", ms + "ms");
      if (!reduceMotion) bar.classList.add("run");
    }

    function schedule() {
      clearTimeout(timer);
      if (reduceMotion || !visible || document.hidden) {
        if (bar) bar.classList.remove("run");
        return;
      }
      const ms = hovering ? HOVER_MS : IDLE_MS;
      restartBar(ms);
      timer = setTimeout(() => {
        show(current + 1);
        schedule();
      }, ms);
    }

    // hover: change right away, then keep cycling faster
    root.addEventListener("mouseenter", () => {
      hovering = true;
      show(current + 1);
      schedule();
    });
    root.addEventListener("mouseleave", () => {
      hovering = false;
      schedule();
    });

    // keyboard users: cycle while a dot is focused, arrows to navigate
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { show(current + 1); schedule(); }
      if (e.key === "ArrowLeft") { show(current - 1); schedule(); }
    });

    dots.forEach((d, i) => {
      d.addEventListener("click", (e) => {
        e.stopPropagation();
        show(i);
        schedule();
      });
    });

    // touch: swipe left/right, tap to advance
    let startX = null;
    let startY = null;
    root.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
        show(current + (dx < 0 ? 1 : -1));
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && !e.target.closest(".dot")) {
        show(current + 1);
      }
      startX = startY = null;
      schedule();
    });

    // pause when off-screen / tab hidden; stagger first start per card
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.25 }).observe(root);
    }
    document.addEventListener("visibilitychange", schedule);

    setTimeout(schedule, idx * 700);
  });
})();
