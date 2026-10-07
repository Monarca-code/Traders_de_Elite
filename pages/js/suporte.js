const messages = document.getElementById("messages");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const statusText = document.getElementById("statusText");
const clearChat = document.getElementById("clearChat");

const initialMessage = "Olá! Sou o assistente da Traders de Elite. Posso ajudar com dúvidas sobre a comunidade, formações, inscrições, portal do estudante e funcionamento do site. O que gostaria de saber?";

function addMessage(text, role) {
    const item = document.createElement("div");
    item.className = `message ${role}`;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    item.appendChild(bubble);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
}

function setLoading(loading) {
    sendButton.disabled = loading;
    input.disabled = loading;
    statusText.textContent = loading ? "A preparar resposta..." : "Pronto para ajudar";
}

function resetChat() {
    messages.innerHTML = "";
    addMessage(initialMessage, "bot");
}

async function askAI(question) {
    setLoading(true);
    const typing = addMessage("A escrever...", "bot");
    typing.classList.add("typing");

    try {
        const response = await fetch("/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: question })
        });

        const data = await response.json().catch(() => ({}));
        typing.remove();

        if (!response.ok) {
            throw new Error(data.message || "Não foi possível contactar o suporte.");
        }

        addMessage(data.reply || "Não consegui gerar uma resposta.", "bot");
    } catch (error) {
        typing.remove();
        addMessage(
            "Não foi possível ligar ao assistente neste momento. Tente novamente em instantes.",
            "bot"
        );
        console.error(error);
    } finally {
        setLoading(false);
        input.focus();
    }
}

form.addEventListener("submit", event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question || sendButton.disabled) return;
    addMessage(question, "user");
    input.value = "";
    input.style.height = "auto";
    askAI(question);
});

input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
});

input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

document.querySelectorAll("[data-question]").forEach(button => {
    button.addEventListener("click", () => {
        if (sendButton.disabled) return;
        const question = button.dataset.question;
        addMessage(question, "user");
        askAI(question);
    });
});

clearChat.addEventListener("click", resetChat);
resetChat();
