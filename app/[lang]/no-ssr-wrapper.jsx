import dynamic from "next/dynamic";

function NoSSRWrapper({ children }) {
    return <>{children}</>;
}

export default dynamic(() => Promise.resolve(NoSSRWrapper), { ssr: false });
