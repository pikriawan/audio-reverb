"use client";

import Home from "./home";
import NoSsrWrapper from "./no-ssr-wrapper";

export default function HomeWrapper({ dictionary }) {
    return (
        <NoSsrWrapper>
            <Home dictionary={dictionary} />
        </NoSsrWrapper>
    );
}
