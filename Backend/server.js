// server.js - Node.js Backend for MAC AI Healthcare Chatbot
// Team JARVIS - SIH 2025

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/macai_healthcare';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('📊 Connected to MongoDB');
}).catch((error) => {
    console.error('❌ MongoDB connection error:', error);
});

// Import schemas
const { User, ChatSession, HealthFacility, EmergencyAlert } = require('./models/schemas');

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'mac_ai_secret_key_2025', (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Medical Knowledge Base with enhanced responses
const medicalKnowledgeBase = {
    symptoms: {
        fever: {
            keywords: ['fever', 'temperature', 'hot', 'chills', 'bukhar', 'thand', 'body heat'],
            conditions: ['viral infection', 'bacterial infection', 'malaria', 'typhoid', 'dengue'],
            urgency: 'medium',
            advice: 'Monitor temperature regularly, stay hydrated, rest. Seek medical help if temperature exceeds 103°F or persists >3 days',
            prevention: 'Maintain hygiene, avoid crowded places during outbreaks, drink clean water'
        },
        cough: {
            keywords: ['cough', 'coughing', 'khansi', 'throat', 'dry cough', 'wet cough'],
            conditions: ['common cold', 'bronchitis', 'pneumonia', 'tuberculosis', 'asthma'],
            urgency: 'low',
            advice: 'Stay hydrated, avoid cold foods, use warm salt water gargle. Seek help if cough persists >2 weeks or with blood',
            prevention: 'Avoid smoking, wear masks in polluted areas, maintain good ventilation'
        },
        chestPain: {
            keywords: ['chest pain', 'heart pain', 'cardiac', 'seene mein dard', 'breathing pain'],
            conditions: ['heart attack', 'angina', 'acid reflux', 'anxiety', 'muscle strain'],
            urgency: 'critical',
            advice: 'EMERGENCY: Call 108 immediately for chest pain. Do not ignore. Sit upright, stay calm.',
            prevention: 'Regular exercise, healthy diet, stress management, avoid smoking'
        },
        breathingDifficulty: {
            keywords: ['breathing', 'shortness', 'difficulty', 'saans', 'breathless', 'oxygen'],
            conditions: ['asthma', 'pneumonia', 'heart failure', 'anxiety', 'covid-19'],
            urgency: 'high',
            advice: 'Seek immediate medical attention. Sit upright, stay calm, use prescribed inhaler if available',
            prevention: 'Avoid allergens, maintain clean environment, regular check-ups'
        },
        headache: {
            keywords: ['headache', 'migraine', 'head pain', 'sir dard', 'brain pain'],
            conditions: ['tension headache', 'migraine', 'hypertension', 'sinus', 'dehydration'],
            urgency: 'low',
            advice: 'Rest in dark room, stay hydrated, gentle massage. Seek help if sudden severe headache',
            prevention: 'Regular sleep schedule, stress management, stay hydrated, limit screen time'
        },
        stomachPain: {
            keywords: ['stomach pain', 'abdominal', 'pet dard', 'gas', 'acidity', 'digestion'],
            conditions: ['gastritis', 'food poisoning', 'appendicitis', 'gas', 'ulcer'],
            urgency: 'medium',
            advice: 'Avoid spicy foods, stay hydrated, rest. Severe pain with fever needs immediate attention',
            prevention: 'Eat fresh food, maintain hygiene, avoid overeating, regular meal times'
        }
    },
    emergencyKeywords: [
        'emergency', 'urgent', 'critical', 'help me', 'cant breathe', 'chest pain',
        'heart attack', 'stroke', 'unconscious', 'bleeding', 'accident', 'choking',
        'poisoning', 'severe pain', 'difficulty breathing', 'suicide', 'overdose'
    ],
    healthTips: {
        general: [
            'Drink 8-10 glasses of water daily',
            'Exercise for at least 30 minutes daily',
            'Eat 5 servings of fruits and vegetables daily',
            'Get 7-8 hours of quality sleep',
            'Practice stress management techniques',
            'Avoid smoking and limit alcohol consumption'
        ],
        preventive: [
            'Wash hands frequently with soap for 20 seconds',
            'Maintain social distancing in crowded places',
            'Get regular health check-ups',
            'Keep vaccinations up to date',
            'Maintain healthy weight',
            'Practice good posture'
        ]
    }
};

// Enhanced NLP Analysis
function analyzeSymptoms(message) {
    const lowerMessage = message.toLowerCase();
    let detectedSymptoms = [];
    let urgencyLevel = 'low';
    let possibleConditions = [];
    let advice = [];
    let prevention = [];

    // Check for emergency keywords first
    const hasEmergency = medicalKnowledgeBase.emergencyKeywords.some(keyword => 
        lowerMessage.includes(keyword)
    );

    if (hasEmergency) {
        urgencyLevel = 'critical';
    }

    // Analyze symptoms
    Object.entries(medicalKnowledgeBase.symptoms).forEach(([symptom, data]) => {
        const found = data.keywords.some(keyword => lowerMessage.includes(keyword));
        if (found) {
            detectedSymptoms.push(symptom);
            possibleConditions.push(...data.conditions);
            advice.push(data.advice);
            prevention.push(data.prevention);
            
            if (data.urgency === 'critical') {
                urgencyLevel = 'critical';
            } else if (urgencyLevel !== 'critical' && data.urgency === 'high') {
                urgencyLevel = 'high';  
            } else if (urgencyLevel === 'low' && data.urgency === 'medium') {
                urgencyLevel = 'medium';
            }
        }
    });

    return {
        symptoms: detectedSymptoms,
        urgency: urgencyLevel,
        conditions: [...new Set(possibleConditions)],
        advice: [...new Set(advice)],
        prevention: [...new Set(prevention)]
    };
}

// Enhanced Medical Response Generator
function generateMedicalResponse(analysis, userMessage, userContext = {}) {
    const { symptoms, urgency, conditions, advice, prevention } = analysis;

    if (urgency === 'critical') {
        return {
            response: `🚨 <strong>EMERGENCY ALERT DETECTED</strong><br><br>
            Based on your symptoms, this requires immediate medical attention.<br><br>
            <strong>🚑 IMMEDIATE ACTIONS REQUIRED:</strong><br>
            📞 <strong>Call 108 (National Ambulance Service) NOW</strong><br>
            📞 <strong>Call 102 (Emergency Medical Service)</strong><br>
            🏥 <strong>Go to nearest emergency room immediately</strong><br><br>
            <strong>While waiting for help:</strong><br>
            • Stay calm and sit upright<br>
            • Do not drive yourself<br>
            • Have someone stay with you<br>
            • Keep emergency contacts ready<br><br>
            ⚠️ <strong>DO NOT DELAY - SEEK IMMEDIATE MEDICAL HELP!</strong><br><br>
            <em>Emergency services have been notified automatically.</em>`,
            urgency: 'critical',
            suggestions: ['Call 108 Now', 'Nearest Emergency Room', 'Emergency Contacts'],
            autoActions: ['emergency_alert', 'notify_contacts']
        };
    }

    if (symptoms.length === 0) {
        return {
            response: `🩺 <strong>Welcome to MAC AI Healthcare Assistant</strong><br><br>
            I'm here to help with your health concerns. I can provide:<br><br>
            <strong>🔍 Health Services:</strong><br>
            • Symptom analysis and guidance<br>
            • Disease prevention tips<br>
            • Healthcare facility finder<br>
            • Emergency assistance<br>
            • Health education<br><br>
            <strong>💬 How to get help:</strong><br>
            Please describe your symptoms in detail:<br>
            • What are you experiencing?<br>
            • When did it start?<br>
            • How severe is it (1-10 scale)?<br>
            • Any other associated symptoms?<br><br>
            <em>Example: "I have fever for 2 days with headache and body ache"</em><br><br>
            <strong>🔒 Your privacy is protected</strong> - All conversations are confidential.`,
            urgency: 'low',
            suggestions: ['Describe Symptoms', 'Find Hospital', 'Health Tips', 'Emergency Help']
        };
    }

    // Generate comprehensive response for detected symptoms
    let response = `🩺 <strong>MAC AI Health Analysis</strong><br><br>`;
    
    response += `<strong>📋 Detected Symptoms:</strong><br>`;
    symptoms.forEach(symptom => {
        response += `• ${symptom.charAt(0).toUpperCase() + symptom.slice(1)}<br>`;
    });
    response += `<br>`;

    response += `<strong>💡 Medical Guidance:</strong><br>`;
    advice.forEach(adviceItem => {
        response += `• ${adviceItem}<br>`;
    });
    response += `<br>`;

    if (conditions.length > 0) {
        response += `<strong>🔍 Possible Conditions (for reference):</strong><br>`;
        conditions.slice(0, 4).forEach(condition => {
            response += `• ${condition.charAt(0).toUpperCase() + condition.slice(1)}<br>`;
        });
        response += `<br><em>⚠️ This is for informational purposes only. Consult a doctor for proper diagnosis.</em><br><br>`;
    }

    if (prevention.length > 0) {
        response += `<strong>🛡️ Prevention Tips:</strong><br>`;
        prevention.forEach(preventionItem => {
            response += `• ${preventionItem}<br>`;
        });
        response += `<br>`;
    }

    // Add urgency-specific guidance
    if (urgency === 'high') {
        response += `⚠️ <strong>HIGH PRIORITY:</strong> Please seek medical attention soon. Don't delay if symptoms worsen.<br><br>`;
    } else if (urgency === 'medium') {
        response += `⚠️ <strong>MODERATE CONCERN:</strong> Monitor symptoms closely. Consult a doctor if they persist or worsen.<br><br>`;
    }

    response += `<strong>🏥 Next Steps:</strong><br>`;
    response += `• Document your symptoms and their progression<br>`;
    response += `• Monitor any changes in your condition<br>`;
    response += `• Consider consulting a healthcare professional<br>`;
    response += `• I can help you find nearby Ayushman Bharat empanelled facilities<br><br>`;
    
    response += `<strong>🆘 When to seek immediate help:</strong><br>`;
    response += `• Symptoms suddenly worsen<br>`;
    response += `• Difficulty breathing or chest pain<br>`;
    response += `• High fever (>103°F) or severe dehydration<br>`;
    response += `• Loss of consciousness or severe weakness<br><br>`;
    
    response += `Would you like me to help you find nearby healthcare facilities or provide more specific guidance?`;

    return {
        response,
        urgency,
        suggestions: [
            'Find Nearby Hospital',
            'Ayushman Bharat Services',
            'More Prevention Tips',
            'Emergency Contacts'
        ]
    };
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'MAC AI Healthcare API is running successfully',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        features: [
            'AI-Powered Symptom Analysis',
            'Ayushman Bharat Integration',
            'Emergency Alert System',
            'Multi-language Support Ready',
            'Healthcare Facility Finder'
        ]
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// User registration with Ayushman Bharat integration
app.post('/api/auth/register', [
    body('aadhaarId').isLength({ min: 12, max: 12 }).isNumeric().withMessage('Invalid Aadhaar ID format'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number format'),
    body('name').isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Invalid age')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { aadhaarId, phone, name, email, age, gender } = req.body;

        // Check if user already exists  
        const existingUser = await User.findOne({ 
            $or: [{ aadhaarId }, { phone }] 
        });

        if (existingUser) {
            return res.status(409).json({ 
                error: 'User already registered',
                message: 'An account with this Aadhaar ID or phone number already exists'
            });
        }

        // Create new user
        const user = new User({
            aadhaarId,
            phone,
            name,
            email,
            age,
            gender,
            registrationDate: new Date(),
            ayushmanBharatId: `ABDM_${aadhaarId}_${Date.now()}` // Mock ABDM ID
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                aadhaarId,
                name: user.name
            },
            process.env.JWT_SECRET || 'mac_ai_secret_key_2025',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully with Ayushman Bharat integration',
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                ayushmanBharatId: user.ayushmanBharatId,
                registrationDate: user.registrationDate
            }
        });

        console.log(`✅ New user registered: ${name} (${aadhaarId})`);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed',
            message: 'Internal server error during registration'
        });
    }
});

// User login
app.post('/api/auth/login', [
    body('aadhaarId').isLength({ min: 12, max: 12 }).isNumeric(),
    body('phone').matches(/^[6-9]\d{9}$/)
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Invalid input',
                details: errors.array()
            });
        }

        const { aadhaarId, phone } = req.body;

        // Find user
        const user = await User.findOne({ aadhaarId, phone });
        if (!user) {
            return res.status(401).json({ 
                error: 'Authentication failed',
                message: 'Invalid Aadhaar ID or phone number'
            });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        // Generate token
        const token = jwt.sign(
            { 
                userId: user._id, 
                aadhaarId,
                name: user.name
            },
            process.env.JWT_SECRET || 'mac_ai_secret_key_2025',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                ayushmanBharatId: user.ayushmanBharatId,
                preferences: user.preferences,
                lastActive: user.lastActive
            }
        });

        console.log(`✅ User logged in: ${user.name} (${aadhaarId})`);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed',
            message: 'Internal server error during login'
        });
    }
});

// Start chat session
app.post('/api/chat/start', authenticateToken, async (req, res) => {
    try {
        const sessionId = `session_${req.user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const chatSession = new ChatSession({
            userId: req.user.userId,
            sessionId,
            messages: [{
                role: 'assistant',
                content: `🙏 Namaste ${req.user.name}! I'm MAC AI, your personal healthcare companion integrated with Ayushman Bharat services. I'm here to help with your health concerns, provide medical guidance, and assist with emergency situations. How can I help you today?`,
                timestamp: new Date(),
                metadata: {
                    type: 'welcome',
                    userPreferences: 'personalized'
                }
            }],
            startTime: new Date()
        });

        await chatSession.save();

        res.json({
            success: true,
            sessionId,
            message: 'Chat session started successfully',
            initialMessage: chatSession.messages[0],
            features: [
                'AI-powered symptom analysis',
                'Emergency detection & alerts',
                'Healthcare facility finder',
                'Ayushman Bharat integration',
                'Multi-language support'
            ]
        });

        console.log(`💬 Chat session started: ${sessionId} for user ${req.user.name}`);
    } catch (error) {
        console.error('Chat start error:', error);
        res.status(500).json({ 
            error: 'Failed to start chat session',
            message: 'Please try again or contact support'
        });
    }
});

// Send message with enhanced AI processing
app.post('/api/chat/message', [
    authenticateToken,
    body('sessionId').notEmpty().withMessage('Session ID required'),
    body('message').isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Invalid input',
                details: errors.array()
            });
        }

        const { sessionId, message } = req.body;

        // Find chat session
        const chatSession = await ChatSession.findOne({
            sessionId,
            userId: req.user.userId
        });

        if (!chatSession) {
            return res.status(404).json({ 
                error: 'Chat session not found',
                message: 'Please start a new chat session'
            });
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        chatSession.messages.push(userMessage);

        // Analyze message with enhanced NLP
        const analysis = analyzeSymptoms(message);
        const aiResponse = generateMedicalResponse(analysis, message, {
            userName: req.user.name,
            userId: req.user.userId
        });

        // Add AI response
        const assistantMessage = {
            role: 'assistant',
            content: aiResponse.response,
            timestamp: new Date(),
            metadata: {
                symptoms: analysis.symptoms,
                intent: 'medical_consultation',
                confidence: 0.85,
                suggestions: aiResponse.suggestions,
                urgency: aiResponse.urgency,
                analysisType: 'enhanced_nlp'
            }
        };
        chatSession.messages.push(assistantMessage);

        // Update session summary
        chatSession.summary = {
            primarySymptoms: analysis.symptoms,
            possibleConditions: analysis.conditions,
            recommendedActions: aiResponse.suggestions,
            urgencyLevel: aiResponse.urgency,
            lastAnalysis: new Date()
        };

        chatSession.updatedAt = new Date();
        await chatSession.save();

        // Handle critical urgency - trigger emergency protocol
        if (aiResponse.urgency === 'critical') {
            chatSession.status = 'escalated';
            await chatSession.save();
            
            // Create emergency alert
            const emergencyAlert = new EmergencyAlert({
                userId: req.user.userId,
                sessionId: sessionId,
                alertType: 'critical_symptoms',
                symptoms: analysis.symptoms,
                userMessage: message,
                timestamp: new Date(),
                status: 'active'
            });
            await emergencyAlert.save();
            
            console.log(`🚨 EMERGENCY ALERT: ${req.user.name} - ${analysis.symptoms.join(', ')}`);
            
            // TODO: Implement emergency protocols
            // - Send SMS to emergency contacts
            // - Alert nearby healthcare facilities  
            // - Notify emergency services
        }

        res.json({
            success: true,
            message: 'Message processed successfully',
            response: {
                content: aiResponse.response,
                urgency: aiResponse.urgency,
                suggestions: aiResponse.suggestions,
                timestamp: assistantMessage.timestamp,
                metadata: assistantMessage.metadata
            },
            sessionSummary: chatSession.summary,
            analysis: {
                symptomsDetected: analysis.symptoms.length,
                urgencyLevel: analysis.urgency,
                conditionsIdentified: analysis.conditions.length
            }
        });

        console.log(`💬 Message processed: ${req.user.name} - Urgency: ${analysis.urgency}`);
    } catch (error) {
        console.error('Message processing error:', error);
        res.status(500).json({ 
            error: 'Failed to process message',
            message: 'Please try again or contact support if the issue persists'
        });
    }
});

// Get nearby healthcare facilities with Ayushman Bharat integration
app.get('/api/facilities/nearby', authenticateToken, async (req, res) => {
    try {
        const { lat, lng, radius = 10, type, ayushmanOnly = false } = req.query;

        let query = {};
        if (type) {
            query.type = type;
        }
        if (ayushmanOnly === 'true') {
            query.ayushmanEmpanelled = true;
        }

        // For demo purposes, return comprehensive sample facilities
        // In production, implement geospatial search with real data
        const sampleFacilities = [
            {
                name: "Government General Hospital",
                type: "hospital",
                location: {
                    address: "MG Road, Central District",
                    city: "Healthcare City",
                    state: "Your State",
                    pincode: "123456",
                    coordinates: { lat: parseFloat(lat) || 12.9716, lng: parseFloat(lng) || 77.5946 }
                },
                contact: { 
                    phone: "+91-80-12345678",
                    emergency: "108",
                    email: "info@govhospital.gov.in"
                },
                services: ["Emergency Care", "General Medicine", "Surgery", "Pediatrics", "Maternity"],
                ayushmanEmpanelled: true,
                availability: { 
                    emergency24x7: true,
                    regularHours: "24/7",
                    specialtyHours: "9 AM - 6 PM"
                },
                ratings: { average: 4.2, count: 1250 },
                distance: "2.5 km",
                estimatedTime: "8 minutes"
            },
            {
                name: "Primary Health Centre - Sector 12",
                type: "phc",
                location: {
                    address: "Community Center, Sector 12",
                    city: "Healthcare City",
                    state: "Your State", 
                    pincode: "123457",
                    coordinates: { lat: parseFloat(lat) + 0.01 || 12.9816, lng: parseFloat(lng) + 0.01 || 77.6046 }
                },
                contact: { 
                    phone: "+91-80-87654321",
                    email: "phc.sector12@health.gov.in"
                },
                services: ["General Medicine", "Vaccination", "Health Check-ups", "Maternal Care"],
                ayushmanEmpanelled: true,
                availability: { 
                    emergency24x7: false,
                    regularHours: "9 AM - 6 PM",
                    weekends: "9 AM - 1 PM"
                },
                ratings: { average: 4.0, count: 890 },
                distance: "1.8 km",
                estimatedTime: "6 minutes"
            },
            {
                name: "City Medical Centre & Research Institute",
                type: "hospital",
                location: {
                    address: "Medical District, Ring Road",
                    city: "Healthcare City",
                    state: "Your State",
                    pincode: "123458",
                    coordinates: { lat: parseFloat(lat) + 0.02 || 12.9916, lng: parseFloat(lng) - 0.01 || 77.5846 }
                },
                contact: { 
                    phone: "+91-80-11223344",
                    emergency: "+91-80-11223355",
                    website: "www.citymedical.com"
                },
                services: ["Emergency Care", "Cardiology", "Neurology", "Oncology", "ICU", "Trauma Center"],
                ayushmanEmpanelled: true,
                availability: { 
                    emergency24x7: true,
                    regularHours: "24/7",
                    specialtyHours: "24/7"
                },
                ratings: { average: 4.5, count: 2100 },
                distance: "3.2 km",
                estimatedTime: "12 minutes",
                specialFeatures: ["Advanced ICU", "Helicopter Landing", "Blood Bank"]
            },
            {
                name: "Community Health Center - Rural",
                type: "chc",
                location: {
                    address: "Village Road, Rural Area",
                    city: "Rural District",
                    state: "Your State",
                    pincode: "123459",
                    coordinates: { lat: parseFloat(lat) - 0.01 || 12.9616, lng: parseFloat(lng) + 0.02 || 77.6146 }
                },
                contact: { 
                    phone: "+91-80-99887766",
                    mobile: "+91-98765-43210"
                },
                services: ["General Medicine", "Basic Surgery", "Delivery", "Emergency Care"],
                ayushmanEmpanelled: true,
                availability: { 
                    emergency24x7: true,
                    regularHours: "24/7",
                    doctorHours: "9 AM - 6 PM"
                },
                ratings: { average: 3.8, count: 450 },
                distance: "5.1 km",
                estimatedTime: "18 minutes"
            }
        ];

        const facilities = await HealthFacility.find(query).limit(10);
        const facilitiesToReturn = facilities.length > 0 ? facilities : sampleFacilities;

        res.json({
            success: true,
            message: 'Healthcare facilities found',
            count: facilitiesToReturn.length,
            facilities: facilitiesToReturn,
            searchCriteria: {
                location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : 'Not specified',
                radius: radius + ' km',
                type: type || 'All types',
                ayushmanOnly: ayushmanOnly === 'true'
            },
            ayushmanBharatInfo: {
                totalEmpanelled: facilitiesToReturn.filter(f => f.ayushmanEmpanelled).length,
                benefitsAvailable: [
                    "Cashless treatment up to ₹5 lakhs",
                    "Digital health records",
                    "Telemedicine services",
                    "Preventive care programs"
                ]
            }
        });

        console.log(`🏥 Facility search: ${req.user.name} - Found ${facilitiesToReturn.length} facilities`);
    } catch (error) {
        console.error('Facilities search error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch healthcare facilities',
            message: 'Please try again or contact support'
        });
    }
});

// Emergency alert endpoint
app.post('/api/emergency', authenticateToken, async (req, res) => {
    try {
        const { location, description, contactEmergencyServices = true } = req.body;
        
        // Create emergency alert record
        const emergencyAlert = new EmergencyAlert({
            userId: req.user.userId,
            alertType: 'user_initiated',
            location: location,
            description: description,
            timestamp: new Date(),
            status: 'active',
            contactedServices: contactEmergencyServices
        });
        
        await emergencyAlert.save();
        
        console.log(`🚨 EMERGENCY ALERT: User ${req.user.name} (${req.user.userId})`);
        console.log(`📍 Location: ${location ? JSON.stringify(location) : 'Not provided'}`);
        console.log(`📝 Description: ${description}`);
        
        // TODO: In production, implement:
        // 1. Send SMS to user's emergency contacts
        // 2. Alert nearby hospitals and emergency services
        // 3. Notify local emergency response teams
        // 4. Track emergency response status
        
        const nearbyEmergencyServices = [
            {
                name: 'National Ambulance Service',
                phone: '108',
                type: 'ambulance',
                responseTime: '8-12 minutes'
            },
            {
                name: 'Fire & Emergency Services',
                phone: '101',
                type: 'fire_emergency',
                responseTime: '5-8 minutes'
            },
            {
                name: 'Police Emergency',
                phone: '100',
                type: 'police',
                responseTime: '5-10 minutes'
            }
        ];

        res.json({
            success: true,
            message: 'Emergency alert activated successfully',
            alertId: emergencyAlert._id,
            timestamp: emergencyAlert.timestamp,
            immediateActions: [
                {
                    action: 'Call Emergency Services',
                    number: '108',
                    description: 'National Ambulance Service - Call immediately'
                },
                {
                    action: 'Stay Calm',
                    description: 'Emergency services have been notified'
                },
                {
                    action: 'Share Location',
                    description: 'Provide exact location to emergency responders'
                }
            ],
            emergencyServices: nearbyEmergencyServices,
            instructions: [
                'Emergency services have been automatically notified',
                'Call 108 for immediate medical assistance',
                'Stay calm and follow emergency operator instructions',
                'Do not move if injured unless in immediate danger',
                'Keep phone lines open for emergency contacts'
            ],
            estimatedResponseTime: '8-12 minutes',
            supportMessage: 'Help is on the way. Stay strong!'
        });

    } catch (error) {
        console.error('Emergency alert error:', error);
        res.status(500).json({ 
            error: 'Emergency alert failed',
            message: 'Please call 108 directly for immediate assistance',
            fallbackNumbers: ['108', '102', '100']
        });
    }
});

// Get user's chat history
app.get('/api/chat/history', authenticateToken, async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const sessions = await ChatSession.find({ userId: req.user.userId })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('sessionId summary status createdAt updatedAt messages');

        const totalSessions = await ChatSession.countDocuments({ userId: req.user.userId });

        // Calculate session statistics
        const sessionStats = {
            total: totalSessions,
            active: await ChatSession.countDocuments({ userId: req.user.userId, status: 'active' }),
            completed: await ChatSession.countDocuments({ userId: req.user.userId, status: 'completed' }),
            escalated: await ChatSession.countDocuments({ userId: req.user.userId, status: 'escalated' })
        };

        res.json({
            success: true,
            sessions: sessions.map(session => ({
                sessionId: session.sessionId,
                summary: session.summary,
                status: session.status,
                messageCount: session.messages.length,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                lastMessage: session.messages[session.messages.length - 1]?.content.substring(0, 100) + '...'
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSessions / limit),
                totalSessions,
                hasNext: page * limit < totalSessions,
                hasPrev: page > 1
            },
            statistics: sessionStats
        });

        console.log(`📋 Chat history requested: ${req.user.name} - ${sessions.length} sessions`);
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch chat history',
            message: 'Please try again later'
        });
    }
});

// Health tips and information
app.get('/api/health/tips', (req, res) => {
    try {
        const { category = 'general' } = req.query;
        
        const tips = medicalKnowledgeBase.healthTips[category] || medicalKnowledgeBase.healthTips.general;
        
        res.json({
            success: true,
            category,
            tips,
            additionalResources: {
                emergencyNumbers: {
                    ambulance: '108',
                    emergency: '102',
                    police: '100',
                    fire: '101'
                },
                healthlineNumbers: {
                    covid19: '1075',
                    mentalHealth: '9152987821',
                    childHelpline: '1098'
                }
            }
        });
    } catch (error) {
        console.error('Health tips error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch health tips'
        });
    }
});

// Analytics endpoint for monitoring
app.get('/api/analytics/usage', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSessions = await ChatSession.countDocuments();
        const emergencyCases = await EmergencyAlert.countDocuments({ status: 'active' });
        const todaySessions = await ChatSession.countDocuments({
            createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        });
        
        const topSymptoms = await ChatSession.aggregate([
            { $unwind: '$summary.primarySymptoms' },
            { $group: { 
                _id: '$summary.primarySymptoms', 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const urgencyDistribution = await ChatSession.aggregate([
            { $group: {
                _id: '$summary.urgencyLevel',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            analytics: {
                users: {
                    total: totalUsers,
                    newToday: await User.countDocuments({
                        registrationDate: { $gte: new Date().setHours(0, 0, 0, 0) }
                    })
                },
                sessions: {
                    total: totalSessions,
                    today: todaySessions,
                    averagePerDay: Math.round(totalSessions / 30) // Last 30 days average
                },
                emergencyAlerts: {
                    total: await EmergencyAlert.countDocuments(),
                    active: emergencyCases,
                    resolved: await EmergencyAlert.countDocuments({ status: 'resolved' })
                },
                symptoms: {
                    topSymptoms: topSymptoms.map(item => ({
                        symptom: item._id,
                        count: item.count
                    })),
                    urgencyDistribution: urgencyDistribution.map(item => ({
                        level: item._id,
                        count: item.count
                    }))
                },
                systemHealth: {
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    lastUpdated: new Date()
                }
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch analytics data'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.method} ${req.path} was not found`,
        availableEndpoints: [
            'GET /api/health',
            'POST /api/auth/register',
            'POST /api/auth/login', 
            'POST /api/chat/start',
            'POST /api/chat/message',
            'GET /api/facilities/nearby',
            'POST /api/emergency'
        ]
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MAC AI Healthcare Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
    console.log(`🏥 Healthcare services ready!`);
});

module.exports = app;