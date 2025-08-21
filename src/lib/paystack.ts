// lib/paystack.ts
export interface PaystackPaymentData {
  amount: number; // in kobo (multiply by 100)
  email: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY!;
  }

  async initializePayment(data: PaystackPaymentData) {
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  }

  async verifyPayment(reference: string) {
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      }
    );

    const result = await response.json();
    return result;
  }

  generateReference(): string {
    return `lms_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

export const paystackService = new PaystackService();
