//src/lib/generatePDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface VendedorPDF {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  local_trabalho_ped?: string;
  phone?: string;
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

interface PedidoDataPDF {
  cliente: ClientePDF;
  itens: ItemPedidoPDF[];
  total: number;
  observacoes: string;
  condicaoPagamento: string;
  numeroPedido: string;
  vendedor?: VendedorPDF;
  vendedor_nome?: string;
  vendedor_email?: string;
  vendedor_telefone?: string;
  localTrabalho?: string;
}

const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    // Para desenvolvimento local, use o caminho absoluto
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

export const generatePDF = async (
  pedidoData: PedidoDataPDF,
  numeroPedido: string,
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = margin;

  // Configurações de estilo
  const primaryColor = [23, 22, 22];
  const secondaryColor = [44, 62, 80];
  const lightColor = [236, 240, 241];

  // **PRIMEIRO: Desenhar o cabeçalho**
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 30, "F");

  // **SEGUNDO: Adicionar a logo POR CIMA do cabeçalho**
  try {
    console.log("=== INICIANDO CARREGAMENTO DA LOGO ===");
    const logoBase64 = await loadImageAsBase64("/logo-login.png");

    if (logoBase64) {
      console.log("✅ Logo carregada, adicionando ao PDF...");

      // Adicionar a imagem POR CIMA do fundo preto
      doc.addImage(logoBase64, "PNG", margin, 5, 40, 12);

      console.log("✅ Imagem adicionada ao PDF");
    } else {
      console.log("❌ Nenhuma logo foi carregada");
    }
  } catch (error) {
    console.log("❌ Erro ao processar logo:", error);
  }

  // **TERCEIRO: Adicionar o texto do cabeçalho POR CIMA de tudo**
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("ORDEM DE COMPRA", pageWidth / 2, 12, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Nº: ${numeroPedido}`, pageWidth / 2, 20, { align: "center" });

  const dataEmissao = new Date().toLocaleString("pt-BR");
  doc.text(`Data: ${dataEmissao}`, pageWidth / 2, 25, { align: "center" });

  yPosition = 40;

  // **ATUALIZADO: Informações da empresa e vendedor**
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Atual Modas - Joinville", pageWidth - margin, yPosition, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");

  if (pedidoData.vendedor) {
    // Para pré-pedidos
    doc.text(
      `Vendedor: ${pedidoData.vendedor.nome}`,
      pageWidth - margin,
      yPosition + 4,
      { align: "right" },
    );
    doc.text(
      `Telefone: ${pedidoData.vendedor?.phone || "Não informado"}`,
      pageWidth - margin,
      yPosition + 8,
      { align: "right" },
    );
    doc.text(
      `Email: ${pedidoData.vendedor.email}`,
      pageWidth - margin,
      yPosition + 12,
      { align: "right" },
    );
  } 

  yPosition += 15;

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

  // Informações do cliente em duas colunas
  const colunaWidth = (pageWidth - margin * 2) / 2;

  // Coluna esquerda - Informações básicas
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

  // **NOVO: Local de Trabalho**
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

  // Coluna direita - Contato
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

  // Endereço (se houver)
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

  // Condições do Pedido
  const condicoesWidth = (pageWidth - margin * 2) / 2;

  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(margin, yPosition, condicoesWidth, 8, "F");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CONDIÇÃO DE PAGAMENTO", margin + 5, yPosition + 5.5);

  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(margin + condicoesWidth, yPosition, condicoesWidth, 8, "F");
  doc.text("PRAZO DE ENTREGA", margin + condicoesWidth + 5, yPosition + 5.5);

  yPosition += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  const splitCondicao = doc.splitTextToSize(
    pedidoData.condicaoPagamento || "Não especificada",
    condicoesWidth - 10,
  );
  doc.text(splitCondicao, margin + 5, yPosition);

  // Verificar se há embargue definido nos itens
  const prazosEntrega = [
    ...new Set(pedidoData.itens.map((item) => item.embargue)),
  ];
  const splitPrazo = doc.splitTextToSize(
    prazosEntrega.join(", ") || "Não especificado",
    condicoesWidth - 10,
  );
  doc.text(splitPrazo, margin + condicoesWidth + 5, yPosition);

  yPosition += (Math.max(splitCondicao.length, splitPrazo.length) * 4) + 8;

  // Tabela de Produtos
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(margin, yPosition, pageWidth - margin * 2, 8, "F");

  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("PRODUTOS", margin + 5, yPosition + 5.5);

  yPosition += 10;

  // Preparar dados para a tabela com larguras ajustadas
  const tableData = pedidoData.itens.map((item, index) => {
    // removido o parâmetro não utilizado '_' usando destructuring
    const tamanhosQuantidades = Object.entries(item.tamanhos)
      .filter(([tamanho, qtd]) => qtd > 0) // Usando o parâmetro 'tamanho' em vez de '_'
      .map(([tamanho, qtd]) => `${tamanho}: ${qtd}`)
      .join(", ");

    return [
      (index + 1).toString(),
      item.produto.titulo,
      item.produto.codigo || "-",
      item.produto.ncm || "-",
      tamanhosQuantidades,
      item.quantidade.toString(),
      `R$ ${item.preco_unitario.toFixed(2)}`,
      `${item.desconto}%`,
      `R$ ${item.subtotal.toFixed(2)}`,
    ];
  });

  // Adicionar tabela com larguras ajustadas
  autoTable(doc, {
    startY: yPosition,
    head: [[
      "#",
      "Produto",
      "Código",
      "NCM",
      "Tamanhos",
      "Qtd",
      "Preço Unit.",
      "Desc.",
      "Subtotal",
    ]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    bodyStyles: {
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 8 }, // #
      1: { cellWidth: 40 }, // Produto
      2: { cellWidth: 20 }, // Código
      3: { cellWidth: 20 }, // NCM
      4: { cellWidth: 30 }, // Tamanhos
      5: { cellWidth: 12 }, // Qtd
      6: { cellWidth: 22 }, // Preço Unit.
      7: { cellWidth: 15 }, // Desc.
      8: { cellWidth: 22 }, // Subtotal
    },
    tableWidth: "wrap",
  });

  // Obter a posição Y final da tabela -  o tipo 'any'
  const finalY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 5;

  // Total
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", pageWidth - margin - 30, finalY);
  doc.text(`R$ ${pedidoData.total.toFixed(2)}`, pageWidth - margin, finalY, {
    align: "right",
  });

  // Observações
  if (pedidoData.observacoes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVAÇÕES:", margin, finalY + 8);
    doc.setFont("helvetica", "normal");

    const splitObservacoes = doc.splitTextToSize(
      pedidoData.observacoes,
      pageWidth - margin * 2,
    );
    doc.text(splitObservacoes, margin, finalY + 12);
  }

  // Rodapé
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Este documento é um pré-pedido e não representa uma confirmação de venda.",
    pageWidth / 2,
    footerY,
    { align: "center" },
  );
  doc.text(
    "Emitido eletronicamente em " + new Date().toLocaleDateString("pt-BR"),
    pageWidth / 2,
    footerY + 4,
    { align: "center" },
  );

  // Salvar o PDF
  doc.save(`Pre-Pedido_${numeroPedido}.pdf`);
};
