import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  // MUDANÇA 2: Aguardar a resolução da Promise 'params'
  const { id } = await params; 
  
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("status, payment_method")
    .eq("id", id) 
    .single();
    
  return NextResponse.json({
    status: pedido?.status,
    payment_method: pedido?.payment_method
  });
}