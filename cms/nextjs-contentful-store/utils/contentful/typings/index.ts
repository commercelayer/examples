import { Entry } from "contentful";
import { Country, Catalog, Product, Taxon, Taxonomy, Size, Variant } from "@typings/models";

export type ContentfulImage = Entry<{
  title: string;
  file: {
    url: string;
    contentType: string;
  };
}>;

export type ContentfulCountry = Entry<
  {
    catalog: Entry<ContentfulCatalog>;
    image: ContentfulImage;
  } & Country
>;

export type ContentfulCatalog = Entry<
  {
    taxonomies: ContentfulTaxonomy[];
  } & Catalog
>;

export type ContentfulTaxonomy = Entry<
  {
    taxons: ContentfulTaxon[];
  } & Taxonomy
>;

export type ContentfulTaxon = Entry<
  {
    images: ContentfulImage[];
    products: ContentfulProduct[];
    taxons: ContentfulTaxon[];
  } & Taxon
>;

export type ContentfulProduct = Entry<
  {
    variants: ContentfulVariant[];
    images: ContentfulImage[];
  } & Product
>;

export type ContentfulVariant = Entry<
  {
    images: ContentfulImage[];
    size: ContentfulSize;
  } & Variant
>;

export type ContentfulSize = Entry<Size>;
