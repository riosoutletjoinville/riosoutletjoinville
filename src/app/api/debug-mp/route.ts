// src/app/api/debug-mp/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mercadopago_token: process.env.MERCADOPAGO_ACCESS_TOKEN ? 
      process.env.MERCADOPAGO_ACCESS_TOKEN.substring(0, 20) + '...' : 'NOT FOUND',
    mercadopago_token_length: process.env.MERCADOPAGO_ACCESS_TOKEN?.length,
    node_env: process.env.NODE_ENV
  });
}