import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextResponse } from "next/server";

const locales = ["en", "id"];

function getLocale(request) {
    const headers = { "accept-language": request.headers.get("accept-language") };
    let languages = new Negotiator({ headers }).languages();
    let defaultLocale = "en";
    return match(languages, locales, defaultLocale);
}

export function proxy(request) {
    const { pathname } = request.nextUrl;
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
        return;
    }

    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;

    return NextResponse.redirect(request.nextUrl);
}

export const config = {
    matcher: ["/"]
};
