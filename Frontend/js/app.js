// MAC AI Healthcare Chatbot - Frontend JavaScript
// Team JARVIS - SIH 2025

class MACHealthcareBot {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.currentSession = null;
        this.authToken = localStorage.getItem('macai_token');
        this.isLoggedIn = !!this.authToken;
        this.messageQueue = [];
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.showLoadingScreen();
        this.setupEventListeners();
        this.setupUI();
        this.hideLoadingScreen();
        
        // Auto-scroll animations
        this.setupScrollAnimations();
        
        // Check if user is logged in
        if (this.isLoggedIn) {
            this.updateUIForLoggedInUser();
        }
    }

    showLoadingScreen() {
        const loading = document.getElementById('loading');
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 2000);
    }

    hideLoadingScreen() {
        document.getElementById('loading').classList.add('hidden');
    }

    setupEventListeners() {
        // Chat functionality
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        const voiceBtn = document.getElementById('voiceBtn');
        const clearChatBtn = document.getElementById('clearChatBtn');
        
        // Login functionality
        const loginBtn = document.getElementById('loginBtn');
        const loginModal = document.getElementById('loginModal');
        const loginForm = document.getElementById('loginForm');
        const closeModal = loginModal.querySelector('.close');
        
        // Hero buttons
        const startChatBtn = document.getElementById('startChatBtn');
        const emergencyBtn = document.getElementById('emergencyBtn');
        
        // Mobile menu
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');

        // Chat Events
        sendBtn.addEventListener('click', () => this.handleSendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        messageInput.addEventListener('input', () => this.handleInputChange());
        
        voiceBtn.addEventListener('click', () => this.handleVoiceInput());
        clearChatBtn.addEventListener('click', () => this.clearChat());

        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.currentTarget.dataset.message;
                this.sendQuickMessage(message);
            });
        });

        // Login Events
        loginBtn.addEventListener('click', () => this.showLoginModal());
        closeModal.addEventListener('click', () => this.hideLoginModal());
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Hero Events
        startChatBtn.addEventListener('click', () => this.scrollToChat());
        emergencyBtn.addEventListener('click', () => this.handleEmergency());
        
        // Mobile menu
        mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        
        // Smooth scroll for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                this.hideLoginModal();
            }
        });
    }

    setupUI() {
        // Initialize character count
        this.updateCharacterCount();
        
        // Add welcome message if first visit
        if (!localStorage.getItem('macai_visited')) {
            localStorage.setItem('macai_visited', 'true');
            this.showWelcomeMessage();
        }
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    }

    // Chat Functionality
    async handleSendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message || this.isProcessing) return;
        
        this.isProcessing = true;
        this.updateSendButton(false);
        
        // Display user message
        this.displayMessage(message, 'user');
        messageInput.value = '';
        this.updateCharacterCount();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to backend API
            const response = await this.sendMessageToAPI(message);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Display bot response
            this.displayMessage(response.content, 'bot', response.metadata);
            
            // Handle special responses (emergency, facility finder, etc.)
            this.handleSpecialResponse(response);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.displayMessage('I apologize, but I\'m experiencing technical difficulties. Please try again or contact emergency services if this is urgent.', 'bot');
        }
        
        this.isProcessing = false;
        this.updateSendButton(true);
    }

    async sendMessageToAPI(message) {
        // Simulate API call for demo purposes
        // In production, this would call your actual backend
        return new Promise((resolve) => {
            setTimeout(() => {
                const response = this.generateBotResponse(message);
                resolve(response);
            }, 1500 + Math.random() * 1000);
        });
    }

    generateBotResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Emergency detection
        if (this.isEmergencyMessage(lowerMessage)) {
            return {
                content: `🚨 <strong>EMERGENCY ALERT ACTIVATED</strong><br><br>
                I've detected this may be a medical emergency. <strong>Immediate actions:</strong><br><br>
                📞 <strong>Call 108 (National Ambulance Service) NOW</strong><br>
                📞 <strong>Call 102 (Emergency Medical Service)</strong><br>
                🏥 <strong>Go to nearest emergency room</strong><br><br>
                <em>Emergency services have been notified of your location.</em><br><br>
                ⚠️ <strong>Do not delay - seek immediate medical help!</strong>`,
                metadata: {
                    urgency: 'critical',
                    type: 'emergency',
                    suggestions: ['Call 108', 'Nearest Hospital', 'Emergency Contacts']
                }
            };
        }

        // Symptom-based responses
        if (lowerMessage.includes('fever') || lowerMessage.includes('temperature') || lowerMessage.includes('bukhar')) {
            return {
                content: `🌡️ <strong>Fever Management Guidance:</strong><br><br>
                <strong>Immediate Care:</strong><br>
                • Monitor temperature every 2-4 hours<br>
                • Stay well-hydrated (water, herbal teas)<br>
                • Rest and avoid strenuous activities<br>
                • Use cool compresses for comfort<br><br>
                <strong>When to Seek Medical Help:</strong><br>
                ⚠️ Temperature above 103°F (39.4°C)<br>
                ⚠️ Fever lasts more than 3 days<br>
                ⚠️ Difficulty breathing or chest pain<br>
                ⚠️ Severe headache or neck stiffness<br><br>
                Would you like me to help you find nearby healthcare facilities or provide more specific guidance?`,
                metadata: {
                    urgency: 'medium',
                    type: 'symptom_advice',
                    suggestions: ['Find Hospital', 'More Symptoms', 'Prevention Tips']
                }
            };
        }

        if (lowerMessage.includes('covid') || lowerMessage.includes('corona')) {
            return {
                content: `🦠 <strong>COVID-19 Information & Guidelines:</strong><br><br>
                <strong>Prevention Measures:</strong><br>
                • Wear well-fitted masks in crowded places<br>
                • Maintain 6-feet distance from others<br>
                • Wash hands frequently with soap (20+ seconds)<br>
                • Use alcohol-based sanitizer (60%+ alcohol)<br>
                • Get vaccinated and boosted<br><br>
                <strong>Key Symptoms to Monitor:</strong><br>
                • Fever, cough, fatigue<br>
                • Loss of taste or smell<br>
                • Shortness of breath<br>
                • Body aches, headache<br><br>
                <strong>Testing & Care:</strong><br>
                • Get tested if symptomatic<br>
                • Isolate if positive<br>
                • Consult healthcare provider for severe symptoms<br><br>
                For testing centers and vaccination info, visit your nearest health center or call your state helpline.`,
                metadata: {
                    urgency: 'low',
                    type: 'health_info',
                    suggestions: ['Find Testing Center', 'Vaccination Info', 'Isolation Guidelines']
                }
            };
        }

        if (lowerMessage.includes('hospital') || lowerMessage.includes('doctor') || lowerMessage.includes('clinic')) {
            return {
                content: `🏥 <strong>Healthcare Facility Finder:</strong><br><br>
                I can help you locate nearby healthcare services:<br><br>
                <strong>Available Services:</strong><br>
                🏥 Government hospitals<br>
                🏥 Private hospitals<br>
                🏥 Primary health centers (PHC)<br>
                🏥 Community health centers (CHC)<br>
                🏥 Specialty clinics<br>
                🚑 Emergency services<br><br>
                <strong>Ayushman Bharat Integration:</strong><br>
                • Empanelled hospitals for cashless treatment<br>
                • Digital health records access<br>
                • Telemedicine services<br><br>
                📍 <strong>To find facilities near you:</strong><br>
                Please share your location, pin code, or city name for accurate results.<br><br>
                <em>All recommended facilities are verified and maintain quality healthcare standards.</em>`,
                metadata: {
                    urgency: 'low',
                    type: 'facility_finder',
                    suggestions: ['Share Location', 'Emergency Services', 'Ayushman Hospitals']
                }
            };
        }

        if (lowerMessage.includes('headache') || lowerMessage.includes('head pain') || lowerMessage.includes('sir dard')) {
            return {
                content: `🧠 <strong>Headache Management:</strong><br><br>
                <strong>Immediate Relief:</strong><br>
                • Rest in a quiet, dark room<br>
                • Apply cold or warm compress to head/neck<br>
                • Stay hydrated - drink plenty of water<br>
                • Gentle neck and shoulder massage<br><br>
                <strong>When to Seek Medical Attention:</strong><br>
                ⚠️ Sudden, severe headache (thunderclap)<br>
                ⚠️ Headache with fever, neck stiffness<br>
                ⚠️ Changes in vision, speech, or coordination<br>
                ⚠️ Headache after head injury<br><br>
                <strong>Common Triggers to Avoid:</strong><br>
                • Dehydration, lack of sleep<br>
                • Stress, bright lights<br>
                • Certain foods (MSG, alcohol)<br>
                • Poor posture<br><br>
                Consider keeping a headache diary to identify your specific triggers.`,
                metadata: {
                    urgency: 'low',
                    type: 'symptom_advice',
                    suggestions: ['Severe Headache?', 'Prevention Tips', 'Find Doctor']
                }
            };
        }

        // Default response
        return {
            content: `Thank you for reaching out to MAC AI Healthcare Assistant. I'm here to help with your health concerns.<br><br>
            <strong>I can assist you with:</strong><br>
            🩺 Symptom analysis and basic medical guidance<br>
            🏥 Finding nearby healthcare facilities<br>
            💊 Disease prevention and health tips<br>
            🚨 Emergency assistance and escalation<br>
            📋 Healthcare service information<br><br>
            Could you please provide more details about your specific health concern? For example:<br>
            • What symptoms are you experiencing?<br>
            • When did they start?<br>
            • How severe are they?<br><br>
            <em>Remember: I provide general guidance, but for serious concerns, please consult with a healthcare professional.</em>`,
            metadata: {
                urgency: 'low',
                type: 'general',
                suggestions: ['Describe Symptoms', 'Find Hospital', 'Health Tips', 'Emergency Help']
            }
        };
    }

    isEmergencyMessage(message) {
        const emergencyKeywords = [
            'emergency', 'urgent', 'critical', 'help me', 'cant breathe', 'chest pain',
            'heart attack', 'stroke', 'unconscious', 'bleeding', 'accident',
            'choking', 'poisoning', 'severe pain', 'difficulty breathing'
        ];
        return emergencyKeywords.some(keyword => message.includes(keyword));
    }

    displayMessage(text, sender, metadata = null) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = text;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString();
        
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        // Add suggestions for bot messages
        if (sender === 'bot' && metadata && metadata.suggestions) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'message-suggestions';
            suggestionsDiv.innerHTML = metadata.suggestions.map(suggestion =>
                `<button class="suggestion-btn" onclick="macBot.sendQuickMessage('${suggestion}')">${suggestion}</button>`
            ).join('');
            contentDiv.appendChild(suggestionsDiv);
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendQuickMessage(message) {
        if (this.isProcessing) return;
        
        const messageInput = document.getElementById('messageInput');
        messageInput.value = message;
        this.handleSendMessage();
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('show');
        
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.remove('show');
    }

    updateSendButton(enabled) {
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = !enabled;
        sendBtn.innerHTML = enabled ? '<i class="fas fa-paper-plane"></i>' : '<i class="fas fa-spinner fa-spin"></i>';
    }

    handleInputChange() {
        this.updateCharacterCount();
        this.autoResizeTextarea();
    }

    updateCharacterCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.querySelector('.char-count');
        if (charCount) {
            charCount.textContent = `${messageInput.value.length}/500`;
        }
    }

    autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    clearChat() {
        const messagesContainer = document.getElementById('chatMessages');
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        
        // Keep only the welcome message
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }
        
        this.currentSession = null;
    }

    // Voice Input (Web Speech API)
    handleVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser. Please type your message.');
            return;
        }

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        const voiceBtn = document.getElementById('voiceBtn');
        
        recognition.lang = 'en-IN'; // Indian English
        recognition.continuous = false;
        recognition.interimResults = false;

        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        voiceBtn.style.background = 'var(--emergency-red)';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('messageInput').value = transcript;
            this.updateCharacterCount();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            alert('Voice input failed. Please try again or type your message.');
        };

        recognition.onend = () => {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.background = 'var(--text-muted)';
        };

        recognition.start();
    }

    // Login & Authentication
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const aadhaarId = formData.get('aadhaarId');
        const phoneNumber = formData.get('phoneNumber');

        // Basic validation
        if (aadhaarId.length !== 12 || !/^\d{12}$/.test(aadhaarId)) {
            alert('Please enter a valid 12-digit Aadhaar number');
            return;
        }

        if (phoneNumber.length !== 10 || !/^[6-9]\d{9}$/.test(phoneNumber)) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        try {
            // Simulate login API call
            const response = await this.loginAPI(aadhaarId, phoneNumber);
            
            if (response.success) {
                this.authToken = response.token;
                localStorage.setItem('macai_token', this.authToken);
                localStorage.setItem('macai_user', JSON.stringify(response.user));
                
                this.isLoggedIn = true;
                this.updateUIForLoggedInUser();
                this.hideLoginModal();
                
                alert('Login successful! You now have access to personalized healthcare services.');
            } else {
                alert('Login failed. Please check your credentials and try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed due to technical issues. Please try again later.');
        }
    }

    async loginAPI(aadhaarId, phoneNumber) {
        // Simulate API call - replace with actual backend call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock successful login
                resolve({
                    success: true,
                    token: 'mock_jwt_token_' + Date.now(),
                    user: {
                        id: 'user_' + Date.now(),
                        name: 'Healthcare User',
                        aadhaarId: aadhaarId,
                        phone: phoneNumber
                    }
                });
            }, 1000);
        });
    }

    updateUIForLoggedInUser() {
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.textContent = 'Profile';
        loginBtn.onclick = () => this.showUserProfile();
    }

    showUserProfile() {
        const user = JSON.parse(localStorage.getItem('macai_user') || '{}');
        alert(`Welcome, ${user.name || 'User'}!\n\nAadhaar: ${user.aadhaarId}\nPhone: ${user.phone}\n\nYou have access to personalized healthcare services.`);
    }

    // Emergency Handling
    async handleEmergency() {
        const confirmed = confirm(
            '🚨 EMERGENCY ALERT 🚨\n\n' +
            'This will immediately alert emergency services.\n\n' +
            'For immediate medical emergencies:\n' +
            '• Call 108 (National Ambulance Service)\n' +
            '• Call 102 (Emergency Medical Service)\n\n' +
            'Do you want to proceed with emergency alert?'
        );

        if (confirmed) {
            this.triggerEmergencyProtocol();
        }
    }

    async triggerEmergencyProtocol() {
        try {
            // Get user location if possible
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.sendEmergencyAlert({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    () => {
                        this.sendEmergencyAlert(null);
                    }
                );
            } else {
                this.sendEmergencyAlert(null);
            }
        } catch (error) {
            console.error('Emergency protocol error:', error);
            alert('Emergency alert system encountered an error. Please call 108 directly.');
        }
    }

    async sendEmergencyAlert(location) {
        // Display emergency message in chat
        this.displayMessage(
            '🚨 Emergency services have been notified. Please call 108 immediately for immediate assistance.',
            'user'
        );

        // Simulate emergency API call
        setTimeout(() => {
            this.displayMessage(
                `🚨 <strong>EMERGENCY ALERT SENT</strong><br><br>
                <strong>Actions Taken:</strong><br>
                ✅ Local emergency services notified<br>
                ✅ Nearby hospitals alerted<br>
                ✅ Your location shared (if available)<br><br>
                <strong>Immediate Steps:</strong><br>
                📞 <strong>Call 108 NOW for ambulance</strong><br>
                📞 Call 102 for emergency medical service<br>
                🏥 Go to nearest emergency room<br><br>
                <strong>Stay calm and seek immediate help!</strong>`,
                'bot',
                { urgency: 'critical', type: 'emergency' }
            );
        }, 1000);
    }

    // UI Helpers
    scrollToChat() {
        const chatSection = document.getElementById('chat');
        chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus on input after scroll
        setTimeout(() => {
            document.getElementById('messageInput').focus();
        }, 800);
    }

    toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('mobile-open');
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.displayMessage(
                '🎉 Welcome to MAC AI Healthcare Platform! I\'m excited to be your health companion. Feel free to ask me anything about your health concerns.',
                'bot'
            );
        }, 3000);
    }

    handleSpecialResponse(response) {
        if (response.metadata) {
            // Handle emergency responses
            if (response.metadata.urgency === 'critical') {
                this.playEmergencySound();
                this.highlightEmergencyInfo();
            }
            
            // Handle facility finder
            if (response.metadata.type === 'facility_finder') {
                this.enableLocationSharing();
            }
        }
    }

    playEmergencySound() {
        // Create audio context for emergency sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
        } catch (error) {
            console.log('Audio not available');
        }
    }

    highlightEmergencyInfo() {
        document.body.style.borderTop = '5px solid var(--emergency-red)';
        setTimeout(() => {
            document.body.style.borderTop = 'none';
        }, 5000);
    }

    enableLocationSharing() {
        if (navigator.geolocation) {
            const shareLocationBtn = document.createElement('button');
            shareLocationBtn.className = 'btn-primary';
            shareLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Share My Location';
            shareLocationBtn.onclick = () => this.shareLocation();
            
            // Add to chat (simplified implementation)
            console.log('Location sharing enabled');
        }
    }

    shareLocation() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.displayMessage(
                    `📍 Location shared: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
                    'user'
                );
                
                // Simulate finding nearby facilities
                setTimeout(() => {
                    this.displayMessage(
                        `🏥 <strong>Nearby Healthcare Facilities:</strong><br><br>
                        <strong>1. Government General Hospital</strong><br>
                        📍 2.5 km away | 🕒 24/7 Emergency<br>
                        📞 080-12345678 | ✅ Ayushman Empanelled<br><br>
                        <strong>2. Primary Health Centre</strong><br>
                        📍 1.8 km away | 🕒 9 AM - 6 PM<br>
                        📞 080-87654321 | ✅ Ayushman Empanelled<br><br>
                        <strong>3. City Medical Centre</strong><br>
                        📍 3.2 km away | 🕒 24/7 Available<br>
                        📞 080-11223344 | ⚡ Emergency Services`,
                        'bot'
                    );
                }, 1500);
            },
            (error) => {
                alert('Location access denied. Please manually enter your location.');
            }
        );
    }
}

// Initialize the application
const macBot = new MACHealthcareBot();

// Add CSS for suggestions (inject into head)
const suggestionStyles = `
<style>
.message-suggestions {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.suggestion-btn {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    color: white;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.suggestion-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
}

.nav-links.mobile-open {
    display: flex !important;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    flex-direction: column;
    padding: 2rem;
    gap: 1rem;
}

@media (max-width: 768px) {
    .nav-links {
        display: none;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', suggestionStyles);

// Export for global access
window.macBot = macBot;