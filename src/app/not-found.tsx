// src/app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-muted-foreground">
          Faça outra pesquisa e tente novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Voltar para Loja</Link>
        </Button>
      </div>
    </div>
  )
}

// Adicione esta linha para garantir que seja reconhecido como página 404
export const dynamic = 'force-static'