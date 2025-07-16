// SPDX-FileCopyrightText: 2024 LiveKit, Inc.
//
// SPDX-License-Identifier: Apache-2.0
import { WorkerOptions, cli, defineAgent, llm, pipeline } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as openai from '@livekit/agents-plugin-openai';
// Silero will be imported conditionally in prewarm function
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Configuration constants
const ASSISTANT_NAME = "Cleo";
const CLINIC_NAME = "Noosa Springs Chiropractic";
const TIMEZONE = "Australia/Brisbane";
const API_BASE_URL = "https://agent-api-staging.connectgrid.com";

// Helper function to format appointments for voice response
function formatAppointmentForVoice(appointment) {
    const date = new Date(appointment.appointment_time);
    const dateStr = date.toLocaleDateString('en-AU', {
        timeZone: TIMEZONE,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-AU', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `${appointment.appointment_type} with ${appointment.practitioner_name} on ${dateStr} at ${timeStr}`;
}

// Helper function to get current Brisbane time
function getCurrentBrisbaneTime() {
    return new Date().toLocaleString('en-AU', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export default defineAgent({
    prewarm: async (proc) => {
        // Try to load silero VAD, fall back to null if not available
        try {
            const silero = await import('@livekit/agents-plugin-silero');
            proc.userData.vad = await silero.VAD.load();
            console.log('Silero VAD loaded successfully');
        } catch (error) {
            console.warn('Silero VAD plugin not available, using null VAD fallback:', error.message);
            proc.userData.vad = null;
        }
    },
    entry: async (ctx) => {
        const vad = ctx.proc.userData.vad;
        
        if (!vad) {
            console.warn('Running without VAD - voice activity detection will be limited');
        }
        
        // Enhanced system prompt for healthcare scheduling
        const initialContext = new llm.ChatContext().append({
            role: llm.ChatRole.SYSTEM,
            text: `You are ${ASSISTANT_NAME}, a professional healthcare scheduling assistant for ${CLINIC_NAME}. 
            
Your role is to help patients:
- Schedule appointments for Chiropractic, Physiotherapy, and Remedial Massage
- Manage existing appointments (cancel, reschedule)
- Provide information about services and practitioners
- Handle patient registration and verification

Communication style:
- Professional but warm and friendly
- Clear and concise for voice interaction
- Empathetic and understanding of patient needs
- Always confirm details before booking

Available services:
- Chiropractic (Initial 45 min, Follow-up 30 min) - Dr. Michael Coolican, Jenny Jones
- Physiotherapy (Initial 60 min, Follow-up 45 min) - Rich Low
- Remedial Massage (Initial 60 min) - Dr. Michael Coolican

Business hours: Monday-Friday 8:00 AM - 6:00 PM, Saturday 8:00 AM - 2:00 PM
Location: Noosa Springs, Queensland, Australia
Timezone: Australia/Brisbane

Always use the function tools to check availability, create appointments, and manage patient data.
Confirm all appointment details before finalizing bookings.`
        });

        await ctx.connect();
        console.log('waiting for participant');
        const participant = await ctx.waitForParticipant();
        console.log(`starting ${ASSISTANT_NAME} healthcare assistant for ${participant.identity}`);

        // Function context for healthcare operations
        const fncCtx = {
            getCurrentTime: {
                description: 'Get the current time in Brisbane, Australia timezone',
                parameters: z.object({}),
                execute: async () => {
                    const currentTime = getCurrentBrisbaneTime();
                    console.log(`Current Brisbane time: ${currentTime}`);
                    return `The current time in Brisbane is ${currentTime}`;
                },
            },

            getAppointmentTypes: {
                description: 'Get available appointment types and their durations',
                parameters: z.object({}),
                execute: async () => {
                    const types = {
                        "Chiropractic Initial": "45 minutes",
                        "Chiropractic Follow-up": "30 minutes", 
                        "Physiotherapy Initial": "60 minutes",
                        "Physiotherapy Follow-up": "45 minutes",
                        "Remedial Massage Initial": "60 minutes"
                    };
                    console.log('Retrieved appointment types');
                    return `Available appointment types: ${Object.entries(types).map(([type, duration]) => `${type} (${duration})`).join(', ')}`;
                },
            },

            getPractitioners: {
                description: 'Get available practitioners and their specialties',
                parameters: z.object({}),
                execute: async () => {
                    const practitioners = {
                        "Rich Low": "Physiotherapy",
                        "Dr. Michael Coolican": "Chiropractic and Remedial Massage",
                        "Jenny Jones": "Chiropractic"
                    };
                    console.log('Retrieved practitioners');
                    return `Available practitioners: ${Object.entries(practitioners).map(([name, specialty]) => `${name} (${specialty})`).join(', ')}`;
                },
            },

            checkAvailability: {
                description: 'Check availability for appointments on a specific date',
                parameters: z.object({
                    date: z.string().describe('Date in YYYY-MM-DD format'),
                    appointment_type: z.string().describe('Type of appointment (e.g., "Chiropractic Initial")'),
                    practitioner_name: z.string().optional().describe('Specific practitioner name if requested')
                }),
                execute: async ({ date, appointment_type, practitioner_name }) => {
                    try {
                        const url = new URL(`${API_BASE_URL}/availability`);
                        url.searchParams.append('date', date);
                        url.searchParams.append('appointment_type', appointment_type);
                        if (practitioner_name) {
                            url.searchParams.append('practitioner_name', practitioner_name);
                        }

                        console.log(`Checking availability for ${appointment_type} on ${date}${practitioner_name ? ` with ${practitioner_name}` : ''}`);
                        
                        const response = await fetch(url, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });

                        if (!response.ok) {
                            throw new Error(`Availability check failed: ${response.status}`);
                        }

                        const availability = await response.json();
                        
                        if (availability.available_slots && availability.available_slots.length > 0) {
                            const slots = availability.available_slots.map(slot => 
                                `${slot.time} with ${slot.practitioner_name}`
                            ).join(', ');
                            return `Available slots on ${date}: ${slots}`;
                        } else {
                            return `No availability found for ${appointment_type} on ${date}${practitioner_name ? ` with ${practitioner_name}` : ''}`;
                        }
                    } catch (error) {
                        console.error('Availability check error:', error);
                        return `Sorry, I couldn't check availability right now. Please try again later.`;
                    }
                },
            },

            verifyPatient: {
                description: 'Verify if a patient exists in the system',
                parameters: z.object({
                    first_name: z.string().describe('Patient first name'),
                    last_name: z.string().describe('Patient last name'),
                    date_of_birth: z.string().describe('Patient date of birth in YYYY-MM-DD format'),
                    phone: z.string().optional().describe('Patient phone number')
                }),
                execute: async ({ first_name, last_name, date_of_birth, phone }) => {
                    try {
                        console.log(`Verifying patient: ${first_name} ${last_name}, DOB: ${date_of_birth}`);
                        
                        const response = await fetch(`${API_BASE_URL}/patients/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                first_name,
                                last_name,
                                date_of_birth,
                                phone
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`Patient verification failed: ${response.status}`);
                        }

                        const result = await response.json();
                        
                        if (result.patient_exists) {
                            return `Patient verified: ${first_name} ${last_name}. Patient ID: ${result.patient_id}`;
                        } else {
                            return `Patient not found. Would you like me to create a new patient record for ${first_name} ${last_name}?`;
                        }
                    } catch (error) {
                        console.error('Patient verification error:', error);
                        return `Sorry, I couldn't verify the patient information right now. Please try again later.`;
                    }
                },
            },

            createPatient: {
                description: 'Create a new patient in the system',
                parameters: z.object({
                    first_name: z.string().describe('Patient first name'),
                    last_name: z.string().describe('Patient last name'),
                    date_of_birth: z.string().describe('Patient date of birth in YYYY-MM-DD format'),
                    phone: z.string().describe('Patient phone number'),
                    email: z.string().optional().describe('Patient email address'),
                    address: z.string().optional().describe('Patient address')
                }),
                execute: async ({ first_name, last_name, date_of_birth, phone, email, address }) => {
                    try {
                        console.log(`Creating new patient: ${first_name} ${last_name}`);
                        
                        const response = await fetch(`${API_BASE_URL}/patients`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                first_name,
                                last_name,
                                date_of_birth,
                                phone,
                                email,
                                address
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`Patient creation failed: ${response.status}`);
                        }

                        const result = await response.json();
                        return `New patient created successfully: ${first_name} ${last_name}. Patient ID: ${result.patient_id}`;
                    } catch (error) {
                        console.error('Patient creation error:', error);
                        return `Sorry, I couldn't create the patient record right now. Please try again later.`;
                    }
                },
            },

            bookAppointment: {
                description: 'Book an appointment for a patient',
                parameters: z.object({
                    patient_id: z.string().describe('Patient ID from verification'),
                    appointment_type: z.string().describe('Type of appointment'),
                    practitioner_name: z.string().describe('Practitioner name'),
                    appointment_date: z.string().describe('Appointment date in YYYY-MM-DD format'),
                    appointment_time: z.string().describe('Appointment time in HH:MM format'),
                    notes: z.string().optional().describe('Additional notes or reason for visit')
                }),
                execute: async ({ patient_id, appointment_type, practitioner_name, appointment_date, appointment_time, notes }) => {
                    try {
                        console.log(`Booking appointment for patient ${patient_id}: ${appointment_type} with ${practitioner_name} on ${appointment_date} at ${appointment_time}`);
                        
                        const response = await fetch(`${API_BASE_URL}/appointments`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                patient_id,
                                appointment_type,
                                practitioner_name,
                                appointment_date,
                                appointment_time,
                                notes
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`Appointment booking failed: ${response.status}`);
                        }

                        const result = await response.json();
                        const appointmentDetails = formatAppointmentForVoice(result);
                        
                        return `Appointment booked successfully! ${appointmentDetails}. Appointment ID: ${result.appointment_id}`;
                    } catch (error) {
                        console.error('Appointment booking error:', error);
                        return `Sorry, I couldn't book the appointment right now. Please try again later.`;
                    }
                },
            },

            cancelAppointment: {
                description: 'Cancel an existing appointment',
                parameters: z.object({
                    appointment_id: z.string().describe('Appointment ID to cancel'),
                    reason: z.string().optional().describe('Reason for cancellation')
                }),
                execute: async ({ appointment_id, reason }) => {
                    try {
                        console.log(`Cancelling appointment ${appointment_id}`);
                        
                        const response = await fetch(`${API_BASE_URL}/appointments/${appointment_id}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                reason
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`Appointment cancellation failed: ${response.status}`);
                        }

                        return `Appointment ${appointment_id} has been cancelled successfully.`;
                    } catch (error) {
                        console.error('Appointment cancellation error:', error);
                        return `Sorry, I couldn't cancel the appointment right now. Please try again later.`;
                    }
                },
            },

            getPatientAppointments: {
                description: 'Get upcoming appointments for a patient',
                parameters: z.object({
                    patient_id: z.string().describe('Patient ID'),
                    limit: z.number().optional().describe('Number of appointments to return (default: 5)')
                }),
                execute: async ({ patient_id, limit = 5 }) => {
                    try {
                        console.log(`Getting appointments for patient ${patient_id}`);
                        
                        const response = await fetch(`${API_BASE_URL}/patients/${patient_id}/appointments?limit=${limit}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to get appointments: ${response.status}`);
                        }

                        const result = await response.json();
                        
                        if (result.appointments && result.appointments.length > 0) {
                            const appointmentList = result.appointments.map(formatAppointmentForVoice).join(', ');
                            return `Upcoming appointments: ${appointmentList}`;
                        } else {
                            return `No upcoming appointments found for this patient.`;
                        }
                    } catch (error) {
                        console.error('Get appointments error:', error);
                        return `Sorry, I couldn't retrieve the appointments right now. Please try again later.`;
                    }
                },
            },
        };

        // Create voice pipeline agent
        const agent = new pipeline.VoicePipelineAgent(
            vad,
            new deepgram.STT(),
            new openai.LLM(),
            new elevenlabs.TTS(),
            {
                chatCtx: initialContext,
                fncCtx
            }
        );

        // Start the agent
        agent.start(ctx.room, participant);
        
        // Welcome message
        await agent.say(`Hello! I'm ${ASSISTANT_NAME}, your healthcare scheduling assistant at ${CLINIC_NAME}. I can help you book appointments, check availability, and manage your existing appointments. How can I assist you today?`, true);
    },
});

// Run the agent
cli.runApp(new WorkerOptions({ 
    agent: fileURLToPath(import.meta.url),
    // Enhanced options for healthcare application
    port: process.env.PORT || 8081,
    host: process.env.HOST || "0.0.0.0",
})); 