import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Next.js signature verification</title>
        <meta
          name="description"
          content="Verify the authenticity of Commerce Layer webhook callbacks with Next.js."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Next.js signature verification example!</h1>
        <p className={styles.description}>
          Point your Commerce Layer webhook to <code className={styles.code}>/api/verify</code> to
          check the <code className={styles.code}>X-CommerceLayer-Signature</code> header.
        </p>
      </main>
    </div>
  );
}
