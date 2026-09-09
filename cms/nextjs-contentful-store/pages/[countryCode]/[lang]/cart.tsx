import _ from "lodash";
import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { HostedCart } from "@commercelayer/react-components";
import Page from "@components/Page";
import { useGetToken } from "@hooks/GetToken";
import { Country } from "@typings/models";
import { parseLanguageCode } from "@utils/parser";
import contentfulApi from "@utils/contentful/api";

type Props = {
  lang: string;
  countries: Country[];
  country: Country;
  buildLanguages: Country[];
};

const ShoppingBagPage: React.FC<Props> = ({ lang, countries, country, buildLanguages }) => {
  const languageCode = parseLanguageCode(lang, "toLowerCase", true);
  const countryCode = country.code.toLowerCase();
  const clMarketCode = country.marketCode;
  const clToken = useGetToken({
    scope: clMarketCode,
    countryCode: countryCode
  });

  return (
    <Page
      buildLanguages={buildLanguages}
      lang={lang}
      clToken={clToken}
      languageCode={languageCode}
      countryCode={countryCode}
      countries={countries}
    >
      {/*
        `min-h-*` is required, not cosmetic: <HostedCart> styles its iframe with
        `height: 100%` / `min-height: 100%`, which resolve against this container. With
        an auto-height parent they collapse to 0 and the cart looks empty until
        iframe-resizer reports the content height. Giving the container a floor keeps
        the iframe visible in the meantime.
      */}
      <div className="container mx-auto max-w-screen-lg px-5 lg:px-0 min-h-[550px]">
        {/*
          Embeds the Commerce Layer hosted cart as a self-resizing iframe. It reads the
          order and access token from the surrounding `<Order>` and drives the height via
          iframe-resizer internally, so it replaces the hand-rolled iframe (and the
          direct iframe-resizer dependency) this page used before.

          It decodes the access token to resolve the organization, so it must not render
          until `useGetToken` has resolved one — during SSR the token is still empty.
        */}
        {clToken && <HostedCart />}
      </div>
    </Page>
  );
};

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
      buildLanguages
    }
  };
};

export default ShoppingBagPage;
