import React from "react";
import {IntlProvider} from "react-intl";
import {render} from "@testing-library/react";
import {DEFAULT_LOCALE, intlMessages} from "@/lib/i18n";
import type {RenderOptions, RenderResult} from "@testing-library/react";

type WrapperProps = {children: React.ReactNode};

const IntlWrapper = ({children}: WrapperProps) => {
    return (
        <IntlProvider locale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={intlMessages}>
            {children}
        </IntlProvider>
    );
};

export function renderWithIntl(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
    return render(ui, {wrapper: IntlWrapper, ...options});
}
