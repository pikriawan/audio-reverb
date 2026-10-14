import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextResponse } from "next/server";

let locales = ["en-US", "id-ID"];

function getLocale(request) {
    let languages = new Negotiator({ headers: request.headers }).languages();
    let defaultLocale = "en-US";
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
    matcher: [
        "/((?!_next).*)"
    ]
};
