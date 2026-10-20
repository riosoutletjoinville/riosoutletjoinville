// src/app/api/test-mp/route.ts
import { mercadoPagoService } from "@/lib/mercadopago";

export async function GET() {
  try {
    // Tentar criar uma preferência de teste
    const testPreference = {
      items: [
        {
          title: "Produto Teste",
          quantity: 1,
          currency_id: "BRL" as const,
          unit_price: 10.50
        }
      ],
      back_urls: { // ← ADICIONAR ESTA PROPRIEDADE OBRIGATÓRIA
        success: `${process.env.NEXTAUTH_URL}/pagamento/sucesso`,
        failure: `${process.env.NEXTAUTH_URL}/pagamento/erro`,
        pending: `${process.env.NEXTAUTH_URL}/pagamento/pendente`
      },
      notification_url: `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`
    };

    const preference = await mercadoPagoService.createPreference(testPreference);
    
    return Response.json({
      status: "success",
      mode: "sandbox", // Se funcionar, está no sandbox
      preference_id: preference.id,
      init_point: preference.init_point
    });
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } catch (error: any) { // ← CORRIGIR O TIPO DO ERROR
    return Response.json({
      status: "error",
      message: error.message,
      mode: "unknown"
    }, { status: 500 });
  }
}