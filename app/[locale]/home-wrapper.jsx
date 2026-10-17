"use client";

import dynamic from "next/dynamic";

const Home = dynamic(() => import("./home"), { ssr: false });

export default Home;
