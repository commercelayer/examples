import _ from "lodash";
import React, { useState, useEffect } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import IframeResizer from "iframe-resizer-react";
import { useOrderContainer } from "@commercelayer/react-components/hooks/useOrderContainer";
import Page from "@components/Page";
import { useGetToken } from "@hooks/GetToken";
import { Country } from "@typings/models";
import { parseLanguageCode, parseEndpoint } from "@utils/parser";
import contentfulApi from "@utils/contentful/api";

type CartProps = {
  countryCode: string;
  slug: string;
  clToken: string;
};

type Props = {
  lang: string;
  countries: Country[];
  country: Country | undefined;
  buildLanguages: Country[];
};

const CartIframe: React.FC<CartProps> = ({ countryCode, slug, clToken }) => {
  const [cartUrl, setCartUrl] = useState<string | null>(null);
  const { reloadOrder, order } = useOrderContainer();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (isMounted) {
        if (clToken && slug) {
          const persistKey = `cl_order-${countryCode}`;
          const orderFromStorage = localStorage.getItem(persistKey);

          if (orderFromStorage === null) {
            setCartUrl(
              `https://${slug}.commercelayer.app/cart/null?embed=true&accessToken=${clToken}`
            );
          } else {
            if (order !== undefined) {
              setCartUrl(
                `https://${slug}.commercelayer.app/cart/${order.id}?embed=true&accessToken=${clToken}`
              );
            }
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [slug, order, clToken, countryCode]);

  return (
    <div className="container mx-auto max-w-screen-lg px-5 lg:px-0">
      {cartUrl && (
        <IframeResizer
          checkOrigin={false}
          onMessage={(event) => {
            if (event.message.type === "update") {
              reloadOrder();
            }
          }}
          style={{ width: "1px", minWidth: "100%" }}
          src={cartUrl}
        />
      )}
    </div>
  );
};

const ShoppingBagPage: React.FC<Props> = ({ lang, countries, country, buildLanguages }) => {
  const languageCode = parseLanguageCode(lang, "toLowerCase", true);
  const countryCode = country?.code.toLowerCase() as string;
  const clMarketId = country?.marketId as string;
  const clEndpoint = process.env.NEXT_PUBLIC_CL_ENDPOINT as string;
  const clSlug = parseEndpoint(clEndpoint);
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
      <CartIframe countryCode={countryCode} slug={clSlug} clToken={clToken} />
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
