// Shared validation utilities for Edge Functions
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Common validation schemas
export const emailSchema = z.string().email('Email inválido').max(255, 'Email muy largo');

export const passwordSchema = z.string()
  .min(8, 'Contraseña debe tener al menos 8 caracteres')
  .max(100, 'Contraseña muy larga')
  .regex(/[A-Z]/, 'Debe contener una mayúscula')
  .regex(/[a-z]/, 'Debe contener una minúscula')
  .regex(/[0-9]/, 'Debe contener un número');

export const phoneSchema = z.string()
  .min(10, 'Teléfono debe tener al menos 10 dígitos')
  .max(20, 'Teléfono muy largo')
  .regex(/^[+]?[0-9\s()-]+$/, 'Formato de teléfono inválido');

export const fullNameSchema = z.string()
  .trim()
  .min(1, 'Nombre requerido')
  .max(200, 'Nombre muy largo')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, 'Nombre contiene caracteres inválidos');

export const uuidSchema = z.string().regex(UUID_REGEX, 'Formato UUID inválido');

export const roleSchema = z.enum(['admin', 'moderator', 'user', 'none']);

// Schema for create-admin-user
export const createAdminUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: fullNameSchema,
  phone: phoneSchema,
  role: roleSchema.optional()
});

// Schema for reset-user-password
export const resetUserPasswordSchema = z.object({
  email: emailSchema.optional(),
  userId: uuidSchema.optional()
}).refine(
  data => data.email || data.userId,
  { message: 'Se requiere email o userId' }
);

// Schema for create-missing-profile
export const createMissingProfileSchema = z.object({
  userId: uuidSchema,
  email: emailSchema,
  full_name: fullNameSchema,
  phone: phoneSchema.optional()
});

// Schema for create-checkout
export const createCheckoutSchema = z.object({
  amount: z.number().positive('Monto debe ser positivo').max(1000000, 'Monto excede límite'),
  numberOfTeams: z.number().int('Debe ser entero').positive('Debe ser positivo').max(50, 'Máximo 50 equipos'),
  registrationIds: z.string().max(1000, 'IDs muy largos')
});

// Schema for verify-payment
export const verifyPaymentSchema = z.object({
  sessionId: z.string()
    .min(20, 'Session ID muy corto')
    .max(200, 'Session ID muy largo')
    .regex(/^cs_/, 'Session ID debe empezar con cs_')
});

// Helper function to validate and return formatted error response
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  corsHeaders: Record<string, string>
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    
    return {
      success: false,
      response: new Response(
        JSON.stringify({ 
          error: 'Datos de entrada inválidos',
          details: errors 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    };
  }
  
  return { success: true, data: result.data };
}
