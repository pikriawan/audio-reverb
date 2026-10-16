import "server-only";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";

const dictionaries = {
    en: () => import("./dictionaries/en.json").then((module) => module.default),
    id: () => import("./dictionaries/id.json").then((module) => module.default)
};

export const hasLocale = (locale) => locale in dictionaries;

export const getDictionary = async () => {
    const locale = await lang();

    if (!hasLocale(locale)) {
        notFound();
    }

    return dictionaries[locale]();
};
