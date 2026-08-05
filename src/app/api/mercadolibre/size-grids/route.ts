import { NextRequest, NextResponse } from 'next/server';
import { mercadoLivreService } from '@/lib/mercadolibre';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);

    // Buscar tabelas de medidas válidas para calçados
    const response = await fetch('https://api.mercadolibre.com/catalog/charts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "domain_id": "SNEAKERS",
        "site_id": "MLB",
        "seller_id": 182254659 
      })
    });

    if (!response.ok) {
      console.error('Erro na API de tabelas:', await response.text());
    return NextResponse.json([
        { id: "3862179", name: "Tênis Masculino 38-44", value_id: 3862179 },
        { id: "3733398", name: "Tênis Infantil Masculino 16-33", value_id: 3733398 },
        { id: "3869605", name: "Tênis Infantil Feminino 16-33", value_id: 3869605 },
        { id: "3733638", name: "Tênis Masculino Adulto 34-48", value_id: 3733638 },
        { id: "3869621", name: "Tênis Feminino Adulto 34-42", value_id: 3869621 },
        { id: "3869651", name: "Tênis Unissex Infantil 16-33", value_id: 3869651 },
        { id: "3733666", name: "Tênis Unissex Adulto 34-48", value_id: 3733666 }
    ]);
    }

    const charts = await response.json();

    if (!Array.isArray(charts)) {
      return NextResponse.json([
        { id: "3733666", name: "Tênis Unissex Adulto 38-44", value_id: 3862179 }
      ]);
    }

    const sizeGrids = charts
      .filter(chart => chart.id && chart.names?.MLB)
      .map(chart => ({
        id: String(chart.id),
        name: chart.names.MLB,
        value_id: Number(chart.id)
      }));

    return NextResponse.json(sizeGrids);
  } catch (error) {
    console.error('Erro ao buscar grades de tamanho:', error);
    return NextResponse.json([
      { id: "3733666", name: "Tênis Unissex Adulto 38-44", value_id: 3862179 }
    ]);
  }
}