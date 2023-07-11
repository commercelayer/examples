import _ from "lodash";
import React from "react";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useGetToken } from "@hooks/GetToken";
import Page from "@components/Page";
import Hero from "@components/Hero";
import Taxonomies from "@components/Taxonomies";
import { Country } from "@typings/models";
import { parseLanguageCode } from "@utils/parser";
import contentfulApi from "@utils/contentful/api";

type Props = {
  lang: string;
  buildLanguages?: Country[];
  country: {
    code: string;
    defaultLocale: string;
    marketId: string;
  };
  countries?: any[];
  taxonomies: any;
};

const HomePage: NextPage<Props> = ({
  lang,
  buildLanguages = [],
  country,
  countries = [],
  taxonomies
}) => {
  const languageCode = parseLanguageCode(lang, "toLowerCase", true);
  const countryCode = country?.code.toLowerCase() as string;
  const clMarketId = country?.marketId as string;
  const clEndpoint = process.env.NEXT_PUBLIC_CL_ENDPOINT as string;
  const clToken = useGetToken({
    scope: clMarketId,
    countryCode: countryCode
  });

  return !lang ? null : (
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

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const lang = params?.lang as string;
    const countryCode = params?.countryCode as string;
    const countries = await contentfulApi.getAllCountries(lang);
    const country = countries.find((countryItem) => countryItem.code.toLowerCase() === countryCode);
    const buildLanguages = _.compact(
      process.env.BUILD_LANGUAGES?.split(",").map((language) => {
        const country = countries.find(
          (countryItem) => countryItem.code === parseLanguageCode(language)
        );
        return !_.isEmpty(country) ? country : null;
      })
    );
    const taxonomies = await contentfulApi.getAllTaxonomies(country!.catalog.id, lang);

    return {
      props: {
        buildLanguages,
        lang,
        countries,
        country,
        taxonomies
      },
      revalidate: 60
    };
  } catch (err: any) {
    console.error(err);
    return {
      props: {
        errors: err.message
      },
      revalidate: 60
    };
  }
};
