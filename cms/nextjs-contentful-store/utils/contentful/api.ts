import _ from "lodash";
import { createClient, ContentfulClientApi } from "contentful";
import {
  ContentfulImage,
  ContentfulProduct,
  ContentfulCountry,
  ContentfulCatalog
} from "./typings";
import { Taxonomy } from "@typings/models";

type GetClient = () => ContentfulClientApi | null;

const client: GetClient = () =>
  createClient({
    space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID as string,
    accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_DELIVERY_ACCESS_TOKEN as string
  });

function parseImage(entry: ContentfulImage) {
  return {
    title: entry.fields.title,
    url: `https:${entry.fields.file.url}`
  };
}

function parseCountries(entries: ContentfulCountry[]) {
  const countries = entries?.map(({ fields, sys }: ContentfulCountry) => {
    return {
      ...fields,
      catalog: {
        id: fields.catalog.sys.id
      },
      id: sys.id,
      image: parseImage(fields.image)
    };
  });
  return countries;
}

function parseTaxonomies(catalogs: ContentfulCatalog[], items: Taxonomy[] = []) {
  catalogs.map((catalog) => {
    catalog.fields.taxonomies.map((taxonomy) => {
      const { fields } = taxonomy;
      const taxons = fields.taxons.map((taxon) => {
        const products = !_.isEmpty(taxon.fields.products)
          ? taxon.fields.products.map((product) => {
              const images = product.fields.images.map((image) => {
                const url = `https:${image.fields.file.url}`;
                return { ...image.fields, url };
              });
              const variants = product.fields.variants.map((variant) => {
                return {
                  name: variant.fields.name,
                  code: variant.fields.code,
                  description: variant.fields.description
                };
              });
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
  const { fields } = product!;
  const variants = fields.variants.map((variant) => {
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
  const images = fields.images.map((image) => {
    const url = `https:${image.fields.file.url}`;
    return { ...image.fields, url };
  });
  return {
    ...fields,
    variants,
    images
  };
}

const getLocale = (locale: string) => {
  const lang = locale.split("-");
  return lang.length > 1 ? `${lang[0].toLowerCase()}-${lang[1].toUpperCase()}` : _.first(lang);
};

export const getAllCountries = async (locale: string) => {
  const countries = await client()?.getEntries({
    content_type: "country",
    order: "fields.name",
    locale: getLocale(locale)
  });
  return parseCountries(countries!.items as ContentfulCountry[]);
};

export const getAllTaxonomies = async (catalogId: string, locale: string) => {
  const catalog = await client()?.getEntries({
    content_type: "catalog",
    "sys.id": catalogId,
    locale: getLocale(locale),
    include: 4
  });
  return parseTaxonomies(catalog!.items as ContentfulCatalog[]);
};

export const getProduct = async (slug: string, locale: string) => {
  const lang = getLocale(locale);
  const products = await client()?.getEntries<ContentfulProduct["fields"]>({
    content_type: "product",
    include: 2,
    locale: lang,
    "fields.slug[localeCode]": slug
  });
  const item = _.first(products!.items.filter((product) => product.fields.slug === slug));
  return parseProduct(item);
};

const contentfulApi = {
  getAllCountries,
  getAllTaxonomies,
  getProduct
};

export default contentfulApi;
