// src/lib/generatePedidoPDF.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";

interface ClientePDF {
  id: string;
  tipo_cliente: "juridica" | "fisica";
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  nome?: string;
  sobrenome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  local_trabalho?: string;
}

interface ItemPedidoPDF {
  produto: {
    id: string;
    titulo: string;
    preco_prod: number;
    codigo: string;
    ncm: string;
    imagem_principal?: string;
  };
  quantidade: number;
  preco_unitario: number;
  tamanhos: { [tamanho: string]: number };
  subtotal: number;
  desconto: number;
  filial: string;
  embargue: string;
}

interface ParcelaPDF {
  numero_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  status: string;
}

interface PedidoDataPDF {
  cliente: ClientePDF;
  itens: ItemPedidoPDF[];
  total: number;
  observacoes: string;
  condicaoPagamento: string;
  numeroPedido: string;
  vendedor_nome?: string;
  vendedor_email?: string;
  vendedor_telefone?: string;
  localTrabalho?: string;
  parcelas?: ParcelaPDF[];
  saldoPedidoAnterior?: number;
  valorProdutosNovos?: number;
  pedidoAnteriorId?: string;
  // Campos para ecommerce
  origem_pedido?: string;
  tipo_checkout?: string;
  frete_valor?: number;
  cep_entrega?: string;
  opcao_frete?: string;
  prazo_entrega?: string;
  payment_method?: string;
  installments?: number;
}

const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const imageUrl = url.startsWith("http")
      ? url
      : `${window.location.origin}${url.startsWith("/") ? url : "/" + url}`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao carregar imagem:", error);
    return "";
  }
};

export const generatePedidoPDF = async (
  pedidoData: PedidoDataPDF,
  numeroPedido: string,
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = margin;

  const primaryColor = [23, 22, 22];
  const secondaryColor = [44, 62, 80];
  const lightColor = [236, 240, 241];

  // Cabeçalho
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 30, "F");

  try {
    const logoBase64 = await loadImageAsBase64("/logo-login.png");
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", margin, 5, 40, 12);
    }
  } catch (error) {
    console.log("Erro ao processar logo:", error);
  }

  // Determinar título baseado na origem
  const isEcommerce = pedidoData.origem_pedido === "ecommerce";
  const titulo = isEcommerce ? "PEDIDO E-COMMERCE" : "PEDIDO CONFIRMADO";

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, pageWidth / 2, 12, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Nº: ${numeroPedido}`, pageWidth / 2, 20, { align: "center" });
  
  const dataEmissao = new Date().toLocaleString("pt-BR");
  doc.text(`Data: ${dataEmissao}`, pageWidth / 2, 25, { align: "center" });

  yPosition = 40;

  // Informações da empresa
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Atual Modas - Joinville", pageWidth - margin, yPosition, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  
  if (pedidoData.vendedor_nome) {
    doc.text(`Vendedor: ${pedidoData.vendedor_nome}`, pageWidth - margin, yPosition + 4, { align: "right" });
    doc.text(`Telefone: ${pedidoData.vendedor_telefone || "Não informado"}`, pageWidth - margin, yPosition + 8, { align: "right" });
    doc.text(`Email: ${pedidoData.vendedor_email || "Não informado"}`, pageWidth - margin, yPosition + 12, { align: "right" });
    yPosition += 15;
  } else {
    yPosition += 5;
  }

  // RESUMO FINANCEIRO (se tiver saldo anterior)
  if (pedidoData.saldoPedidoAnterior && pedidoData.saldoPedidoAnterior > 0) {
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition, pageWidth - margin * 2, 20, "F");
    
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO FINANCEIRO", margin + 5, yPosition + 8);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Valor dos produtos novos: R$ ${pedidoData.valorProdutosNovos?.toFixed(2) || '0,00'}`, margin + 5, yPosition + 14);
    doc.text(`Saldo do pedido anterior: R$ ${pedidoData.saldoPedidoAnterior.toFixed(2)}`, margin + 5, yPosition + 19);
    
    yPosition += 25;
  }

  // DADOS DO CLIENTE
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F");

  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", margin + 5, yPosition + 7);

  yPosition += 15;

  const cliente = pedidoData.cliente;
  const nomeCliente = cliente.tipo_cliente === "juridica"
    ? (cliente.nome_fantasia || cliente.razao_social || "Cliente PJ")
    : (`${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim() ||
      "Cliente PF");

  const documentoCliente = cliente.tipo_cliente === "juridica"
    ? (cliente.cnpj || "CNPJ não informado")
    : (cliente.cpf || "CPF não informado");

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const colunaWidth = (pageWidth - margin * 2) / 2;

  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", margin, yPosition);
  doc.setFont("helvetica", "normal");
  const splitNomeCliente = doc.splitTextToSize(nomeCliente, colunaWidth - 10);
  doc.text(splitNomeCliente, margin + 18, yPosition);

  doc.setFont("helvetica", "bold");
  doc.text("Documento:", margin, yPosition + (splitNomeCliente.length * 4));
  doc.setFont("helvetica", "normal");
  doc.text(
    documentoCliente,
    margin + 25,
    yPosition + (splitNomeCliente.length * 4),
  );

  doc.setFont("helvetica", "bold");
  doc.text(
    "Local de Trabalho:",
    margin,
    yPosition + (splitNomeCliente.length * 4) + 4,
  );
  doc.setFont("helvetica", "normal");
  const localTrabalho = pedidoData.localTrabalho || cliente.local_trabalho || "Não informado";
  doc.text(
    localTrabalho,
    margin + 35,
    yPosition + (splitNomeCliente.length * 4) + 4,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Email:", margin + colunaWidth, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(
    cliente.email || "Não informado",
    margin + colunaWidth + 15,
    yPosition,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Telefone:", margin + colunaWidth, yPosition + 4);
  doc.setFont("helvetica", "normal");
  doc.text(
    cliente.telefone || "Não informado",
    margin + colunaWidth + 22,
    yPosition + 4,
  );

  yPosition += (splitNomeCliente.length * 4) + 12;

  // Endereço
  if (cliente.endereco) {
    const enderecoCompleto = `${cliente.endereco}${
      cliente.numero ? ", " + cliente.numero : ""
    }${cliente.complemento ? " - " + cliente.complemento : ""}${
      cliente.bairro ? " - " + cliente.bairro : ""
    }${cliente.cidade ? " - " + cliente.cidade : ""}${
      cliente.estado ? "/" + cliente.estado : ""
    }`;

    doc.setFont("helvetica", "bold");
    doc.text("Endereço:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    const splitEndereco = doc.splitTextToSize(
      enderecoCompleto,
      pageWidth - margin * 2 - 25,
    );
    doc.text(splitEndereco, margin + 22, yPosition);
    yPosition += splitEndereco.length * 4;
  }

  yPosition += 10;

  // INFORMAÇÕES DE ENTREGA (para ecommerce)
  if (isEcommerce && pedidoData.cep_entrega) {
    doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F");

    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMAÇÕES DE ENTREGA", margin + 5, yPosition + 5.5);

    yPosition += 12;

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    doc.text(`CEP: ${pedidoData.cep_entrega}`, margin, yPosition);
    doc.text(`Transportadora: ${pedidoData.opcao_frete || "Não informado"}`, margin + 70, yPosition);
    doc.text(`Prazo: ${pedidoData.prazo_entrega || "Não informado"}`, margin + 140, yPosition);
    
    yPosition += 6;
    
    if (pedidoData.frete_valor && pedidoData.frete_valor > 0) {
      doc.text(`Frete: R$ ${pedidoData.frete_valor.toFixed(2)}`, margin, yPosition);
    }
    
    yPosition += 8;
  }

  // INFORMAÇÕES DE PAGAMENTO
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(margin, yPosition, (pageWidth - margin * 2) / 2, 10, "F");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CONDIÇÃO DE PAGAMENTO", margin + 5, yPosition + 5.5);

  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(margin + (pageWidth - margin * 2) / 2, yPosition, (pageWidth - margin * 2) / 2, 10, "F");
  doc.text("PRAZO DE ENTREGA", margin + (pageWidth - margin * 2) / 2 + 5, yPosition + 5.5);

  yPosition += 12;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  // Condição de pagamento
  let condicaoTexto = pedidoData.condicaoPagamento || "Não especificada";
  if (isEcommerce && pedidoData.payment_method) {
    const metodoPagamento = pedidoData.payment_method === "pix" ? "PIX" : 
                           pedidoData.payment_method === "credit_card" ? "Cartão de Crédito" :
                           pedidoData.payment_method === "bolbradesco" ? "Boleto" :
                           pedidoData.payment_method;
    
    if (pedidoData.installments && pedidoData.installments > 1) {
      condicaoTexto = `${metodoPagamento} em ${pedidoData.installments}x`;
    } else {
      condicaoTexto = metodoPagamento;
    }
  }
  
  const splitCondicao = doc.splitTextToSize(condicaoTexto, (pageWidth - margin * 2) / 2 - 10);
  doc.text(splitCondicao, margin + 5, yPosition);

  // Prazo de entrega
  const prazosEntrega = [...new Set(pedidoData.itens.map((item) => item.embargue))];
  const prazoTexto = isEcommerce && pedidoData.prazo_entrega 
    ? pedidoData.prazo_entrega 
    : prazosEntrega.join(", ") || "Não especificado";
    
  const splitPrazo = doc.splitTextToSize(prazoTexto, (pageWidth - margin * 2) / 2 - 10);
  doc.text(splitPrazo, margin + (pageWidth - margin * 2) / 2 + 5, yPosition);

  yPosition += Math.max(splitCondicao.length, splitPrazo.length) * 4 + 8;

  // PARCELAS (se tiver)
  if (pedidoData.parcelas && pedidoData.parcelas.length > 0) {
    doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    doc.rect(margin, yPosition, pageWidth - margin * 2, 8, "F");

    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("PARCELAS DO PAGAMENTO", margin + 5, yPosition + 5.5);

    yPosition += 10;

    const parcelasData = pedidoData.parcelas.map((parcela) => [
      parcela.numero_parcela.toString(),
      `R$ ${parcela.valor_parcela.toFixed(2)}`,
      new Date(parcela.data_vencimento).toLocaleDateString('pt-BR'),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Parcela", "Valor", "Vencimento"]],
      body: parcelasData,
      theme: "grid",
      headStyles: {
        fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 } },
      tableWidth: "wrap",
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  }

  // TABELA DE PRODUTOS
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(margin, yPosition, pageWidth - margin * 2, 8, "F");

  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("PRODUTOS", margin + 5, yPosition + 5.5);

  yPosition += 10;

  const tableData = pedidoData.itens.map((item, index) => {
    const tamanhosQuantidades = Object.entries(item.tamanhos)
      .filter(([, qtd]) => qtd > 0)
      .map(([tamanho, qtd]) => `${tamanho}: ${qtd}`)
      .join(", ");

    return [
      (index + 1).toString(),
      item.produto.titulo,
      item.produto.codigo || "-",
      item.produto.ncm || "-",
      tamanhosQuantidades || "-",
      item.quantidade.toString(),
      `R$ ${item.preco_unitario.toFixed(2)}`,
      `${item.desconto}%`,
      `R$ ${item.subtotal.toFixed(2)}`,
    ];
  });

  const tableOptions: UserOptions = {
    startY: yPosition,
    head: [["#", "Produto", "Código", "NCM", "Tamanhos", "Qtd", "Preço Unit.", "Desc.", "Subtotal"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 12 },
      6: { cellWidth: 22 },
      7: { cellWidth: 15 },
      8: { cellWidth: 22 },
    },
    tableWidth: "wrap",
  };

  autoTable(doc, tableOptions);
  
  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // TOTAL
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  let totalY = finalY;
  
  if (pedidoData.saldoPedidoAnterior && pedidoData.saldoPedidoAnterior > 0) {
    doc.text("Valor produtos novos:", pageWidth - margin - 60, totalY);
    doc.text(`R$ ${pedidoData.valorProdutosNovos?.toFixed(2) || '0,00'}`, pageWidth - margin, totalY, { align: "right" });

    doc.text("Saldo anterior:", pageWidth - margin - 60, totalY + 5);
    doc.text(`R$ ${pedidoData.saldoPedidoAnterior.toFixed(2)}`, pageWidth - margin, totalY + 5, { align: "right" });

    totalY += 10;
  }
  
  // Adicionar frete se for ecommerce
  if (isEcommerce && pedidoData.frete_valor && pedidoData.frete_valor > 0) {
    const subtotalSemFrete = pedidoData.total - pedidoData.frete_valor;
    doc.text("Subtotal:", pageWidth - margin - 60, totalY);
    doc.text(`R$ ${subtotalSemFrete.toFixed(2)}`, pageWidth - margin, totalY, { align: "right" });
    
    doc.text("Frete:", pageWidth - margin - 60, totalY + 5);
    doc.text(`R$ ${pedidoData.frete_valor.toFixed(2)}`, pageWidth - margin, totalY + 5, { align: "right" });
    
    totalY += 10;
  }
  
  doc.text("TOTAL:", pageWidth - margin - 60, totalY);
  doc.text(`R$ ${pedidoData.total.toFixed(2)}`, pageWidth - margin, totalY, { align: "right" });

  // OBSERVAÇÕES
  let observacoesY = totalY + 8;
  if (pedidoData.observacoes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVAÇÕES:", margin, observacoesY);
    doc.setFont("helvetica", "normal");

    const splitObservacoes = doc.splitTextToSize(
      pedidoData.observacoes,
      pageWidth - margin * 2,
    );
    doc.text(splitObservacoes, margin, observacoesY + 4);
    observacoesY += splitObservacoes.length * 4 + 8;
  }

  // RODAPÉ
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  
  const mensagemRodape = isEcommerce 
    ? "Este documento é um comprovante de pedido realizado através do e-commerce."
    : "Este documento é um pedido confirmado.";
    
  doc.text(mensagemRodape, pageWidth / 2, footerY, { align: "center" });
  doc.text(
    "Emitido eletronicamente em " + new Date().toLocaleDateString("pt-BR"),
    pageWidth / 2,
    footerY + 4,
    { align: "center" },
  );

  const nomeArquivo = isEcommerce ? `Pedido-Ecommerce-${numeroPedido}.pdf` : `Pedido-${numeroPedido}.pdf`;
  doc.save(nomeArquivo);
};