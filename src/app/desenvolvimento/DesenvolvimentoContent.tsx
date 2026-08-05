// app/desenvolvimento/page.tsx
export const dynamic = 'force-dynamic';
import EmDesenvolvimento from "@/components/ui/Desenvolvimento";

export default function PaginaEmDesenvolvimento() {
  return (
    <EmDesenvolvimento 
      titulo="Área Restrita"
      mensagem="Esta área está em desenvolvimento e será liberada em breve para nossos clientes."
      tempoEstimado="próximas semanas"
    />
  );
}