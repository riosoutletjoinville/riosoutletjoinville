// src/lib/mercadolibre/products.ts
import { getAdminClient, supabase } from "@/lib/supabase";
import { mercadoLivreService } from "./mercadolibre";

// Interfaces para os tipos de dados
export interface MLProduct {
    id: string;
    title: string;
    price: number;
    available_quantity: number;
    status: string;
    thumbnail: string;
    ml_item_id?: string;
    ml_status?: string;
}

export interface ProductVariation {
    id: string;
    produto_id: string;
    estoque: number;
    preco: number;
    codigo_ean: string;
    sku: string;
    cor_id?: string;
    tamanho_id?: string;
    cor?: { nome: string };
    tamanho?: { nome: string };
}

export interface ProductImage {
    id: string;
    url: string;
    ordem: number;
    principal: boolean;
    cor_id: string;
}

export interface DatabaseProduct {
    id: string;
    titulo: string;
    descricao: string;
    preco: number;
    estoque: number;
    categoria_id?: string;
    genero_id?: string;
    marca_id?: string;
    modelo_prod?: string;
    condicao: string;
    peso?: number;
    comprimento?: number;
    largura?: number;
    altura?: number;
    publicar_ml?: boolean;
    ml_item_id?: string;
    ml_status?: string;
}

export interface MLAttribute {
    id: string;
    name: string;
    value_name: string;
    value_id?: string;
}

export interface MLVariationAttribute {
    id: string;
    name: string;
    value_id?: string;
    value_name: string;
}

export interface MLVariation {
    id?: number;
    price: number;
    available_quantity: number;
    sold_quantity?: number;
    picture_ids?: string[];
    attribute_combinations: MLVariationAttribute[];
    seller_custom_field?: string;
    seller_sku?: string;

    size_grid_row_id?: string;
}

export interface MLProductData {
    title: string;
    category_id: string;
    price: number;
    currency_id: string;
    available_quantity: number;
    buying_mode: string;
    listing_type_id: string;
    condition: string;
    description: { plain_text: string };
    pictures: Array<{ source: string }>;
    attributes: MLAttribute[];
    variations?: MLVariation[];
    shipping?: {
        mode: string;
        dimensions?: string;
        free_shipping?: boolean;
        local_pick_up?: boolean;
    };
}

export interface MLProductUpdateData {
    price?: number;
    available_quantity?: number;
    title?: string;
    status?: string;
}

export interface MLProductBaseUpdate {
    price: number;
    available_quantity: number;
}

export interface MLProductFullUpdate extends MLProductBaseUpdate {
    title: string;
}

const mlCategoryMap: Record<string, string> = {
    "Tênis": "MLB23332",
    "Tênis Adulto Masculino": "MLB23332",
    "Tênis Infantil Masculino": "MLB23332",
    "Tênis Adulto Feminino": "MLB23332",
    "Tênis Infantil Feminino": "MLB23332",
    "Tênis Unissex Infantil": "MLB23332",
    "Tênis Unissex Adulto": "MLB23332",
    "Tênis de Corrida": "MLB23332",
    "Tênis Casual": "MLB23332",
    "Tênis Esportivo": "MLB23332",
    "Sapatenis": "MLB23332",
    "Sandália": "MLB23332",
    "Chinelo": "MLB23332",
    "Bota": "MLB23332",
    "Scarpim": "MLB23332",
    "Chuteira": "MLB23332",
    "Papete": "MLB23332",
    "Mocassim": "MLB23332",
    "Calçados": "MLB23332",
    "Default": "MLB23332",
};

export interface MLShippingSettings {
    shipping_modes?: string[];
    [key: string]: unknown;
}

export interface MLSizeGrid {
    id: string;
    name: string;
    value_id: number;
    gender?: string;
    minSize?: number;
    maxSize?: number;
}

const mlSizeGrids: MLSizeGrid[] = [
    // Tênis Masculino Adulto
    {
        id: "3733638",
        name: "Tênis Masculino Adulto 34-48",
        value_id: 3733638,
        gender: "Masculino",
        minSize: 34,
        maxSize: 48,
    },

    // Tênis Feminino Adulto
    {
        id: "3869621",
        name: "Tênis Feminino Adulto 34-42",
        value_id: 3869621,
        gender: "Feminino",
        minSize: 34,
        maxSize: 42,
    },

    // ✅ NOVA GRADE: Tênis Feminino Adulto 32-42
    {
        id: "3979561",
        name: "Tênis Feminino Adulto 32-42",
        value_id: 3979561,
        gender: "Feminino",
        minSize: 32,
        maxSize: 42,
    },

    // Tênis Unissex Adulto
    {
        id: "3733666",
        name: "Tênis Unissex Adulto 34-48",
        value_id: 3733666,
        gender: "Unissex",
        minSize: 34,
        maxSize: 48,
    },

    // Tênis Infantil Masculino
    {
        id: "3733398",
        name: "Tênis Infantil Masculino 16-33",
        value_id: 3733398,
        gender: "Masculino",
        minSize: 16,
        maxSize: 33,
    },

    // ✅ NOVA GRADE: Tênis Infantil Masculino 16-35
    {
        id: "3839830",
        name: "Tênis Infantil Masculino 16-35",
        value_id: 3839830,
        gender: "Masculino",
        minSize: 16,
        maxSize: 35,
    },

    // Tênis Infantil Feminino
    {
        id: "3869605",
        name: "Tênis Infantil Feminino 16-33",
        value_id: 3869605,
        gender: "Feminino",
        minSize: 16,
        maxSize: 33,
    },

    // Tênis Infantil Unissex
    {
        id: "3869651",
        name: "Tênis Unissex Infantil 16-33",
        value_id: 3869651,
        gender: "Unissex",
        minSize: 16,
        maxSize: 33,
    },

    // Fallback padrão
    {
        id: "3862179",
        name: "Tênis Masculino 38-44",
        value_id: 3862179,
        gender: "Masculino",
        minSize: 38,
        maxSize: 44,
    },
];

interface MLSizeChart {
    id: string;
    names: { MLB: string };
    domain_id: string;
    site_id: string;
    type: string;
    seller_id: number;
    measure_type: string;
    main_attribute_id: string;
    attributes: Array<
        {
            id: string;
            name: string;
            values: Array<{ id: string; name: string }>;
        }
    >;
    rows: Array<{
        id: string;
        attributes: Array<{
            id: string;
            name: string;
            values: Array<
                { name: string; struct?: { number: number; unit: string } }
            >;
        }>;
    }>;
}

export class MercadoLivreProductsService {
    private async findAppropriateSizeGrid(
        variations: ProductVariation[],
        accessToken: string,
        categoryName: string,
        genderName: string,
    ): Promise<string> {
        if (!variations || variations.length === 0) {
            return "3862179";
        }

        // Extrair todos os tamanhos únicos das variações
        const availableSizes = variations
            .filter((v) => v.tamanho && v.tamanho.nome)
            .map((v) => {
                const size = v.tamanho!.nome;
                const numericMatch = size.match(/\d+/);
                return numericMatch ? parseInt(numericMatch[0]) : NaN;
            })
            .filter((size) => !isNaN(size))
            .sort((a, b) => a - b);

        if (availableSizes.length === 0) {
            return "3862179";
        }

        const minSize = availableSizes[0];
        const maxSize = availableSizes[availableSizes.length - 1];

        // Determinar se é produto infantil ou adulto baseado na categoria
        const isInfantil = categoryName.toLowerCase().includes("infantil") ||
            categoryName.toLowerCase().includes("kids") ||
            categoryName.toLowerCase().includes("criança");

        // Normalizar o gênero - usar const
        const normalizedGender = genderName;

        console.log(
            `Buscando grade: ${categoryName}, Gênero: ${normalizedGender}, Tamanhos: ${minSize}-${maxSize}`,
        );

        // Primeiro: tentar encontrar grade exata localmente
        const localMatch = this.findLocalSizeGrid(
            normalizedGender,
            minSize,
            maxSize,
            isInfantil,
        );
        if (localMatch) {
            console.log("Grade encontrada localmente:", localMatch.name);
            return localMatch.id;
        }

        // Segundo: buscar via API como fallback
        try {
            const validGrids = await this.getValidSizeGridIds(accessToken);
            const apiMatch = this.findMatchingGridInList(
                validGrids,
                normalizedGender,
                minSize,
                maxSize,
                isInfantil,
            );

            if (apiMatch) {
                console.log("Grade encontrada via API:", apiMatch.name);
                return apiMatch.id;
            }
        } catch (error) {
            console.error(
                "Erro ao buscar grades via API, usando fallback:",
                error,
            );
        }

        // Fallback baseado no tipo (infantil/adulto) e gênero
        return this.getFallbackGrid(normalizedGender, isInfantil);
    }

    private normalizeGender(genderName: string, isInfantil: boolean): string {
        if (!genderName) return "Unissex";

        const normalized = genderName.toLowerCase().trim();

        // ✅ SEMPRE use "Masculino", "Feminino" ou "Unissex"
        if (normalized.includes("masculino")) {
            return "Masculino";
        }
        if (normalized.includes("feminino")) {
            return "Feminino";
        }
        return "Unissex";
    }

    private findLocalSizeGrid(
        gender: string,
        minSize: number,
        maxSize: number,
        isInfantil: boolean,
    ): MLSizeGrid | null {
        // O parâmetro é utilizado nas verificações abaixo, manter
        return mlSizeGrids.find((grid) => {
            const genderMatch = grid.gender === gender;
            const sizeMatch = minSize >= (grid.minSize || 0) &&
                maxSize <= (grid.maxSize || 50);
            const typeMatch = isInfantil
                ? (grid.minSize || 0) <= 33
                : (grid.minSize || 0) >= 34;

            return genderMatch && sizeMatch && typeMatch;
        }) || null;
    }

    private findMatchingRowId(
        sizeName: string,
        sizeChart: MLSizeChart,
    ): string | undefined {
        if (!sizeName || !sizeChart.rows || !Array.isArray(sizeChart.rows)) {
            return undefined;
        }

        const sizeNumber = parseInt(sizeName.replace(/\D/g, ""));
        if (isNaN(sizeNumber)) return undefined;

        // Buscar a linha correspondente ao tamanho
        const matchingRow = sizeChart.rows.find((row) => {
            const sizeAttr = row.attributes.find((attr) => attr.id === "SIZE");
            if (sizeAttr && sizeAttr.values[0]?.name) {
                const rowSizeNumber = parseInt(
                    sizeAttr.values[0].name.replace(/\D/g, ""),
                );
                return !isNaN(rowSizeNumber) && rowSizeNumber === sizeNumber;
            }
            return false;
        });

        // ✅ Retornar o ID completo da linha (ex: "3733398:7") em vez de apenas o índice
        return matchingRow?.id;
    }

    private getPictureIdsForVariation(
        corId: string | undefined,
        images: ProductImage[],
        mlImageIds: string[],
    ): string[] {
        if (!corId || mlImageIds.length === 0 || images.length === 0) {
            // Se não tem cor específica, retorna todas as imagens
            return mlImageIds;
        }

        // ✅ CORREÇÃO: Filtrar imagens pela cor específica
        const colorImages = images.filter((img) => img.cor_id === corId);

        if (colorImages.length === 0) {
            // Se não encontrou imagens para esta cor, usar todas como fallback
            return mlImageIds;
        }

        // ✅ CORREÇÃO CRÍTICA: Mapear CORRETAMENTE as imagens pelos seus índices originais
        const variationPictureIds: string[] = [];

        // Para cada imagem da cor específica, encontrar qual mlImageId corresponde
        colorImages.forEach((colorImage) => {
            // Encontrar o índice desta imagem no array original de imagens
            const originalIndex = images.findIndex((img) =>
                img.id === colorImage.id
            );

            // Se encontrou o índice e existe um mlImageId correspondente
            if (originalIndex !== -1 && originalIndex < mlImageIds.length) {
                variationPictureIds.push(mlImageIds[originalIndex]);
            }
        });

        // Se não encontrou correspondências, usar todas como fallback
        return variationPictureIds.length > 0
            ? variationPictureIds
            : mlImageIds;
    }

    private logImageAssociation(
        variations: ProductVariation[],
        images: ProductImage[],
        mlImageIds: string[],
    ): void {
        console.log("=== ASSOCIAÇÃO DE IMAGENS POR COR ===");
        console.log("Total de imagens enviadas:", mlImageIds.length);
        console.log("Total de imagens no produto:", images.length);

        // Log de todas as imagens disponíveis
        console.log("📸 Imagens disponíveis:");
        images.forEach((img, index) => {
            console.log(
                `  [${index}] - URL: ${img.url}, Cor ID: ${img.cor_id}, ML ID: ${
                    index < mlImageIds.length ? mlImageIds[index] : "N/A"
                }`,
            );
        });

        variations.forEach((variation, index) => {
            const corNome = variation.cor?.nome || "Sem cor";
            const corId = variation.cor_id;

            const colorImages = images.filter((img) => img.cor_id === corId);
            const pictureIds = this.getPictureIdsForVariation(
                corId,
                images,
                mlImageIds,
            );

            console.log(`🎨 Variação ${index + 1}:`);
            console.log(`  - Cor: ${corNome} (ID: ${corId})`);
            console.log(
                `  - Imagens específicas encontradas: ${colorImages.length}`,
            );
            console.log(`  - Picture IDs associados: ${pictureIds.length}`);
            console.log(`  - IDs: [${pictureIds.join(", ")}]`);

            // Log detalhado das imagens da cor
            colorImages.forEach((img, imgIndex) => {
                console.log(`    Imagem ${imgIndex + 1}: ${img.url}`);
            });
        });
        console.log("=====================================");
    }

    // Método para fallback
    private getFallbackGrid(gender: string, isInfantil: boolean): string {
        if (isInfantil) {
            return gender === "Feminino"
                ? "3869605"
                : gender === "Masculino"
                ? "3839830"
                : "3869651";
        } else {
            return gender === "Feminino"
                ? "3979561"
                : gender === "Masculino"
                ? "3733638"
                : "3733666";
        }
    }

    private async getValidSizeGridIds(
        accessToken?: string,
    ): Promise<MLSizeGrid[]> {
        try {
            console.log("Buscando grades de tamanho válidas via API...");

            if (!accessToken) {
                // Retornar grades locais se não tem token
                return mlSizeGrids;
            }

            const response = await fetch("/api/mercadolibre/size-grids", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const apiGrids = await response.json();
                // Combinar grades da API com grades locais
                return [...apiGrids, ...mlSizeGrids];
            }

            // Fallback para grades locais
            return mlSizeGrids;
        } catch (error) {
            console.error("Erro ao buscar tabelas de medidas:", error);
            return mlSizeGrids;
        }
    }

    private async getSizeChartDetails(
        chartId: string,
        accessToken: string,
    ): Promise<MLSizeChart> {
        try {
            console.log(
                `Buscando detalhes da tabela de medidas ID: ${chartId}`,
            );

            // Para as grades que criamos, usar dados específicos em vez da API
            const predefinedChart = this.getPredefinedSizeChart(chartId);
            if (predefinedChart) {
                console.log(
                    "Usando grade predefinida:",
                    predefinedChart.names.MLB,
                );
                return predefinedChart;
            }

            // Fallback para API apenas se não for uma grade predefinida
            const response = await fetch(
                `/api/mercadolibre/size-grids?id=${chartId}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Erro ao buscar tabela: ${response.status}`);
            }

            const chartData = await response.json();
            return chartData;
        } catch (error) {
            console.error("Erro ao buscar tabela de medidas:", error);
            // Fallback para grade predefinida
            const fallbackChart = this.getPredefinedSizeChart(chartId) ||
                this.getPredefinedSizeChart("3862179");
            return fallbackChart!;
        }
    }

    async checkProductStatus(mlItemId: string): Promise<{ status: string }> {
        try {
            const accessToken = await mercadoLivreService.getAccessToken();
            if (!accessToken) {
                throw new Error("Token de acesso não disponível");
            }

            // ✅ CORREÇÃO: Usar a URL direta da API do Mercado Livre
            const response = await fetch(
                `https://api.mercadolibre.com/items/${mlItemId}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Erro ao verificar status: ${response.status}`);
            }

            const productData = await response.json();
            return { status: productData.status };
        } catch (error) {
            console.error("Erro ao verificar status do produto:", error);
            throw error;
        }
    }

    private logSizeGridSelection(
        variations: ProductVariation[],
        categoryName: string,
        genderName: string,
        selectedGridId: string,
    ): void {
        const sizes = variations
            .filter((v) => v.tamanho?.nome)
            .map((v) => v.tamanho!.nome)
            .join(", ");

        const selectedGrid = mlSizeGrids.find((g) => g.id === selectedGridId);

        console.log("=== SELEÇÃO DE GRADE DE TAMANHOS ===");
        console.log("Categoria:", categoryName);
        console.log("Gênero:", genderName);
        console.log("Tamanhos disponíveis:", sizes);
        console.log("Grade selecionada:", selectedGrid?.name || selectedGridId);
        console.log("================================");
    }

    // Buscar categoria do ML pelo nome
    private async findMlCategoryId(categoryName: string): Promise<string> {
        try {
            // Primeiro tenta buscar do banco de dados
            const { data: category } = await supabase
                .from("categorias")
                .select("ml_category_id")
                .ilike("nome", `%${categoryName}%`)
                .not("ml_category_id", "is", null)
                .single();

            if (category && category.ml_category_id) {
                return category.ml_category_id;
            }

            // Fallback para o mapeamento local
            const normalizedName = categoryName.toLowerCase().trim();
            for (const [key, value] of Object.entries(mlCategoryMap)) {
                if (normalizedName.includes(key.toLowerCase())) {
                    return value;
                }
            }

            return "MLB23332"; // Default seguro
        } catch (error) {
            console.error("Erro ao buscar categoria ML:", error);
            return "MLB23332";
        }
    }

    // Buscar informações completas do produto
    private async getProductDetails(productId: string): Promise<{
        product: DatabaseProduct;
        variations: ProductVariation[];
        images: ProductImage[];
        categoryName: string;
        brandName: string;
    }> {
        try {
            // Buscar produto
            const { data: product, error: productError } = await supabase
                .from("produtos")
                .select("*")
                .eq("id", productId)
                .single();

            if (productError) throw productError;

            // Buscar variações
            const { data: variations, error: variationsError } = await supabase
                .from("produto_variacoes")
                .select(`
          *,
          cor:cores(nome),
          tamanho:tamanhos(nome)
        `)
                .eq("produto_id", productId);

            if (variationsError) throw variationsError;

            // Buscar imagens
            const { data: images, error: imagesError } = await supabase
                .from("produto_imagens")
                .select("*")
                .eq("produto_id", productId)
                .order("ordem", { ascending: true });

            if (imagesError) throw imagesError;

            // Buscar nome da categoria
            let categoryName = "Calçados";
            if (product.categoria_id) {
                const { data: category } = await supabase
                    .from("categorias")
                    .select("nome")
                    .eq("id", product.categoria_id)
                    .single();
                if (category) categoryName = category.nome;
            }

            // Buscar nome da marca
            let brandName = "";
            if (product.marca_id) {
                const { data: brand } = await supabase
                    .from("marcas")
                    .select("nome")
                    .eq("id", product.marca_id)
                    .single();
                if (brand) brandName = brand.nome;
            }

            return {
                product: product as DatabaseProduct,
                variations: variations as ProductVariation[] || [],
                images: images as ProductImage[] || [],
                categoryName,
                brandName,
            };
        } catch (error) {
            console.error("Erro ao buscar detalhes do produto:", error);
            throw error;
        }
    }

    // Validar dados do produto antes do envio
    private validateProductData(productData: MLProductData): string[] {
        const errors: string[] = [];

        if (!productData.title || productData.title.length < 3) {
            errors.push("Título muito curto");
        }

        if (productData.price <= 0) {
            errors.push("Preço deve ser maior que zero");
        }

        if (productData.available_quantity < 0) {
            errors.push("Quantidade disponível não pode ser negativa");
        }

        if (productData.variations) {
            productData.variations.forEach((variation, index) => {
                if (variation.price <= 0) {
                    errors.push(
                        `Variação ${index + 1}: Preço deve ser maior que zero`,
                    );
                }
                if (variation.available_quantity < 0) {
                    errors.push(
                        `Variação ${
                            index + 1
                        }: Quantidade não pode ser negativa`,
                    );
                }
                if (
                    !variation.attribute_combinations ||
                    variation.attribute_combinations.length === 0
                ) {
                    errors.push(
                        `Variação ${
                            index + 1
                        }: Atributos de combinação são obrigatórios`,
                    );
                }
            });
        }
        const hasModel = productData.attributes.some((attr) =>
            attr.id === "MODEL"
        );
        if (!hasModel) {
            errors.push("Atributo MODEL é obrigatório");
        }

        return errors;
    }

    private async getUserShippingSettings(
        accessToken: string,
    ): Promise<MLShippingSettings | null> {
        try {
            // Chamar a API do servidor em vez de fazer diretamente do cliente
            const response = await fetch("/api/mercadolibre/shipping", {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                return await response.json();
            }

            // Fallback para configurações básicas
            return {
                shipping_modes: ["custom"],
                free_methods: [],
            };
        } catch (error) {
            console.error("Erro ao buscar configurações de shipping:", error);
            return {
                shipping_modes: ["custom"],
                free_methods: [],
            };
        }
    }

    private normalizeDescriptionForGender(
        description: string,
        gender: string,
        categoryName: string,
    ): string {
        const isInfantil = categoryName.toLowerCase().includes("infantil");

        let finalDescription = description.replace(/\s+/g, " ").trim();

        // ✅ CORREÇÃO: Remover TODAS as referências a gênero da descrição
        finalDescription = finalDescription
            .replace(/masculino|feminino|menino|menina|unissex|infantil/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        // ✅ MESMA LÓGICA DO TÍTULO: gênero no final para categorias específicas
        const categoryLower = categoryName.toLowerCase();
        const categoriesWithoutShoePrefix = [
            "bota",
            "chinelo",
            "rasteira",
            "chuteira",
            "scarpim",
            "papete",
            "mocassim",
            "sandália",
            "sandalia",
            "sapatenis",
            "tamanco",
            "tamanco",
            "salto",
            "plataforma",
        ];

        const needsShoePrefix = !categoriesWithoutShoePrefix.some((category) =>
            categoryLower.includes(category)
        );

        if (!needsShoePrefix) {
            if (isInfantil) {
                if (gender === "Masculino" || gender === "Menino") {
                    finalDescription = `${finalDescription} Infantil Menino`;
                } else if (gender === "Feminino" || gender === "Menina") {
                    finalDescription = `${finalDescription} Infantil Menina`;
                } else {
                    finalDescription = `${finalDescription} Infantil`;
                }
            } else {
                if (gender === "Masculino") {
                    finalDescription = `${finalDescription} Masculino`;
                } else if (gender === "Feminino") {
                    finalDescription = `${finalDescription} Feminino`;
                }
            }
        } else {
            // ... (manter lógica existente para categorias com "Tênis")
            if (isInfantil) {
                if (gender === "Masculino" || gender === "Menino") {
                    finalDescription =
                        `Tênis Infantil Menino ${finalDescription}`;
                } else if (gender === "Feminino" || gender === "Menina") {
                    finalDescription =
                        `Tênis Infantil Menina ${finalDescription}`;
                } else {
                    finalDescription = `Tênis Infantil ${finalDescription}`;
                }
            } else {
                if (gender === "Masculino") {
                    finalDescription = `Tênis Masculino ${finalDescription}`;
                } else if (gender === "Feminino") {
                    finalDescription = `Tênis Feminino ${finalDescription}`;
                } else {
                    finalDescription = `Tênis ${finalDescription}`;
                }
            }
        }

        return finalDescription;
    }

    private async prepareProductData(
        productId: string,
        accessToken: string,
        mlImageIds?: string[],
    ): Promise<MLProductData> {
        const { product, variations, images, categoryName, brandName } =
            await this.getProductDetails(productId);

        const modelName = product.modelo_prod ||
            product.titulo.substring(0, 60);

        // ✅Determinar se é infantil primeiro
        const isInfantil = categoryName.toLowerCase().includes("infantil");

        // ✅ Buscar e normalizar gênero corretamente
        let genderName = "";
        if (product.genero_id) {
            const { data: gender } = await supabase
                .from("generos")
                .select("nome")
                .eq("id", product.genero_id)
                .single();
            if (gender) {
                genderName = this.normalizeGender(gender.nome, isInfantil);
            }
        }

        const sizeGridId = await this.findAppropriateSizeGrid(
            variations,
            accessToken,
            categoryName,
            genderName,
        );

        const sizeChart = await this.getSizeChartDetails(
            sizeGridId,
            accessToken,
        );

        this.logSizeGridSelection(
            variations,
            categoryName,
            genderName,
            sizeGridId,
        );

        const sizeToRowId: Record<string, string> = {};
        if (sizeChart.rows && Array.isArray(sizeChart.rows)) {
            sizeChart.rows.forEach((row) => {
                const sizeAttr = row.attributes.find((attr) =>
                    attr.id === "SIZE"
                );
                if (sizeAttr && sizeAttr.values[0]?.name) {
                    const sizeName = sizeAttr.values[0].name;
                    sizeToRowId[sizeName] = row.id;
                }
            });
        }

        let categoryId = await this.findMlCategoryId(categoryName);
        if (product.categoria_id) {
            const { data: category } = await supabase
                .from("categorias")
                .select("ml_category_id")
                .eq("id", product.categoria_id)
                .single();
            if (category && category.ml_category_id) {
                categoryId = category.ml_category_id;
            }
        }

        const attributes: MLAttribute[] = [
            {
                id: "MODEL",
                name: "modelo_prod",
                value_name: modelName,
            },
            {
                id: "GTIN",
                name: "Código universal do produto",
                value_name: variations[0]?.codigo_ean || "Isento",
            },
            {
                id: "GENDER",
                name: "Gênero",
                value_name: isInfantil
                    ? (genderName === "Masculino"
                        ? "Menino"
                        : genderName === "Feminino"
                        ? "Menina"
                        : "Unissex")
                    : genderName, // Para adultos: "Masculino", "Feminino", "Unissex"
                value_id: this.getGenderValueId(genderName, isInfantil),
            },
        ];

        const isShoeCategory = categoryName.toLowerCase().includes("tênis") ||
            categoryName.toLowerCase().includes("tenis") ||
            categoryName.toLowerCase().includes("tenis infantil masculino") ||
            categoryName.toLowerCase().includes("tenis infantil feminino") ||
            categoryName.toLowerCase().includes("tenis esportivo") ||
            categoryName.toLowerCase().includes("mocassim") ||
            categoryName.toLowerCase().includes("calçado") ||
            categoryName.toLowerCase().includes("sapatenis") ||
            categoryName.toLowerCase().includes("scarpim") ||
            categoryName.toLowerCase().includes("chuteira") ||
            categoryName.toLowerCase().includes("chinelo") ||
            categoryName.toLowerCase().includes("sandalia") ||
            categoryName.toLowerCase().includes("sandália") ||
            categoryName.toLowerCase().includes("bota");

        if (isShoeCategory) {
            attributes.push({
                id: "SIZE_GRID_ID",
                name: "Grade de tamanhos",
                value_name: sizeGridId,
                value_id: sizeGridId,
            });
        }

        if (brandName) {
            attributes.push({
                id: "BRAND",
                name: "Marca",
                value_name: brandName,
            });
        }

        attributes.push({
            id: "ITEM_CONDITION",
            name: "Condição do item",
            value_name: product.condicao === "novo" ? "Novo" : "Usado",
        });

        let mlGender = "Unissex";
        if (genderName) {
            if (isInfantil) {
                mlGender = genderName === "Masculino"
                    ? "Menino"
                    : genderName === "Feminino"
                    ? "Menina"
                    : "Unissex";
            } else {
                mlGender = genderName;
            }
        }

        let adjustedTitle = product.titulo.replace(/\s+/g, " ").trim();
        const prefix = this.getTitlePrefix(genderName, isInfantil);
        if (prefix) {
            // Verifica se o título já tem as palavras principais
            const needsPrefix = ![
                "infantil",
                "masculino",
                "feminino",
                "menino",
                "menina",
                "criança",
                "kids",
            ].some((term) => adjustedTitle.toLowerCase().includes(term));

            if (needsPrefix) {
                adjustedTitle = `${prefix} ${adjustedTitle}`;
            }
        }

        const normalizedTitle = this.normalizeTitleForGender(
            product.titulo,
            mlGender,
            categoryName,
        );

        const normalizedDescription = this.normalizeDescriptionForGender(
            product.descricao || product.titulo,
            mlGender,
            categoryName,
        );

        // Preparar imagens
        const pictures = images.map((img) => ({
            source: img.url,
        }));

        const shipping = {
            mode: "custom",
            free_shipping: true,
            local_pick_up: false,
        };

        try {
            const shippingSettings = await this.getUserShippingSettings(
                accessToken,
            );
            if (shippingSettings?.shipping_modes) {
                if (shippingSettings.shipping_modes.includes("me2")) {
                    shipping.mode = "me2";
                } else if (shippingSettings.shipping_modes.includes("me1")) {
                    shipping.mode = "me1";
                }
            }
        } catch (error) {
            console.error("Erro ao buscar configurações de shipping:", error);
        }

        // Preparar dados base do produto
        const productData: MLProductData = {
            title: normalizedTitle,
            category_id: categoryId,
            price: Number(product.preco),
            currency_id: "BRL",
            available_quantity: product.estoque || 0,
            buying_mode: "buy_it_now",
            listing_type_id: "bronze",
            condition: product.condicao === "novo" ? "Novo" : "Usado",
            description: {
                plain_text: normalizedDescription,
            },
            pictures: images.map((img) => ({
                source: img.url,
            })),
            attributes,
            shipping,
        };

        if (variations && variations.length > 0) {
            const variationsData: MLVariation[] = variations.map(
                (variation) => {
                    const variationAttributes: MLVariationAttribute[] = [];
                    const variationItemAttributes: MLAttribute[] = [];

                    if (variation.tamanho?.nome) {
                        variationAttributes.push({
                            id: "SIZE",
                            name: "Tamanho",
                            value_name: variation.tamanho.nome,
                        });

                        const sizeGridRowId = this.findMatchingRowId(
                            variation.tamanho.nome,
                            sizeChart,
                        );
                        if (sizeGridRowId) {
                            variationItemAttributes.push({
                                id: "SIZE_GRID_ROW_ID",
                                name: "Linha da grade de tamanho",
                                value_name: sizeGridRowId,
                                value_id: sizeGridRowId,
                            });
                        } else {
                            console.warn(
                                `Nenhum ID de linha encontrado para: ${variation.tamanho.nome}`,
                            );
                        }
                    }

                    if (variation.cor?.nome) {
                        variationAttributes.push({
                            id: "COLOR",
                            name: "Cor",
                            value_name: variation.cor.nome,
                        });
                    } else {
                        variationAttributes.push({
                            id: "COLOR",
                            name: "Cor",
                            value_name: "Única",
                        });
                    }

                    const variationPictureIds = mlImageIds
                        ? this.getPictureIdsForVariation(
                            variation.cor_id,
                            images,
                            mlImageIds,
                        )
                        : [];

                    return {
                        price: Number(variation.preco || product.preco),
                        available_quantity: variation.estoque || 0,
                        attribute_combinations: variationAttributes,
                        attributes: variationItemAttributes,
                        seller_sku: variation.sku,
                        picture_ids: variationPictureIds,
                    };
                },
            );
            productData.variations = variationsData;
        }
        return productData;
    }

    private getTitlePrefix(
        genderName: string,
        isInfantil: boolean,
    ): string | null {
        if (isInfantil) {
            if (genderName === "Masculino") return "Tênis Infantil Masculino";
            if (genderName === "Feminino") return "Tênis Infantil Feminino";
            return "Tênis Infantil";
        } else {
            if (genderName === "Masculino") return "Tênis Masculino";
            if (genderName === "Feminino") return "Tênis Feminino";
            return "Tênis";
        }
    }

    private getGenderValueId(gender: string, isInfantil: boolean): string {
        const genderMap: Record<string, string> = {
            "Masculino": isInfantil ? "339666" : "339666", // Menino usa mesmo ID que Masculino
            "Feminino": isInfantil ? "339665" : "339665", // Menina usa mesmo ID que Feminino
            "Unissex": "339668",
            "Menino": "339666",
            "Menina": "339665",
        };
        if (isInfantil) {
            if (gender === "Masculino") return "339666"; // Menino
            if (gender === "Feminino") return "339665"; // Menina
        }
        return genderMap[gender] || "339668";
    }

    // Adicionar este método após o método findLocalSizeGrid
    private findMatchingGridInList(
        grids: MLSizeGrid[],
        gender: string,
        minSize: number,
        maxSize: number,
        isInfantil: boolean,
    ): MLSizeGrid | null {
        return grids.find((grid) => {
            // Verificar se o gênero corresponde
            const genderMatch = grid.gender === gender;

            // Verificar se a faixa de tamanho está contida na grade
            const sizeMatch = minSize >= (grid.minSize || 0) &&
                maxSize <= (grid.maxSize || 50);

            // Verificar se é infantil/adulto compatível
            const typeMatch = isInfantil
                ? (grid.minSize || 0) <= 33 // Grades infantis geralmente até 33
                : (grid.minSize || 0) >= 34; // Grades adultas geralmente a partir de 34

            return genderMatch && sizeMatch && typeMatch;
        }) || null;
    }

    private normalizeTitleForGender(
        title: string,
        gender: string,
        categoryName: string,
    ): string {
        const isInfantil = categoryName.toLowerCase().includes("infantil");

        let finalTitle = title.replace(/\s+/g, " ").trim();

        // ✅ CORREÇÃO: Remover TODAS as referências a gênero do título original
        finalTitle = finalTitle
            .replace(/masculino|feminino|menino|menina|unissex|infantil/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        // ✅ NOVA LÓGICA: Verificar se a categoria já indica o tipo de calçado
        const categoryLower = categoryName.toLowerCase();

        // Lista de categorias que NÃO precisam de prefixo "Tênis"
        const categoriesWithoutShoePrefix = [
            "bota",
            "chinelo",
            "rasteira",
            "chuteira",
            "scarpim",
            "papete",
            "mocassim",
            "sandália",
            "sandalia",
            "sapatenis",
            "tamanco",
            "tamanco",
            "salto",
            "plataforma", // 🔥 ADICIONEI TAMANCO AQUI
        ];

        const needsShoePrefix = !categoriesWithoutShoePrefix.some((category) =>
            categoryLower.includes(category)
        );

        // ✅ CORREÇÃO CRÍTICA: Para categorias SEM prefixo "Tênis", colocar gênero no FINAL
        if (!needsShoePrefix) {
            // Se a categoria já define o tipo (ex: "Tamanco"), usar gênero no FINAL
            if (isInfantil) {
                if (gender === "Masculino" || gender === "Menino") {
                    finalTitle = `${finalTitle} Infantil Menino`;
                } else if (gender === "Feminino" || gender === "Menina") {
                    finalTitle = `${finalTitle} Infantil Menina`;
                } else {
                    finalTitle = `${finalTitle} Infantil`;
                }
            } else {
                if (gender === "Masculino") {
                    finalTitle = `${finalTitle} Masculino`;
                } else if (gender === "Feminino") {
                    finalTitle = `${finalTitle} Feminino`;
                }
                // Unissex não adiciona sufixo
            }
        } else {
            // Para categorias que precisam do prefixo "Tênis" (como calçados genéricos)
            if (isInfantil) {
                if (gender === "Masculino" || gender === "Menino") {
                    finalTitle = `Tênis Infantil Menino ${finalTitle}`;
                } else if (gender === "Feminino" || gender === "Menina") {
                    finalTitle = `Tênis Infantil Menina ${finalTitle}`;
                } else {
                    finalTitle = `Tênis Infantil ${finalTitle}`;
                }
            } else {
                if (gender === "Masculino") {
                    finalTitle = `Tênis Masculino ${finalTitle}`;
                } else if (gender === "Feminino") {
                    finalTitle = `Tênis Feminino ${finalTitle}`;
                } else {
                    finalTitle = `Tênis ${finalTitle}`;
                }
            }
        }

        return finalTitle;
    }

    private generateSizeRows(
        minSize: number,
        maxSize: number,
        chartId: string, // ✅ Receber o chartId como parâmetro
    ) {
        const rows = [];

        const footLengthMap: Record<number, number> = {
            16: 10.0,
            17: 10.5,
            18: 11.0,
            19: 11.5,
            20: 12.0,
            21: 12.5,
            22: 13.0,
            23: 13.5,
            24: 14.0,
            25: 14.5,
            26: 15.0,
            27: 15.5,
            28: 16.0,
            29: 16.5,
            30: 17.0,
            31: 17.5,
            32: 18.0,
            33: 18.5,
            34: 22.0,
            35: 22.5,
            36: 23.0,
            37: 23.5,
            38: 24.0,
            39: 24.5,
            40: 25.0,
            41: 26.0,
            42: 26.5,
            43: 27.0,
            44: 28.0,
            45: 28.5,
            46: 29.0,
            47: 29.5,
            48: 30.0,
        };

        let rowIndex = 1;
        for (let size = minSize; size <= maxSize; size++) {
            const footLength = footLengthMap[size] || (20 + (size - 34) * 0.5);

            // ✅ Usar formato correto "chartId:rowIndex"
            rows.push({
                id: `${chartId}:${rowIndex}`, // Ex: "3733398:1", "3733398:2", etc.
                attributes: [
                    {
                        id: "SIZE",
                        name: "Tamanho",
                        values: [{ name: size.toString() }],
                    },
                    {
                        id: "FOOT_LENGTH",
                        name: "Comprimento do pé",
                        values: [{
                            name: `${footLength} cm`,
                            struct: { number: footLength, unit: "cm" },
                        }],
                    },
                    {
                        id: "MANUFACTURER_SIZE",
                        name: "Tamanho da marca",
                        values: [{ name: size.toString() }],
                    },
                ],
            });
            rowIndex++;
        }

        return rows;
    }

    private getPredefinedSizeChart(chartId: string): MLSizeChart | null {
        const charts: Record<string, MLSizeChart> = {
            "3733638": { // Tênis Masculino Adulto 34-48
                id: "3733638",
                names: { MLB: "Tênis Masculino Adulto 34-48" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(34, 48, chartId),
            },
            "3869621": { // Tênis Feminino Adulto 34-42
                id: "3869621",
                names: { MLB: "Tênis Feminino Adulto 34-42" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(34, 42, chartId),
            },
            "3979561": { // ✅ NOVA: Tênis Feminino Adulto 32-42
                id: "3979561",
                names: { MLB: "Tênis Feminino Adulto 32-42" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(32, 42, chartId),
            },
            "3869605": { // Tênis Infantil Feminino 16-33
                id: "3869605",
                names: { MLB: "Tênis Infantil Feminino 16-33" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(16, 33, chartId),
            },
            "3733398": { // Tênis Infantil Masculino 16-33
                id: "3733398",
                names: { MLB: "Tênis Infantil Masculino 16-33" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(16, 33, chartId),
            },
            "3839830": { // ✅ NOVA: Tênis Infantil Masculino 16-35
                id: "3839830",
                names: { MLB: "Tênis Infantil Masculino 16-35" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(16, 35, chartId),
            },
            "3869651": { // Tênis Unissex Infantil 16-33
                id: "3869651",
                names: { MLB: "Tênis Unissex Infantil 16-33" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(16, 33, chartId),
            },
            "3733666": { // Tênis Unissex Adulto 34-48
                id: "3733666",
                names: { MLB: "Tênis Unissex Adulto 34-48" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(34, 48, chartId),
            },
            "3862179": { // Fallback
                id: "3862179",
                names: { MLB: "Tênis Masculino 38-44" },
                domain_id: "SNEAKERS",
                site_id: "MLB",
                type: "SPECIFIC",
                seller_id: 182254659,
                measure_type: "BODY_MEASURE",
                main_attribute_id: "MANUFACTURER_SIZE",
                attributes: [],
                rows: this.generateSizeRows(38, 44, chartId),
            },
        };

        return charts[chartId] || null;
    }

    private findFallbackRowId(
        sizeName: string,
        sizeChart: MLSizeChart,
    ): string | null {
        if (!sizeChart.rows || !Array.isArray(sizeChart.rows)) {
            return null;
        }

        const sizeNumber = parseInt(sizeName.replace(/\D/g, ""));
        if (isNaN(sizeNumber)) {
            return null;
        }

        // Procurar a linha mais próxima do tamanho
        for (const row of sizeChart.rows) {
            const sizeAttr = row.attributes.find((attr) => attr.id === "SIZE");
            if (sizeAttr && sizeAttr.values[0]?.name) {
                const rowSizeNumber = parseInt(
                    sizeAttr.values[0].name.replace(/\D/g, ""),
                );
                if (
                    !isNaN(rowSizeNumber) &&
                    Math.abs(rowSizeNumber - sizeNumber) <= 2
                ) {
                    return row.id;
                }
            }
        }

        // Se não encontrou, usar a primeira linha como fallback absoluto
        return sizeChart.rows[0]?.id || null;
    }

    private async debugProductData(productId: string, accessToken: string) {
        try {
            const productData = await this.prepareProductData(
                productId,
                accessToken,
            );
            console.log("=== DADOS PREPARADOS PARA ENVIO ===");
            console.log("Título:", productData.title);
            console.log("Categoria:", productData.category_id);
            console.log("Preço:", productData.price);
            console.log("Atributos:", productData.attributes);
            console.log("Variações:", productData.variations?.length || 0);
            console.log("Imagens:", productData.pictures.length);
            console.log("JSON completo:", JSON.stringify(productData, null, 2));
        } catch (error) {
            console.error("Erro ao preparar dados para debug:", error);
        }
    }

    private async uploadImagesToML(
        accessToken: string,
        images: ProductImage[],
    ): Promise<string[]> {
        const uploadedImageIds: string[] = [];
        console.log(
            "Token sendo usado para upload:",
            accessToken.substring(0, 20) + "...",
        );
        if (!accessToken || accessToken.length < 50) {
            throw new Error("Token de acesso inválido ou expirado");
        }

        for (const image of images.slice(0, 4)) {
            try {
                console.log("Fazendo upload da imagem:", image.url);

                const uploadResponse = await fetch(
                    "/api/mercadolibre/upload-image",
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            imageUrl: image.url,
                        }),
                        signal: AbortSignal.timeout(30000),
                    },
                );

                if (uploadResponse.ok) {
                    const imageData = await uploadResponse.json();
                    console.log("Imagem enviada para ML:", imageData);
                    uploadedImageIds.push(imageData.id);
                } else {
                    const errorText = await uploadResponse.text();
                    console.error("Erro no upload:", errorText);
                }
            } catch (error) {
                console.error("Erro ao fazer upload da imagem:", error);
                continue;
            }
        }

        if (uploadedImageIds.length === 0) {
            throw new Error("Nenhuma imagem foi enviada com sucesso");
        }

        return uploadedImageIds;
    }

    private startStatusPolling(productId: string, mlItemId: string) {
        const pollInterval = setInterval(async () => {
            try {
                const status = await this.checkProductStatus(mlItemId);

                // Atualizar no banco
                await supabase
                    .from("produtos")
                    .update({ ml_status: status.status })
                    .eq("id", productId);

                // Se o produto foi aprovado, parar o polling
                if (status.status === "active") {
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error("Erro no polling de status:", error);
                clearInterval(pollInterval);
            }
        }, 30000); // Verificar a cada 30 segundos

        // Parar após 10 minutos
        setTimeout(() => clearInterval(pollInterval), 600000);
    }

    async getUserProducts(): Promise<MLProduct[]> {
        try {
            console.log("🟡 [getUserProducts] Iniciando busca de produtos...");

            // Obter o token de acesso
            console.log("🔍 [getUserProducts] Buscando accessToken...");
            const accessToken = await mercadoLivreService.getAccessToken();

            if (!accessToken) {
                console.error(
                    "❌ [getUserProducts] Token de acesso não disponível",
                );
                throw new Error("Token de acesso não disponível");
            }

            console.log(
                "✅ [getUserProducts] Token obtido:",
                accessToken.substring(0, 20) + "...",
            );

            const apiUrl = "/api/mercadolibre/user-products";
            console.log(
                "🌐 [getUserProducts] Fazendo requisição para:",
                apiUrl,
            );

            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            console.log(
                "📡 [getUserProducts] Resposta recebida - Status:",
                response.status,
                response.statusText,
            );

            if (!response.ok) {
                let errorMessage =
                    `Erro ${response.status}: ${response.statusText}`;

                if (response.status === 401) {
                    errorMessage = "Usuário não autenticado";
                    console.error(
                        "❌ [getUserProducts] Erro 401 - Autenticação falhou",
                    );
                } else if (response.status === 404) {
                    errorMessage = "Token do Mercado Livre não encontrado";
                    console.error(
                        "❌ [getUserProducts] Erro 404 - Endpoint não encontrado",
                    );
                } else {
                    // Tentar obter mais detalhes do erro
                    try {
                        const errorData = await response.text();
                        console.error(
                            "❌ [getUserProducts] Detalhes do erro:",
                            errorData,
                        );
                    } catch (e) {
                        console.error(
                            "❌ [getUserProducts] Não foi possível ler corpo do erro",
                        );
                    }
                }

                console.error("❌ [getUserProducts] Erro completo:", {
                    status: response.status,
                    statusText: response.statusText,
                    url: apiUrl,
                });

                throw new Error(errorMessage);
            }

            console.log(
                "✅ [getUserProducts] Requisição bem-sucedida, processando resposta...",
            );

            const productsData = await response.json();
            console.log("📊 [getUserProducts] Produtos recebidos:", {
                quantidade: productsData.length,
                primeirosIds: productsData.slice(0, 3).map((p: MLProduct) =>
                    p.id
                ),
            });

            return productsData;
        } catch (error) {
            console.error("💥 [getUserProducts] Erro capturado:", {
                mensagem: error instanceof Error
                    ? error.message
                    : "Erro desconhecido",
                stack: error instanceof Error ? error.stack : undefined,
                tipo: error instanceof Error
                    ? error.constructor.name
                    : typeof error,
            });

            // Re-lançar o erro para quem chamou a função
            throw error;
        }
    }

    async publishProduct(
        productId: string,
    ): Promise<{ id: string; status: string }> {
        try {
            console.log("Iniciando publicação do produto:", productId);

            // Buscar tokens de qualquer usuário conectado ao ML
            const { data: tokens } = await supabase
                .from("mercado_livre_tokens")
                .select("*")
                .order("updated_at", { ascending: false })
                .limit(1)
                .single();

            if (!tokens) {
                throw new Error("Nenhum token do Mercado Livre encontrado");
            }

            const accessToken = tokens.access_token;

            if (!accessToken) {
                throw new Error("Token de acesso não disponível");
            }

            await this.debugProductData(productId, accessToken);

            const { product, variations, images } = await this
                .getProductDetails(productId);

            if (images.length === 0) {
                throw new Error("Produto não possui imagens");
            }

            console.log("Fazendo upload de", images.length, "imagens...");
            const mlImageIds = await this.uploadImagesToML(accessToken, images);
            console.log("Imagens enviadas:", mlImageIds);

            // ✅ ADICIONAR: Debug da associação de imagens
            this.logImageAssociation(variations, images, mlImageIds);

            // ✅ PASSAR mlImageIds como parâmetro
            const productData = await this.prepareProductData(
                productId,
                accessToken,
                mlImageIds,
            );

            const validationErrors = this.validateProductData(productData);
            if (validationErrors.length > 0) {
                throw new Error(
                    `Erro de validação: ${validationErrors.join(", ")}`,
                );
            }

            console.log("Enviando produto para ML...");
            const response = await fetch("/api/mercadolibre/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify(productData),
            });

            const responseText = await response.text();
            console.log("Resposta do ML:", responseText);

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${responseText}`);
            }

            const result = JSON.parse(responseText);
            console.log("Produto publicado com sucesso:", result);

            // Atualizar produto com ID do ML
            const { error } = await supabase
                .from("produtos")
                .update({
                    ml_item_id: result.id,
                    ml_status: result.status,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", productId);

            if (error) {
                console.error("Erro ao atualizar produto:", error);
            }

            if (result.id) {
                this.startStatusPolling(productId, result.id);
            }

            return result;
        } catch (error) {
            console.error("Erro detalhado ao publicar produto:", error);
            throw new Error(
                `Falha na publicação: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            );
        }
    }

    // Atualizar produto no ML
    async updateProduct(
        productId: string,
    ): Promise<{ id: string; status: string }> {
        try {
            // Obter o token de acesso
            const accessToken = await mercadoLivreService.getAccessToken();
            if (!accessToken) {
                throw new Error("Token de acesso não disponível");
            }

            // Buscar ID do ML
            const { data: product } = await supabase
                .from("produtos")
                .select("ml_item_id")
                .eq("id", productId)
                .single();

            if (!product || !product.ml_item_id) {
                throw new Error("Produto não possui ID do Mercado Livre");
            }

            // ✅ Passar accessToken como segundo argumento
            const productData = await this.prepareProductData(
                productId,
                accessToken,
            );

            const response = await fetch(
                `/api/mercadolibre/items?itemId=${product.ml_item_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`, // ✅ Adicionar authorization
                    },
                    body: JSON.stringify(productData),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Erro ao atualizar produto: ${response.status}`,
                );
            }

            return await response.json();
        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            throw error;
        }
    }

    // Atualizar estoque no ML (atualizado)
    async updateStock(
        productId: string,
    ): Promise<{ id: string; available_quantity: number }> {
        try {
            // Obter o token de acesso
            const accessToken = await mercadoLivreService.getAccessToken();
            if (!accessToken) {
                throw new Error("Token de acesso não disponível");
            }

            // Buscar ID do ML e estoque atual
            const { data: product } = await supabase
                .from("produtos")
                .select("ml_item_id, estoque")
                .eq("id", productId)
                .single();

            if (!product || !product.ml_item_id) {
                throw new Error("Produto não possui ID do Mercado Livre");
            }

            const response = await fetch(
                `/api/mercadolibre/items?itemId=${product.ml_item_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`, // ✅ Adicionar authorization
                    },
                    body: JSON.stringify({
                        available_quantity: product.estoque,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Erro ao atualizar estoque: ${response.status}`,
                );
            }

            return await response.json();
        } catch (error) {
            console.error("Erro ao atualizar estoque:", error);
            throw error;
        }
    }

    // Pausar produto no ML
    async pauseProduct(productId: string): Promise<{ status: string }> {
        try {
            const accessToken = await mercadoLivreService.getAccessToken();
            if (!accessToken) {
                throw new Error("Token de acesso não disponível");
            }

            const { data: product } = await supabase
                .from("produtos")
                .select("ml_item_id")
                .eq("id", productId)
                .single();

            if (!product || !product.ml_item_id) {
                throw new Error("Produto não possui ID do Mercado Livre");
            }

            const response = await fetch(
                `/api/mercadolibre/items?itemId=${product.ml_item_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        status: "paused",
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Erro ao pausar produto: ${response.status}`,
                );
            }

            // Atualizar status no banco
            await supabase
                .from("produtos")
                .update({
                    ml_status: "paused",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", productId);

            return { status: "paused" };
        } catch (error) {
            console.error("Erro ao pausar produto:", error);
            throw error;
        }
    }

    // Reativar produto no ML
    async activateProduct(productId: string): Promise<{ status: string }> {
        try {
            const accessToken = await mercadoLivreService.getAccessToken();
            if (!accessToken) {
                throw new Error("Token de acesso não disponível");
            }

            const { data: product } = await supabase
                .from("produtos")
                .select("ml_item_id")
                .eq("id", productId)
                .single();

            if (!product || !product.ml_item_id) {
                throw new Error("Produto não possui ID do Mercado Livre");
            }

            const response = await fetch(
                `/api/mercadolibre/items?itemId=${product.ml_item_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        status: "active",
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Erro ao reativar produto: ${response.status}`,
                );
            }

            // Atualizar status no banco
            await supabase
                .from("produtos")
                .update({
                    ml_status: "active",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", productId);

            return { status: "active" };
        } catch (error) {
            console.error("Erro ao reativar produto:", error);
            throw error;
        }
    }

    // No products.ts - ATUALIZAR o método deleteProduct
    async deleteProduct(
        productId: string,
        mlItemId?: string,
    ): Promise<{ success: boolean; message?: string }> {
        try {
            console.log("🟡 [deleteProduct] Iniciando exclusão:", {
                productId,
                mlItemId,
            });

            const accessToken = await mercadoLivreService.getAccessToken();
            if (!accessToken) {
                throw new Error("Token de acesso não disponível");
            }

            let finalMlItemId = mlItemId;

            if (!finalMlItemId) {
                const { data: product } = await supabase
                    .from("produtos")
                    .select("ml_item_id")
                    .eq("id", productId)
                    .single();

                if (!product || !product.ml_item_id) {
                    throw new Error("Produto não possui ID do Mercado Livre");
                }
                finalMlItemId = product.ml_item_id;
            }

            if (!finalMlItemId) {
                throw new Error("ID do Mercado Livre não disponível");
            }

            // ✅ VERIFICAR STATUS ANTES DE EXCLUIR
            console.log("🔍 [deleteProduct] Verificando status do produto...");
            const statusResponse = await fetch(
                `https://api.mercadolibre.com/items/${finalMlItemId}`,
                {
                    headers: { "Authorization": `Bearer ${accessToken}` },
                },
            );

            if (!statusResponse.ok) {
                if (statusResponse.status === 404) {
                    console.log(
                        "ℹ️ [deleteProduct] Produto já não existe no ML",
                    );
                    await this.cleanupLocalData(productId);
                    return {
                        success: true,
                        message: "Produto já não existe no Mercado Livre",
                    };
                }
                throw new Error(
                    `Erro ao verificar status: ${statusResponse.status}`,
                );
            }

            const productData = await statusResponse.json();
            console.log("📊 [deleteProduct] Status atual:", productData.status);

            let needsClosing = false;

            // ✅ DEFINIR ESTRATÉGIA BASEADA NO STATUS
            if (productData.status === "closed") {
                console.log(
                    "✅ [deleteProduct] Produto já está FECHADO, marcando como DELETADO...",
                );
            } else if (
                productData.status === "active" ||
                productData.status === "paused"
            ) {
                console.log(
                    "🔄 [deleteProduct] Produto ATIVO/PAUSADO, fechando primeiro...",
                );
                needsClosing = true;
            } else {
                return {
                    success: false,
                    message:
                        `❌ Não é possível excluir produto com status "${productData.status}". Apenas produtos "active", "paused" ou "closed" podem ser excluídos.`,
                };
            }

            // ✅ PASSO 1: FECHAR SE NECESSÁRIO
            if (needsClosing) {
                console.log("🔄 [deleteProduct] Fechando anúncio...");
                const closeResponse = await fetch(
                    `https://api.mercadolibre.com/items/${finalMlItemId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: "closed" }),
                    },
                );

                if (!closeResponse.ok) {
                    const errorBody = await closeResponse.text();
                    throw new Error(
                        `Erro ao fechar anúncio: ${closeResponse.status} - ${errorBody}`,
                    );
                }

                console.log(
                    "⏳ [deleteProduct] Aguardando 2 segundos após fechar...",
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            // ✅ PASSO 2: MARCAR COMO DELETADO
            console.log("🗑️ [deleteProduct] Marcando como DELETADO...");
            const deleteResponse = await fetch(
                `https://api.mercadolibre.com/items/${finalMlItemId}`,
                {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ deleted: "true" }),
                },
            );

            console.log("📡 [deleteProduct] Resposta exclusão:", {
                status: deleteResponse.status,
                statusText: deleteResponse.statusText,
            });

            if (!deleteResponse.ok) {
                const errorBody = await deleteResponse.text();
                throw new Error(
                    `Erro ao excluir: ${deleteResponse.status} - ${errorBody}`,
                );
            }

            console.log(
                "✅ [deleteProduct] Produto excluído com sucesso no ML",
            );
            await this.cleanupLocalData(productId);
            return {
                success: true,
                message: "Produto excluído com sucesso do Mercado Livre",
            };
        } catch (error) {
            console.error("💥 [deleteProduct] Erro capturado:", error);
            throw error;
        }
    }

    private async cleanupLocalData(productId: string): Promise<void> {
        if (productId && !productId.startsWith("temp_")) {
            console.log(
                "🗃️ [cleanupLocalData] Limpando dados locais para:",
                productId,
            );
            const { error } = await supabase
                .from("produtos")
                .update({
                    ml_item_id: null,
                    ml_status: null,
                    publicar_ml: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", productId);

            if (error) {
                console.error(
                    "❌ [cleanupLocalData] Erro ao limpar dados:",
                    error,
                );
            } else {
                console.log("✅ [cleanupLocalData] Dados locais limpos");
            }
        }
    }

    async testDirectDelete(
        mlItemId: string,
    ): Promise<{ success: boolean; message: string }> {
        try {
            const accessToken = await mercadoLivreService.getAccessToken();
            if (!accessToken) {
                throw new Error("Token não disponível");
            }

            console.log(
                "🔧 [testDirectDelete] Testando exclusão CORRETA para:",
                mlItemId,
            );

            // ETAPA 1: Verificar produto ANTES
            console.log(
                "🔍 [testDirectDelete] ETAPA 1 - Verificando produto antes...",
            );
            const checkBefore = await fetch(
                `https://api.mercadolibre.com/items/${mlItemId}`,
                {
                    headers: { "Authorization": `Bearer ${accessToken}` },
                },
            );

            console.log(
                "📊 [testDirectDelete] Status ANTES:",
                checkBefore.status,
            );

            if (!checkBefore.ok) {
                return {
                    success: true,
                    message: "✅ Produto já não existe no ML",
                };
            }

            const productData = await checkBefore.json();
            console.log("📋 [testDirectDelete] Dados ANTES:", {
                id: productData.id,
                title: productData.title,
                status: productData.status,
            });

            // ✅ PASSO 1: FECHAR O ANÚNCIO (se não estiver já fechado)
            if (productData.status !== "closed") {
                console.log(
                    "🔄 [testDirectDelete] PASSO 1 - Fechando anúncio...",
                );
                const closeResponse = await fetch(
                    `https://api.mercadolibre.com/items/${mlItemId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            status: "closed",
                        }),
                    },
                );

                console.log("📡 [testDirectDelete] Resposta FECHAR:", {
                    status: closeResponse.status,
                    statusText: closeResponse.statusText,
                });

                if (!closeResponse.ok) {
                    const errorBody = await closeResponse.text();
                    return {
                        success: false,
                        message:
                            `❌ Erro ao fechar anúncio: ${closeResponse.status} - ${errorBody}`,
                    };
                }

                console.log(
                    "⏳ [testDirectDelete] Aguardando 2 segundos após fechar...",
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));
            } else {
                console.log(
                    "✅ [testDirectDelete] Anúncio já está FECHADO, indo para exclusão...",
                );
            }

            // ✅ PASSO 2: MARCAR COMO DELETADO
            console.log(
                "🗑️ [testDirectDelete] PASSO 2 - Marcando como DELETADO...",
            );
            const deleteResponse = await fetch(
                `https://api.mercadolibre.com/items/${mlItemId}`,
                {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        deleted: "true",
                    }),
                },
            );

            console.log("📡 [testDirectDelete] Resposta DELETAR:", {
                status: deleteResponse.status,
                statusText: deleteResponse.statusText,
            });

            const responseBody = await deleteResponse.text();
            console.log(
                "📄 [testDirectDelete] Corpo da resposta:",
                responseBody,
            );

            if (!deleteResponse.ok) {
                // Se der erro 409 (conflict), aguardar e tentar novamente
                if (deleteResponse.status === 409) {
                    console.log(
                        "⚠️ [testDirectDelete] Erro 409 - Aguardando 5 segundos e tentando novamente...",
                    );
                    await new Promise((resolve) => setTimeout(resolve, 5000));

                    const retryResponse = await fetch(
                        `https://api.mercadolibre.com/items/${mlItemId}`,
                        {
                            method: "PUT",
                            headers: {
                                "Authorization": `Bearer ${accessToken}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                deleted: "true",
                            }),
                        },
                    );

                    console.log("🔄 [testDirectDelete] Resposta RETRY:", {
                        status: retryResponse.status,
                        statusText: retryResponse.statusText,
                    });

                    if (!retryResponse.ok) {
                        const retryBody = await retryResponse.text();
                        return {
                            success: false,
                            message:
                                `❌ Erro na segunda tentativa: ${retryResponse.status} - ${retryBody}`,
                        };
                    }
                } else {
                    return {
                        success: false,
                        message:
                            `❌ Erro ao deletar: ${deleteResponse.status} - ${responseBody}`,
                    };
                }
            }

            // ETAPA 3: Verificar DEPOIS
            console.log(
                "⏳ [testDirectDelete] Aguardando 3 segundos após exclusão...",
            );
            await new Promise((resolve) => setTimeout(resolve, 3000));

            console.log("🔍 [testDirectDelete] Verificando produto DEPOIS...");
            const checkAfter = await fetch(
                `https://api.mercadolibre.com/items/${mlItemId}`,
                {
                    headers: { "Authorization": `Bearer ${accessToken}` },
                },
            );

            console.log(
                "📊 [testDirectDelete] Status DEPOIS:",
                checkAfter.status,
            );

            if (checkAfter.status === 404) {
                return {
                    success: true,
                    message: "✅ PRODUTO EXCLUÍDO COM SUCESSO!",
                };
            } else {
                // Se ainda existe, tentar verificar o status atual
                if (checkAfter.ok) {
                    const afterData = await checkAfter.json();
                    return {
                        success: false,
                        message:
                            `❌ FALHA NA EXCLUSÃO! Produto ainda existe. Status atual: ${afterData.status}`,
                    };
                } else {
                    return {
                        success: false,
                        message:
                            `❌ FALHA NA EXCLUSÃO! Status da verificação: ${checkAfter.status}`,
                    };
                }
            }
        } catch (error) {
            console.error("💥 [testDirectDelete] Erro:", error);
            return {
                success: false,
                message: `💥 ERRO: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            };
        }
    }

    // Fechar (finalizar) produto no ML
    async closeProduct(productId: string): Promise<{ status: string }> {
        try {
            const accessToken = await mercadoLivreService.getAccessToken();
            if (!accessToken) {
                throw new Error("Token de acesso não disponível");
            }

            const { data: product } = await supabase
                .from("produtos")
                .select("ml_item_id")
                .eq("id", productId)
                .single();

            if (!product || !product.ml_item_id) {
                throw new Error("Produto não possui ID do Mercado Livre");
            }

            const response = await fetch(
                `/api/mercadolibre/items?itemId=${product.ml_item_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        status: "closed",
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Erro ao fechar produto: ${response.status}`,
                );
            }

            // Atualizar status no banco
            await supabase
                .from("produtos")
                .update({
                    ml_status: "closed",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", productId);

            return { status: "closed" };
        } catch (error) {
            console.error("Erro ao fechar produto:", error);
            throw error;
        }
    }
}

export const mercadoLivreProductsService = new MercadoLivreProductsService();
