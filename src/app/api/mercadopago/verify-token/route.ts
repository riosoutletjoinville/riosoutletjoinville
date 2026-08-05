// src/app/api/mercadopago/verify-token/route.ts
//https://feb93e87bc40.ngrok-free.app/app/api/mercadopago/verify-token
import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  return NextResponse.json({
    token_prefix: token?.substring(0, 20) + '...',
    token_length: token?.length,
    environment: token?.startsWith('APP_USR') ? 'Production/Sandbox' : 'Unknown'
  });
}