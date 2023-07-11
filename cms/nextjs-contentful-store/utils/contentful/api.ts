import _ from "lodash";
import { createClient, ContentfulClientApi, Entry } from "contentful";
import {
  ContentfulProduct,
  ContentfulCatalog,
  ContentfulTaxonomy,
  ContentfulTaxon
} from "./typings";
import { Taxonomy } from "../../typings/models";

type GetClient = () => ContentfulClientApi | null;

type ImageEntry = Entry<{
  title: string;
  file: {
    url: string;
    contentType: string;
  };
}>;

export type Country = Entry<{
  name: string;
  code: string;
  catalog: Entry<ContentfulCatalog>;
  defaultLocale: string;
  market_id: string;
  domain: string;
  image: ImageEntry;
}>;

type CountryEntries = {
  items: Country[];
};

function parseImage(entry: ImageEntry) {
  return {
    title: entry.fields.title,
    url: `https:${entry.fields.file.url}`
  };
}

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

function parseCountryEntries(entries: CountryEntries, cb = parseCountry) {
  return entries?.items?.map(cb);
}

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

function parseProduct(product?: ContentfulProduct) {
  if (!product) return {};
  const singleProduct = product.fields;
  const variants = singleProduct.variants.map((variant) => {
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
  const images = singleProduct.images.map((image) => {
    const url = `https:${image.fields.file.url}`;
    return { ...image.fields, url };
  });
  return {
    ...singleProduct,
    variants,
    images
  };
}

const client: GetClient = () =>
  createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID as string,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_ACCESS_TOKEN as string
  });

const getLocale = (locale: string) => {
  const lang = locale.split("-");
  return lang.length > 1 ? `${lang[0].toLowerCase()}-${lang[1].toUpperCase()}` : _.first(lang);
};

export const getAllCountries = async (locale = "en-US") => {
  const countries = await client()?.getEntries({
    content_type: "country",
    order: "fields.name",
    locale: getLocale(locale)
  });
  return parseCountryEntries(countries as CountryEntries);
};

export const getAllTaxonomies = async (catalogId: string, locale = "en-US") => {
  const catalog: any = await client()?.getEntries({
    content_type: "catalog",
    "sys.id": catalogId,
    locale: getLocale(locale),
    include: 4
  });
  return parseTaxonomies(catalog.items as ContentfulCatalog[]);
};

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

const contentfulApi = {
  getAllCountries,
  getAllTaxonomies,
  getProduct
};

export default contentfulApi;
