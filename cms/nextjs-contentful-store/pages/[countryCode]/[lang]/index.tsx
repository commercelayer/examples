import _ from "lodash";
import React from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import { useGetToken } from "@hooks/GetToken";
import Page from "@components/Page";
import Hero from "@components/Hero";
import Taxonomies from "@components/Taxonomies";
import { Country, Taxonomy } from "@typings/models";
import { parseLanguageCode } from "@utils/parser";
import contentfulApi from "@utils/contentful/api";

type Props = {
  lang: string;
  countries: Country[];
  country: Country;
  taxonomies: Taxonomy[];
  buildLanguages: Country[];
};

const HomePage: React.FC<Props> = ({ lang, countries, country, taxonomies, buildLanguages }) => {
  const languageCode = parseLanguageCode(lang, "toLowerCase", true);
  const countryCode = country.code.toLowerCase();
  const clMarketId = country.marketId;
  const clEndpoint = process.env.NEXT_PUBLIC_CL_ENDPOINT as string;
  const clToken = useGetToken({
    scope: clMarketId,
    countryCode: countryCode
  });

  return (
    <Page
      buildLanguages={buildLanguages}
      lang={lang}
      clToken={clToken}
      clEndpoint={clEndpoint}
      languageCode={languageCode}
      countryCode={countryCode}
      countries={countries}
    >
      <Hero lang={lang} />
      <Taxonomies taxonomies={taxonomies} />
    </Page>
  );
};

export default HomePage;

type Query = {
  lang: string;
  countryCode: string;
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking"
  };
};

export const getStaticProps: GetStaticProps<Props, Query> = async ({ params }) => {
  const { lang, countryCode } = params!;
  const countries = await contentfulApi.getAllCountries(lang);
  const country = countries.find(
    (currentCountry) => currentCountry.code.toLowerCase() === countryCode
  );
  const taxonomies = await contentfulApi.getAllTaxonomies(country!.catalog.id, lang);
  const buildLanguages = _.compact(
    process.env.BUILD_LANGUAGES?.split(",").map((language) => {
      const country = countries.find(
        (currentCountry) => currentCountry.code === parseLanguageCode(language)
      );
      return !_.isEmpty(country) ? country : null;
    })
  );

  if (!country) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      lang,
      countries,
      country,
      taxonomies,
      buildLanguages
    },
    revalidate: 60
  };
};
