import _ from "lodash";
import Image from "next/image";
import { GetStaticProps, NextPage } from "next";
import SEOHead from "@components/SEO";
import Countries from "@components/Countries";
import { Country } from "@typings/models";
import contentfulApi from "@utils/contentful/api";

type Props = {
  countries: Country[];
};

const IndexPage: NextPage<Props> = ({ countries }) => {
  return (
    <>
      <SEOHead />
      <div className="m-16 mx-auto container">
        <Countries items={countries} />
      </div>
      <hr />
      <Image
        className="h-8 mx-auto m-12 md:mt-16"
        src="//data.commercelayer.app/assets/logos/full-logo/black/commercelayer_full_logo_black.svg"
        alt="Commerce Layer Logo"
        loading="eager"
        width={200}
        height={50}
      />
      <br />
    </>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const countries = await contentfulApi.getAllCountries("en-US");
  return {
    props: {
      countries
    },
    revalidate: false
  };
};

export default IndexPage;
