// schemas.js - MongoDB Schemas for MAC AI Healthcare Chatbot
// Team JARVIS - SIH 2025

const mongoose = require('mongoose');

// User Schema with Ayushman Bharat Integration
const userSchema = new mongoose.Schema({
    aadhaarId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{12}$/.test(v);
            },
            message: 'Aadhaar ID must be exactly 12 digits'
        },
        index: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^[6-9]\d{9}$/.test(v);
            },
            message: 'Phone number must be a valid 10-digit Indian mobile number'
        },
        index: true
    },
    email: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    age: {
        type: Number,
        min: 0,
        max: 150,
        validate: {
            validator: function(v) {
                return Number.isInteger(v);
            },
            message: 'Age must be a whole number'
        }
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        lowercase: true
    },
    
    // Ayushman Bharat Integration
    ayushmanBharatId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    abdmHealthId: {
        type: String,
        unique: true,
        sparse: true
    },
    
    // Medical Information
    medicalHistory: [{
        condition: {
            type: String,
            required: true
        },
        diagnosedDate: {
            type: Date
        },
        medications: [{
            name: String,
            dosage: String,
            frequency: String,
            startDate: Date,
            endDate: Date
        }],
        doctorName: String,
        hospitalName: String,
        notes: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe', 'critical'],
            default: 'mild'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    
    allergies: [{
        allergen: {
            type: String,
            required: true
        },
        reaction: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe', 'life-threatening'],
            default: 'mild'
        },
        diagnosedDate: Date
    }],
    
    chronicConditions: [{
        condition: String,
        diagnosedDate: Date,
        currentMedications: [String],
        lastCheckup: Date,
        nextCheckup: Date
    }],
    
    // Emergency Contacts
    emergencyContacts: [{
        name: {
            type: String,
            required: true
        },
        relation: {
            type: String,
            required: true,
            enum: ['spouse', 'parent', 'child', 'sibling', 'friend', 'guardian', 'other']
        },
        phone: {
            type: String,
            required: true,
            validate: {
                validator: function(v) {
                    return /^[6-9]\d{9}$/.test(v);
                },
                message: 'Emergency contact phone must be a valid Indian mobile number'
            }
        },
        email: String,
        address: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    
    // User Preferences
    preferences: {
        language: {
            type: String,
            default: 'english',
            enum: ['hindi', 'english', 'bengali', 'telugu', 'marathi', 'tamil', 'gujarati', 'urdu', 'kannada', 'odia', 'punjabi', 'malayalam']
        },
        notifications: {
            sms: {
                type: Boolean,
                default: true
            },
            email: {
                type: Boolean,
                default: false
            },
            push: {
                type: Boolean,
                default: true
            },
            emergency: {
                type: Boolean,
                default: true
            }
        },
        privacySettings: {
            shareDataWithDoctors: {
                type: Boolean,
                default: true
            },
            allowResearchData: {
                type: Boolean,
                default: false
            },
            emergencyDataSharing: {
                type: Boolean,
                default: true
            }
        },
        accessibilitySettings: {
            fontSize: {
                type: String,
                enum: ['small', 'medium', 'large', 'extra-large'],
                default: 'medium'
            },
            highContrast: {
                type: Boolean,
                default: false
            },
            voiceNavigation: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Location Information
    location: {
        currentAddress: {
            street: String,
            city: String,
            state: String,
            country: {
                type: String,
                default: 'India'
            },
            pincode: {
                type: String,
                validate: {
                    validator: function(v) {
                        return !v || /^\d{6}$/.test(v);
                    },
                    message: 'Pincode must be 6 digits'
                }
            }
        },
        coordinates: {
            latitude: {
                type: Number,
                min: -90,
                max: 90
            },
            longitude: {
                type: Number,
                min: -180,
                max: 180
            }
        },
        nearestHealthcareCenter: String
    },
    
    // Account Information
    accountStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'verification_pending'],
        default: 'active'
    },
    verificationStatus: {
        phone: {
            type: Boolean,
            default: false
        },
        email: {
            type: Boolean,
            default: false
        },
        aadhaar: {
            type: Boolean,
            default: false
        }
    },
    
    // Usage Statistics
    usageStats: {
        totalSessions: {
            type: Number,
            default: 0
        },
        totalMessages: {
            type: Number,
            default: 0
        },
        emergencyAlerts: {
            type: Number,
            default: 0
        },
        lastLoginDate: Date,
        firstRegistrationDate: Date
    },
    
    // Timestamps
    registrationDate: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    profileUpdatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for user's full name with title
userSchema.virtual('displayName').get(function() {
    return `${this.name} (${this.aadhaarId.substring(0, 4)}****${this.aadhaarId.substring(8)})`;
});

// Indexes for better performance
userSchema.index({ aadhaarId: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ lastActive: -1 });

// Chat Session Schema
const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Messages in the conversation
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        metadata: {
            symptoms: [String],
            intent: String,
            confidence: {
                type: Number,
                min: 0,
                max: 1
            },
            suggestions: [String],
            urgency: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical']
            },
            analysisType: String,
            processingTime: Number, // in milliseconds
            modelVersion: String
        },
        messageId: {
            type: String,
            default: () => new mongoose.Types.ObjectId().toString()
        }
    }],
    
    // Session Summary and Analysis
    summary: {
        primarySymptoms: [String],
        possibleConditions: [String],
        recommendedActions: [String],
        urgencyLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'low'
        },
        keyFindings: [String],
        followUpRequired: {
            type: Boolean,
            default: false
        },
        followUpDate: Date,
        lastAnalysis: Date
    },
    
    // Session Status and Control
    status: {
        type: String,
        enum: ['active', 'completed', 'escalated', 'interrupted', 'archived'],
        default: 'active'
    },
    
    sessionType: {
        type: String,
        enum: ['general_consultation', 'emergency', 'follow_up', 'health_education', 'facility_finder'],
        default: 'general_consultation'
    },
    
    // Session Metrics
    metrics: {
        duration: {
            type: Number, // in minutes
            default: 0
        },
        messageCount: {
            type: Number,
            default: 0
        },
        userSatisfactionRating: {
            type: Number,
            min: 1,
            max: 5
        },
        feedbackText: String,
        resolvedUserQuery: {
            type: Boolean,
            default: false
        }
    },
    
    // Healthcare Integration
    healthcareIntegration: {
        facilityReferrals: [{
            facilityId: mongoose.Schema.Types.ObjectId,
            facilityName: String,
            referralReason: String,
            urgency: String,
            referralDate: Date,
            appointmentScheduled: Boolean
        }],
        emergencyServicesContacted: {
            type: Boolean,
            default: false
        },
        emergencyServiceDetails: [{
            service: String,
            contactTime: Date,
            responseReceived: Boolean
        }]
    },
    
    // AI Analysis Details
    aiAnalysis: {
        confidenceScore: {
            type: Number,
            min: 0,
            max: 1
        },
        analysisVersion: String,
        alternativeInterpretations: [String],
        riskFactors: [String],
        recommendations: [String]
    },
    
    // Timestamps
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Pre-save middleware to update message count
chatSessionSchema.pre('save', function(next) {
    this.metrics.messageCount = this.messages.length;
    this.updatedAt = new Date();
    next();
});

// Indexes for chat sessions
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ status: 1 });
chatSessionSchema.index({ 'summary.urgencyLevel': 1 });

// Health Facility Schema
const healthFacilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    
    facilityType: {
        type: String,
        required: true,
        enum: ['hospital', 'clinic', 'phc', 'chc', 'emergency', 'specialty_clinic', 'diagnostic_center', 'pharmacy']
    },
    
    // Location Details
    location: {
        address: {
            street: String,
            area: String,
            city: {
                type: String,
                required: true
            },
            district: String,
            state: {
                type: String,
                required: true
            },
            country: {
                type: String,
                default: 'India'
            },
            pincode: {
                type: String,
                validate: {
                    validator: function(v) {
                        return /^\d{6}$/.test(v);
                    },
                    message: 'Pincode must be 6 digits'
                }
            }
        },
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            }
        },
        landmarks: [String],
        accessibilityInfo: String
    },
    
    // Contact Information
    contact: {
        primaryPhone: {
            type: String,
            required: true
        },
        emergencyPhone: String,
        alternatePhones: [String],
        email: String,
        website: String,
        socialMedia: {
            facebook: String,
            twitter: String,
            instagram: String
        }
    },
    
    // Services and Specialties
    services: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        availability: {
            type: String,
            enum: ['24x7', 'business_hours', 'appointment_only', 'emergency_only']
        },
        cost: {
            consultation: Number,
            currency: {
                type: String,
                default: 'INR'
            }
        }
    }],
    
    specialties: [{
        name: String,
        department: String,
        headOfDepartment: String,
        doctorsCount: Number
    }],
    
    // Ayushman Bharat and Insurance
    ayushmanBharatEmpanelled: {
        type: Boolean,
        default: false
    },
    empanelmentDetails: {
        empanelmentId: String,
        empanelmentDate: Date,
        validUntil: Date,
        packagesCovered: [String],
        maxAmountCoverable: Number
    },
    
    otherInsuranceAccepted: [String],
    
    // Operational Details
    operationalHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String },
        holidays: String
    },
    
    availability: {
        emergency24x7: {
            type: Boolean,
            default: false
        },
        telemedicine: {
            type: Boolean,
            default: false
        },
        homeVisit: {
            type: Boolean,
            default: false
        },
        ambulanceService: {
            type: Boolean,
            default: false
        }
    },
    
    // Capacity and Infrastructure
    capacity: {
        totalBeds: Number,
        icuBeds: Number,
        emergencyBeds: Number,
        oxygenSupport: Number,
        ventilators: Number
    },
    
    infrastructure: {
        hasBloodBank: Boolean,
        hasPharmacy: Boolean,
        hasDiagnosticLab: Boolean,
        hasRadiology: Boolean,
        hasOperationTheater: Boolean,
        hasAmbulance: Boolean,
        emergencyServices: [String]
    },
    
    // Quality and Ratings
    ratings: {
        overall: {
            average: {
                type: Number,
                min: 0,
                max: 5,
                default: 0
            },
            count: {
                type: Number,
                default: 0
            }
        },
        cleanliness: { average: Number, count: Number },
        staff: { average: Number, count: Number },
        facilities: { average: Number, count: Number },
        waitTime: { average: Number, count: Number }
    },
    
    certifications: [{
        name: String,
        issuedBy: String,
        issuedDate: Date,
        validUntil: Date,
        certificateNumber: String
    }],
    
    // Administrative
    licenseNumber: String,
    establishedYear: Number,
    ownershipType: {
        type: String,
        enum: ['government', 'private', 'trust', 'cooperative', 'corporate']
    },
    
    verificationStatus: {
        verified: {
            type: Boolean,
            default: false
        },
        verifiedBy: String,
        verificationDate: Date,
        lastUpdated: Date
    },
    
    status: {
        type: String,
        enum: ['active', 'inactive', 'temporarily_closed', 'under_renovation'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Geospatial index for location-based searches
healthFacilitySchema.index({ 'location.coordinates': '2dsphere' });
healthFacilitySchema.index({ facilityType: 1 });
healthFacilitySchema.index({ ayushmanBharatEmpanelled: 1 });
healthFacilitySchema.index({ 'location.address.city': 1 });

// Emergency Alert Schema
const emergencyAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    sessionId: {
        type: String,
        ref: 'ChatSession'
    },
    
    alertId: {
        type: String,
        unique: true,
        default: () => `EMRG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    
    // Alert Details
    alertType: {
        type: String,
        required: true,
        enum: [
            'critical_symptoms',
            'user_initiated',
            'automatic_detection',
            'medical_emergency',
            'fall_detection',
            'panic_button',
            'medication_overdose'
        ]
    },
    
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'high'
    },
    
    // Medical Information
    symptoms: [String],
    vitalSigns: {
        heartRate: Number,
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        },
        temperature: Number,
        oxygenSaturation: Number,
        respiratoryRate: Number
    },
    
    userMessage: String,
    aiAnalysis: String,
    
    // Location Information
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number], // [longitude, latitude]
        address: String,
        accuracy: Number, // GPS accuracy in meters
        timestamp: Date
    },
    
    // Response and Resolution
    responseDetails: {
        emergencyServicesContacted: [{
            service: {
                type: String,
                enum: ['ambulance_108', 'emergency_102', 'police_100', 'fire_101', 'local_hospital']
            },
            contactTime: Date,
            contactMethod: String,
            responseReceived: Boolean,
            estimatedArrivalTime: Date,
            actualArrivalTime: Date
        }],
        
        emergencyContactsNotified: [{
            contactId: mongoose.Schema.Types.ObjectId,
            contactName: String,
            contactPhone: String,
            notificationTime: Date,
            notificationMethod: String,
            acknowledged: Boolean
        }],
        
        nearestFacilitiesAlerted: [{
            facilityId: mongoose.Schema.Types.ObjectId,
            facilityName: String,
            distance: Number, // in kilometers
            alertTime: Date,
            preparationStatus: String
        }]
    },
    
    // Status and Resolution
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'responded', 'resolved', 'false_alarm', 'cancelled'],
        default: 'active'
    },
    
    resolution: {
        resolvedBy: String,
        resolutionTime: Date,
        resolutionNotes: String,
        hospitalAdmitted: Boolean,
        hospitalName: String,
        treatmentProvided: String,
        followUpRequired: Boolean
    },
    
    // Timing Information
    alertTime: {
        type: Date,
        default: Date.now
    },
    acknowledgedTime: Date,
    responseTime: Date,
    resolutionTime: Date,
    
    // Quality Metrics
    metrics: {
        responseTimeMinutes: Number,
        userSatisfaction: Number,
        systemPerformance: {
            alertProcessingTime: Number, // milliseconds
            notificationDeliveryTime: Number, // milliseconds
            gpsAccuracy: Number
        }
    }
}, {
    timestamps: true
});

// Indexes for emergency alerts
emergencyAlertSchema.index({ userId: 1, alertTime: -1 });
emergencyAlertSchema.index({ alertType: 1 });
emergencyAlertSchema.index({ status: 1 });
emergencyAlertSchema.index({ severity: 1 });
emergencyAlertSchema.index({ 'location.coordinates': '2dsphere' });

// Create Models
const User = mongoose.model('User', userSchema);
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
const HealthFacility = mongoose.model('HealthFacility', healthFacilitySchema);
const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);

// Export models
module.exports = {
    User,
    ChatSession,
    HealthFacility,
    EmergencyAlert
};