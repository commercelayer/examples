import _ from "lodash";
import { createClient, ContentfulClientApi, Entry } from "contentful";
import {
  ContentfulProduct,
  ContentfulCountry,
  ContentfulCatalog,
  ContentfulTaxonomy,
  ContentfulTaxon
} from "./typings";
import { Taxonomy, Taxon } from "../../typings/models";

type GetClient = () => ContentfulClientApi | null;

const client: GetClient = () =>
  createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID as string,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_ACCESS_TOKEN as string
  });

const getLocale = (locale: string) => {
  const lang = locale.split("-");
  return lang.length > 1 ? `${lang[0].toLowerCase()}-${lang[1].toUpperCase()}` : _.first(lang);
};

type ImageEntry = Entry<{
  title: string;
  file: {
    url: string;
    contentType: string;
  };
}>;

function parseImage(entry: ImageEntry) {
  return {
    title: entry.fields.title,
    url: `https:${entry.fields.file.url}`
  };
}

export type Country = Entry<{
  name: string;
  code: string;
  catalog: Entry<ContentfulCatalog>;
  defaultLocale: string;
  market_id: string;
  domain: string;
  image: ImageEntry;
}>;

function parseCountry({ fields, sys }: Country) {
  const catalog = {
    ...fields.catalog.fields,
    id: fields.catalog.sys.id
  };
  return {
    ...fields,
    catalog,
    id: sys.id,
    image: parseImage(fields.image)
  };
}

type CountryEntries = {
  items: Country[];
};

export async function getCountry(countryCode: string, locale = "en-US") {
  const res = await client()?.getEntries<ContentfulCountry["fields"]>({
    content_type: "country",
    include: 2,
    locale: getLocale(locale),
    "fields.code": countryCode.toUpperCase()
  });
  return _.first(res?.items);
}

function parseCountryEntries(entries: CountryEntries, cb = parseCountry) {
  return entries?.items?.map(cb);
}

export const allCountries = async (locale = "en-US") => {
  const countries = await client()?.getEntries({
    content_type: "country",
    order: "fields.name",
    locale: getLocale(locale)
  });
  return parseCountryEntries(countries as CountryEntries);
};

function parseTaxonomies(catalogs: ContentfulCatalog[], items: Taxonomy[] = []) {
  catalogs.map((catalog) => {
    catalog.fields.taxonomies.map((taxonomy: ContentfulTaxonomy) => {
      const { fields } = taxonomy;
      const taxons = fields.taxons.map((taxon: ContentfulTaxon) => {
        const products = !_.isEmpty(taxon.fields.products)
          ? taxon.fields.products.map((product) => {
              const images = product.fields.images.map((image) => {
                const url = `https:${image.fields.file.url}`;
                return { ...image.fields, url };
              });
              const variants = product.fields.variants.map((variant) => variant.fields);
              return { ...product.fields, images, variants };
            })
          : [];
        return { ...taxon.fields, products };
      });
      items.push({ ...fields, taxons });
    });
  });
  return items;
}

export const allTaxonomies = async (catalogId: string, locale = "en-US") => {
  const catalog: any = await client()?.getEntries({
    content_type: "catalog",
    "sys.id": catalogId,
    locale: getLocale(locale),
    include: 4
  });
  return parseTaxonomies(catalog.items);
};

export const allTaxons = async (locale = "en-US"): Promise<Taxon[]> => {
  const taxons: any = await client()?.getEntries({
    content_type: "taxon",
    locale: getLocale(locale),
    include: 2
  });
  return taxons.items.map((taxon: ContentfulTaxon) => taxon.fields);
};

export async function getAllProducts(locale = "en-US") {
  const categories: any = await client()?.getEntries({
    content_type: "category",
    locale: getLocale(locale)
  });
  return parseTaxonomies(categories.items);
}

export const getAllProductsByLocale = async () => {
  const languages = process.env.BUILD_LANGUAGES as string;
  const promises: any[] = [];
  languages.split(",").forEach((language) => {
    promises.push(getAllProducts(language));
  });
  try {
    const products = await Promise.all(promises);
    return _.concat([], ...products);
  } catch (err) {
    console.error("Error while fetching products:", err);
    return [];
  }
};

function parseProduct(product?: ContentfulProduct) {
  if (!product) return {};
  const p = product.fields;
  const variants = p.variants.map((variant) => {
    const images = variant.fields.images.map((image) => {
      const url = `https:${image.fields.file.url}`;
      return { ...image.fields, url };
    });
    const size = variant.fields.size.fields;
    return {
      ...variant.fields,
      images,
      size
    };
  });
  const images = p.images.map((image) => {
    const url = `https:${image.fields.file.url}`;
    return { ...image.fields, url };
  });
  return {
    ...p,
    variants,
    images
  };
}

export async function getProduct(slug: string, locale = "en-US") {
  const lang = getLocale(locale);
  const products = await client()?.getEntries<ContentfulProduct["fields"]>({
    content_type: "product",
    include: 2,
    locale: lang,
    "fields.slug[localeCode]": slug
  });
  const item = _.first(products?.items.filter((product) => product.fields.slug === slug));
  return parseProduct(item);
}

const contentfulApi: Record<string, any> = {
  allCountries,
  allTaxonomies,
  getProduct
};

export default contentfulApi;
