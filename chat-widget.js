// Chat Widget for WarehouseRide
(function() {
  const API_BASE = 'http://localhost:5000/api';

  const styles = `
    .wr-chat-widget-icon {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #39a7dc, #5dd1ff);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(93, 209, 255, 0.4);
      cursor: pointer;
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 1.8rem;
    }

    .wr-chat-widget-icon:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(93, 209, 255, 0.6);
    }

    .wr-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      max-width: 95vw;
      height: auto;
      max-height: 600px;
      background: linear-gradient(180deg, #112237, #08101f);
      border: 1px solid rgba(93, 209, 255, 0.3);
      border-radius: 1.2rem;
      box-shadow: 0 24px 72px rgba(0, 0, 0, 0.4);
      font-family: 'Inter', system-ui, sans-serif;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s ease;
      opacity: 0;
      visibility: hidden;
      transform: scale(0.8) translateY(50px);
    }

    .wr-chat-widget.active {
      opacity: 1;
      visibility: visible;
      transform: scale(1) translateY(0);
    }

    .wr-chat-header {
      background: linear-gradient(135deg, #39a7dc, #5dd1ff);
      color: #08101f;
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .wr-chat-header h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .wr-chat-close-btn {
      background: none;
      border: none;
      color: #08101f;
      font-size: 1.5rem;
      cursor: pointer;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      transition: background 0.2s ease;
    }

    .wr-chat-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .wr-chat-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .wr-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .wr-chat-message {
      display: flex;
      gap: 0.75rem;
      animation: slideIn 0.3s ease;
    }

    .wr-chat-message.customer {
      justify-content: flex-end;
    }

    .wr-chat-message-content {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.8rem;
      padding: 0.75rem 1rem;
      max-width: 85%;
      word-wrap: break-word;
      color: #f5f7fb;
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .wr-chat-message.customer .wr-chat-message-content {
      background: linear-gradient(135deg, #39a7dc, #5dd1ff);
      color: #08101f;
      border: none;
    }

    .wr-chat-timestamp {
      font-size: 0.75rem;
      color: #9bb3cf;
      margin-top: 0.25rem;
    }

    .wr-chat-input-group {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(8, 16, 31, 0.95);
    }

    .wr-chat-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      color: #f5f7fb;
      font-family: inherit;
      font-size: 0.95rem;
      resize: none;
      max-height: 100px;
    }

    .wr-chat-input::placeholder {
      color: #9bb3cf;
    }

    .wr-chat-input:focus {
      outline: none;
      border-color: #5dd1ff;
      background: rgba(255, 255, 255, 0.08);
    }

    .wr-chat-send {
      background: linear-gradient(135deg, #5dd1ff, #ffe066);
      border: none;
      border-radius: 0.75rem;
      color: #08101f;
      padding: 0.75rem 1.2rem;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.2s ease;
    }

    .wr-chat-send:hover {
      transform: translateY(-2px);
    }

    .wr-chat-login {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .wr-chat-login p {
      color: #9bb3cf;
      margin: 0 0 1rem;
    }

    .wr-chat-login input {
      width: 100%;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: #f5f7fb;
      font-family: inherit;
    }

    .wr-chat-login button {
      background: linear-gradient(135deg, #5dd1ff, #ffe066);
      color: #08101f;
      padding: 0.75rem;
      border: none;
      border-radius: 0.75rem;
      cursor: pointer;
      font-weight: 600;
    }

    .wr-chat-toggle-btn {
      cursor: pointer;
      user-select: none;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 480px) {
      .wr-chat-widget {
        width: calc(100vw - 20px);
        max-height: 70vh;
        bottom: 10px;
        right: 10px;
      }

      .wr-chat-messages {
        padding: 1rem;
      }

      .wr-chat-input-group {
        padding: 0.75rem;
      }
    }
  `;

  const htmlTemplate = `
    <div class="wr-chat-header wr-chat-toggle-btn">
      <h3>💬 WarehouseRide Support</h3>
      <button class="wr-chat-close-btn" onclick="event.stopPropagation()">×</button>
    </div>
    <div class="wr-chat-body">
      <div class="wr-chat-messages" id="chatMessages"></div>
      <div class="wr-chat-login" id="chatLoginForm" style="display: flex;">
        <p>Chat with our support team</p>
        <input type="email" id="chatEmail" placeholder="Your email" />
        <button onclick="window.wrChatWidget.startChat()">Start Chat</button>
      </div>
      <div class="wr-chat-input-group" id="chatInput" style="display: none;">
        <textarea class="wr-chat-input" id="messageInput" placeholder="Type your message..." rows="1"></textarea>
        <button class="wr-chat-send" onclick="window.wrChatWidget.sendMessage()">Send</button>
      </div>
    </div>
  `;

  const iconTemplate = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#08101f" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  window.wrChatWidget = {
    element: null,
    iconElement: null,
    customerId: null,
    isOpen: false,

    init() {
      // Add styles
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);

      // Create chat icon
      this.iconElement = document.createElement('div');
      this.iconElement.className = 'wr-chat-widget-icon';
      this.iconElement.innerHTML = iconTemplate;
      this.iconElement.addEventListener('click', () => this.toggleWidget());
      document.body.appendChild(this.iconElement);

      // Create widget
      this.element = document.createElement('div');
      this.element.className = 'wr-chat-widget';
      this.element.innerHTML = htmlTemplate;
      document.body.appendChild(this.element);

      // Check for existing customer session
      const currentUserRaw = localStorage.getItem('warehouseRideCurrent');
      if (currentUserRaw) {
        try {
          const user = JSON.parse(currentUserRaw);
          if (user?.id) {
            this.customerId = user.id;
            this.showChat();
            this.loadMessages();
          }
        } catch {
          this.customerId = currentUserRaw;
        }
      }

      // Event listeners
      this.element.querySelector('.wr-chat-toggle-btn').addEventListener('click', () => this.toggleWidget());
      this.element.querySelector('.wr-chat-close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeWidget();
      });

      const messageInput = document.getElementById('messageInput');
      messageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    },

    toggleWidget() {
      this.isOpen ? this.closeWidget() : this.openWidget();
    },

    closeWidget() {
      this.isOpen = false;
      this.element.classList.remove('active');
      this.iconElement.style.display = 'flex';
      this.stopPolling();
    },

    openWidget() {
      this.isOpen = true;
      this.element.classList.add('active');
      this.iconElement.style.display = 'none';
      this.startPolling();
    },

    startChat() {
      const email = document.getElementById('chatEmail').value.trim();
      if (!email) {
        alert('Please enter your email');
        return;
      }

      this.customerId = email.toLowerCase();
      localStorage.setItem('warehouseRideChatEmail', this.customerId);
      this.showChat();
      this.loadMessages();
    },

    showChat() {
      document.getElementById('chatLoginForm').style.display = 'none';
      document.getElementById('chatInput').style.display = 'flex';
    },

    hideChat() {
      document.getElementById('chatLoginForm').style.display = 'flex';
      document.getElementById('chatInput').style.display = 'none';
      document.getElementById('chatMessages').innerHTML = '';
    },

    async sendMessage() {
      const messageInput = document.getElementById('messageInput');
      const message = messageInput.value.trim();

      if (!message || !this.customerId) return;

      messageInput.value = '';

      try {
        await fetch(`${API_BASE}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: this.customerId,
            message,
            sender: 'customer',
          }),
        });

        this.addMessage(message, 'customer');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },

    async loadMessages() {
      try {
        const res = await fetch(`${API_BASE}/chat/${this.customerId}`);
        const messages = await res.json();

        const messagesEl = document.getElementById('chatMessages');
        messagesEl.innerHTML = '';

        messages.forEach(msg => {
          this.addMessage(msg.message, msg.sender);
        });

        messagesEl.scrollTop = messagesEl.scrollHeight;
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    },

    startPolling() {
      if (this.pollInterval) clearInterval(this.pollInterval);
      this.pollInterval = setInterval(() => {
        if (this.isOpen && this.customerId) {
          this.pollMessages();
        }
      }, 3000); // Poll every 3 seconds
    },

    stopPolling() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    },

    async pollMessages() {
      try {
        const res = await fetch(`${API_BASE}/chat/${this.customerId}`);
        const messages = await res.json();

        const messagesEl = document.getElementById('chatMessages');
        const currentMessageCount = messagesEl.children.length;

        if (messages.length > currentMessageCount) {
          // New messages arrived
          const newMessages = messages.slice(currentMessageCount);
          newMessages.forEach(msg => {
            this.addMessage(msg.message, msg.sender);
          });
        }
      } catch (error) {
        console.error('Failed to poll messages:', error);
      }
    },

    addMessage(text, sender) {
      const messagesEl = document.getElementById('chatMessages');
      const msgEl = document.createElement('div');
      msgEl.className = `wr-chat-message ${sender}`;

      const contentEl = document.createElement('div');
      contentEl.className = 'wr-chat-message-content';
      contentEl.textContent = text;

      msgEl.appendChild(contentEl);
      messagesEl.appendChild(msgEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    },
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.wrChatWidget.init());
  } else {
    window.wrChatWidget.init();
  }
})();
