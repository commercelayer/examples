import { createClient, type Asset, type Entry } from "contentful";
import type {
  CatalogSkeleton,
  CountrySkeleton,
  ProductSkeleton,
  TaxonSkeleton,
  TaxonomySkeleton,
  VariantSkeleton
} from "./typings";
import type { Country, Image, Product, Taxon, Taxonomy, Variant } from "@typings/models";

/**
 * `withoutUnresolvableLinks` makes the SDK type (and return) every link that
 * cannot be resolved as `undefined` rather than a raw `UnresolvedLink` object,
 * so the parsers below can simply skip incomplete content.
 */
type Modifiers = "WITHOUT_UNRESOLVABLE_LINKS";

const client = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID as string,
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_ACCESS_TOKEN as string
}).withoutUnresolvableLinks;

/** Contentful stores asset URLs protocol-relative (`//images.ctfassets.net/...`). */
function parseAsset(asset?: Asset<Modifiers>): Image | null {
  const url = asset?.fields.file?.url;
  if (!url) return null;
  return {
    title: asset?.fields.title ?? "",
    url: `https:${url}`
  };
}

function parseAssets(assets?: (Asset<Modifiers> | undefined)[]): Image[] {
  return (assets ?? []).map(parseAsset).filter((image): image is Image => image !== null);
}

function parseVariant(variant?: Entry<VariantSkeleton, Modifiers>): Variant | null {
  if (!variant) return null;
  const { name, code, description, images, size } = variant.fields;
  const sizeName = size?.fields.name;
  if (!code || !sizeName) return null;
  return {
    name,
    code,
    description: description ?? "",
    images: parseAssets(images),
    size: { name: sizeName }
  };
}

function parseProduct(product?: Entry<ProductSkeleton, Modifiers>): Product | null {
  if (!product) return null;
  const { name, description, slug, reference, images, variants } = product.fields;
  if (!slug) return null;
  return {
    name,
    description: description ?? "",
    slug,
    reference: reference ?? "",
    images: parseAssets(images),
    variants: (variants ?? [])
      .map(parseVariant)
      .filter((variant): variant is Variant => variant !== null)
  };
}

function parseTaxon(taxon?: Entry<TaxonSkeleton, Modifiers>): Taxon | null {
  if (!taxon) return null;
  const { name, label, slug, products } = taxon.fields;
  return {
    name,
    label: label ?? "",
    slug: slug ?? "",
    products: (products ?? [])
      .map(parseProduct)
      .filter((product): product is Product => product !== null)
  };
}

function parseTaxonomy(taxonomy?: Entry<TaxonomySkeleton, Modifiers>): Taxonomy | null {
  if (!taxonomy) return null;
  const { name, label, taxons } = taxonomy.fields;
  return {
    name,
    label: label ?? "",
    taxons: (taxons ?? []).map(parseTaxon).filter((taxon): taxon is Taxon => taxon !== null)
  };
}

function parseCountry(country: Entry<CountrySkeleton, Modifiers>): Country | null {
  const { name, code, catalog, marketCode, image, defaultLocale } = country.fields;
  const parsedImage = parseAsset(image);
  if (!code || !catalog || !parsedImage) return null;
  return {
    name,
    code,
    catalog: { id: catalog.sys.id },
    marketCode: marketCode ?? "",
    image: parsedImage,
    defaultLocale: defaultLocale ?? "",
    id: country.sys.id
  };
}

/** Normalises `en-us` / `en` style values to the `en-US` casing Contentful expects. */
const getLocale = (locale: string) => {
  const [language, region] = locale.split("-");
  return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language;
};

export const getAllCountries = async (locale: string): Promise<Country[]> => {
  const countries = await client.getEntries<CountrySkeleton>({
    content_type: "country",
    order: ["fields.name"],
    locale: getLocale(locale)
  });
  return countries.items
    .map(parseCountry)
    .filter((country): country is Country => country !== null);
};

export const getAllTaxonomies = async (catalogId: string, locale: string): Promise<Taxonomy[]> => {
  const catalogs = await client.getEntries<CatalogSkeleton>({
    content_type: "catalog",
    "sys.id": catalogId,
    locale: getLocale(locale),
    include: 5
  });
  return catalogs.items.flatMap((catalog) =>
    (catalog.fields.taxonomies ?? [])
      .map(parseTaxonomy)
      .filter((taxonomy): taxonomy is Taxonomy => taxonomy !== null)
  );
};

export const getProduct = async (slug: string, locale: string): Promise<Product | null> => {
  const products = await client.getEntries<ProductSkeleton>({
    content_type: "product",
    "fields.slug": slug,
    locale: getLocale(locale),
    include: 2,
    limit: 1
  });
  return parseProduct(products.items[0]);
};

const contentfulApi = {
  getAllCountries,
  getAllTaxonomies,
  getProduct
};

export default contentfulApi;
