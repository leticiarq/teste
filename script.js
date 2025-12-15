const chatOutput = document.getElementById("chat-output");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Novos elementos da tela de boas-vindas
const welcomeScreen = document.getElementById("welcome-screen");
const chatApp = document.getElementById("chat-app");
const accessChatbotBtn = document.getElementById("access-chatbot-btn");
const regulationsBtn = document.getElementById("regulations-btn");
const contactBtn = document.getElementById("contact-btn");

// NOVO ELEMENTO
const backToWelcomeBtn = document.getElementById("back-to-welcome-btn"); 

const cbmpeFlow = [
  {
    id: "welcome",
    question: "👋 Olá! Bem-vindo ao atendimento do CBMPE. Qual é o nome da sua empresa?",
    type: "text",
    validation: (input) => input.trim().length > 2
  },
  {
    id: "cnpj",
    question: "Informe o CNPJ da empresa (somente números):",
    type: "text",
    validation: (input) => /^\d{14}$/.test(input.replace(/\D/g, ""))
  },
  {
    id: "servico",
    question: "Você deseja solicitar o **AVCB** ou **regularização preventiva**?",
    type: "choice",
    options: ["Solicitar AVCB", "Regularização Preventiva"]
  },
  {
    id: "end",
    question: "✅ Obrigado! Concluímos sua identificação. Estou pronto para te ajudar com as instruções ou dúvidas sobre o serviço escolhido. Digite sua dúvida ou a palavra 'Instruções' para continuar.",
  }
];

let step = 0;
let userResponses = {};
let isChattingFree = false; 

// --- Funções de Transição de Tela ---

function showChatbot() {
  welcomeScreen.classList.remove("active");
  welcomeScreen.classList.add("hidden");
  chatApp.classList.add("active");
  chatApp.classList.remove("hidden");
  // Inicia o fluxo do chatbot após a transição
  nextQuestion(); 
}

// NOVA FUNÇÃO PARA VOLTAR
function showWelcomeScreen() {
  chatApp.classList.remove("active");
  chatApp.classList.add("hidden");
  welcomeScreen.classList.add("active");
  welcomeScreen.classList.remove("hidden");
  
  // Resetar o estado do Chatbot
  step = 0;
  userResponses = {};
  isChattingFree = false;
  chatOutput.innerHTML = ""; // Limpa o histórico de mensagens
  chatInput.value = "";
}


function showMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender;
  msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
  chatOutput.appendChild(msg);
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function nextQuestion() {
  const current = cbmpeFlow[step];
  if (!current) return;
  showMessage(current.question);
}

async function sendToServer(finalMessage) {
  showMessage("🤖 O assistente está preparando a resposta...", "bot");
  
  
  
  try {
    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: finalMessage })
    });
    
    // Remove a mensagem de 'preparando'
    chatOutput.lastChild.remove(); 
    
    const data = await response.json();
    
    if (response.ok) {
        showMessage(data.reply);
    } else {
        showMessage(`⚠️ Erro ao conectar com a IA: ${data.reply || "Falha ao receber resposta do servidor."}`);
    }

  } catch (error) {
    chatOutput.lastChild.remove();
    showMessage("⚠️ Erro de rede: Não foi possível conectar ao backend (http://localhost:3000).");
  }
}

// --- Event Listeners para a nova tela ---

accessChatbotBtn.addEventListener("click", showChatbot);

// NOVO LISTENER PARA VOLTAR
backToWelcomeBtn.addEventListener("click", showWelcomeScreen);


regulationsBtn.addEventListener("click", () => {
    alert("Aqui você seria redirecionado para a página de Regulamentações (Normas Técnicas, Decretos Estaduais, etc.) do CBMPE sobre AVCB.");
});

contactBtn.addEventListener("click", () => {
    alert("Aqui você seria redirecionado para a página de contato do CBMPE.");
});

// --- Lógica de Envio do Chat (inalterada) ---

sendBtn.addEventListener("click", () => {
  const input = chatInput.value.trim();

  if (!input) return;

  // 1. Lógica para CHAT LIVRE (após o fluxo)
  if (isChattingFree) {
    showMessage(input, "user");
    chatInput.value = "";
    sendToServer(input);
    return;
  }
  
  // 2. Lógica de FLUXO (inicial)
  const current = cbmpeFlow[step];

  if (!current) return;

  // Validação
  if (current.validation && !current.validation(input)) {
    showMessage("⚠️ Resposta inválida. Tente novamente.", "bot");
    return;
  }

  // Exibir a resposta do usuário
  showMessage(input, "user");
  chatInput.value = "";
  
  // Armazenar a resposta
  userResponses[current.id] = input;

  // Se for o último passo (end), enviar contexto completo para a IA e ativar o CHAT LIVRE.
  if (current.id === "end") {
    
    // Montar a mensagem final
    const fullContext = `Contexto da Empresa:\nNome: ${userResponses.welcome}\nCNPJ: ${userResponses.cnpj}\nServiço Desejado: ${userResponses.servico}\n\nPergunta do Usuário (passo final): ${input}`;
    
    sendToServer(fullContext);
    
    isChattingFree = true; 
    step = cbmpeFlow.length; 
    return;
  }

  // Passar para a próxima pergunta
  step++;
  setTimeout(nextQuestion, 600);
});

// Enviar mensagem ao pressionar ENTER
chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    sendBtn.click();
  }
});