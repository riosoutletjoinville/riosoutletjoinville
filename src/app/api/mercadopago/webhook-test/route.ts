// src/app/api/mercadopago/webhook-test/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const webhookUrl = `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`;
  
  return NextResponse.json({
    message: "Teste webhook",
    webhook_url: webhookUrl,
    instructions: "Configure este URL no Dashboard do Mercado Pago",
    dashboard_url: "https://www.mercadopago.com.br/developers/panel/applications",
  });
}