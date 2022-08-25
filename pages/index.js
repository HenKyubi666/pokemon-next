import Head from "next/head";

import "bootstrap/dist/css/bootstrap.css";
import Image from "next/image";
import styles from "../styles/Home.module.css";

//  Components
import Loading from "../components/loading";
import { useEffect, useState } from "react";
export default function Home() {
  const [loading, setLoading] = useState(true);
  const switchLoading = () => {
    setTimeout(() => setLoading(!loading), 5000);
  };
  useEffect(() => switchLoading());
  return (
    <>
      <Head>
        <title>Pokedex NextJs</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      {loading && <Loading />}
    </>
  );
}
