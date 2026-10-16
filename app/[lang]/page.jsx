import { getDictionary } from "@/get-dictionary";
import HomeWrapper from "./home-wrapper";

export default async function HomePage({ params }) {
    const { lang } = await params;
    const dictionary = await getDictionary(lang);

    return <HomeWrapper dictionary={dictionary} />;
}
