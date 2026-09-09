import type { EntryFieldTypes, EntrySkeletonType } from "contentful";

/**
 * Content type skeletons for the Contentful Delivery API.
 *
 * Since contentful v10 the SDK is typed from "skeletons" (`{ contentTypeId, fields }`)
 * describing the *raw* field types, and it derives the resolved `Entry<Skeleton>` shape
 * itself. These mirror the content types created by `pnpm run import-seed`
 * (see `data/contentful-seed.json`).
 *
 * The parsed, UI-facing shapes live in `@typings/models` instead.
 */

export type SizeSkeleton = EntrySkeletonType<
  {
    name: EntryFieldTypes.Symbol;
  },
  "size"
>;

export type VariantSkeleton = EntrySkeletonType<
  {
    name: EntryFieldTypes.Symbol;
    code: EntryFieldTypes.Symbol;
    description: EntryFieldTypes.Text;
    images: EntryFieldTypes.Array<EntryFieldTypes.AssetLink>;
    size: EntryFieldTypes.EntryLink<SizeSkeleton>;
    bundle: EntryFieldTypes.Symbol;
  },
  "variant"
>;

export type ProductSkeleton = EntrySkeletonType<
  {
    name: EntryFieldTypes.Symbol;
    description: EntryFieldTypes.Text;
    slug: EntryFieldTypes.Symbol;
    reference: EntryFieldTypes.Symbol;
    images: EntryFieldTypes.Array<EntryFieldTypes.AssetLink>;
    variants: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<VariantSkeleton>>;
  },
  "product"
>;

export type TaxonSkeleton = EntrySkeletonType<
  {
    name: EntryFieldTypes.Symbol;
    label: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    description: EntryFieldTypes.Text;
    images: EntryFieldTypes.Array<EntryFieldTypes.AssetLink>;
    products: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<ProductSkeleton>>;
    taxons: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TaxonSkeleton>>;
  },
  "taxon"
>;

export type TaxonomySkeleton = EntrySkeletonType<
  {
    name: EntryFieldTypes.Symbol;
    label: EntryFieldTypes.Symbol;
    taxons: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TaxonSkeleton>>;
  },
  "taxonomy"
>;

export type CatalogSkeleton = EntrySkeletonType<
  {
    name: EntryFieldTypes.Symbol;
    taxonomies: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TaxonomySkeleton>>;
  },
  "catalog"
>;

export type CountrySkeleton = EntrySkeletonType<
  {
    name: EntryFieldTypes.Symbol;
    code: EntryFieldTypes.Symbol;
    catalog: EntryFieldTypes.EntryLink<CatalogSkeleton>;
    marketCode: EntryFieldTypes.Symbol;
    image: EntryFieldTypes.AssetLink;
    defaultLocale: EntryFieldTypes.Symbol;
    domain: EntryFieldTypes.Symbol;
  },
  "country"
>;
