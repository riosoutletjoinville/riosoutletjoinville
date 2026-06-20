// src/types/mercadolibre.ts
export interface MLProduct {
  id?: string;
  title: string;
  category_id: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  buying_mode: string;
  condition: string;
  listing_type_id: string;
  description: {
    plain_text: string;
  };
  pictures: Array<{
    source: string;
  }>;
  attributes: Array<{
    id: string;
    value_name: string;
  }>;
  sale_terms?: Array<{
    id: string;
    value_name: string;
  }>;
  shipping: {
    mode: string;
    dimensions?: string;
    local_pick_up?: boolean;
    free_shipping?: boolean;
  };
}

export interface MLOrder {
  id: string;
  status: string;
  date_created: string;
  date_closed: string;
  total_amount: number;
  paid_amount: number;
  shipping: {
    id: number;
    status: string;
  };
  buyer: {
    id: number;
    nickname: string;
    email: string;
  };
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    variation_id?: string;
  }>;
}

export interface MLQuestion {
  id: string;
  item_id: string;
  text: string;
  date_created: string;
  status: string;
  from: {
    id: string;
    nickname: string;
  };
}

export interface MLCategory {
  id: string;
  name: string;
  picture?: string;
  permalink?: string;
  total_items_in_this_category?: number;
  path_from_root: Array<{
    id: string;
    name: string;
  }>;
  children_categories?: MLCategory[];
  settings: {
    adult_content: boolean;
    buying_allowed: boolean;
    buying_modes: string[];
    catalog_domain: string;
    coverage_areas: string;
    currencies: string[];
    fragile: boolean;
    immediate_payment: string;
    item_conditions: string[];
    items_reviews_allowed: boolean;
    listing_allowed: boolean;
    max_description_length: number;
    max_pictures_per_item: number;
    max_pictures_per_item_var: number;
    max_sub_title_length: number;
    max_title_length: number;
    maximum_price?: number;
    minimum_price?: number;
    mirror_category?: string;
    mirror_master_category?: string;
    mirror_slave_categories: string[];
    price: string;
    reservation_allowed: string;
    restrictions: unknown[];
    rounded_address: boolean;
    seller_contact: string;
    shipping_options: string[];
    shipping_profile: string;
    show_contact_information: boolean;
    simple_shipping: string;
    stock: string;
    sub_vertical: string;
    subscribable: boolean;
    tags: string[];
    vertical: string;
    vip_subdomain: string;
    buyer_protection_programs: string[];
    status: string;
  };
}

export interface MLAttribute {
  id: string;
  name: string;
  value_id?: string;
  value_name?: string;
  value_type: string;
  values: Array<{
    id?: string;
    name?: string;
    struct?: unknown;
  }>;
  allowed_units?: Array<{
    id: string;
    name: string;
  }>;
  default_unit?: string;
  tags: {
    hidden?: boolean;
    multivalued?: boolean;
    read_only?: boolean;
    required?: boolean;
    validated?: boolean;
    catalog_required?: boolean;
  };
  hierarchy?: string;
  relevance?: number;
  attribute_group_id: string;
  attribute_group_name: string;
}