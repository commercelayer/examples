export interface Image {
  title: string;
  description?: string;
  file?: {
    url?: string;
    details?: {
      size: number;
      image: {
        width: number;
        height: number;
      };
    };
    fileName?: string;
    contentType: string;
  };
  url: string;
}

export interface SelectorObject {
  code: string;
  imageUrl: string;
}

export interface Country {
  name: string;
  code: string;
  catalog: {
    id: string;
  };
  marketId: string;
  image: {
    title: string;
    url: string;
  };
  defaultLocale: string;
  id: string;
}

export interface Catalog {
  name: string;
  taxonomies: Taxonomy[];
}

export interface Taxonomy {
  name: string;
  label: string;
  taxons: Taxon[];
}

export interface Taxon {
  name: string;
  label: string;
  slug: string;
  products: Product[];
}

export interface Product {
  name: string;
  description: string;
  slug: string;
  reference: string;
  images: Image[];
  variants: Variant[];
}

export interface Variant {
  name: string;
  code: string;
  description: string;
  images?: Image[];
  size?: Size;
}

export interface Size {
  name: string;
}
