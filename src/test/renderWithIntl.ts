import React from "react";
import {ChakraProvider} from "@chakra-ui/react";
import {IntlProvider} from "react-intl";
import {render} from "@testing-library/react";
import {DEFAULT_LOCALE, intlMessages} from "@/lib/i18n";
import {system} from "@/theme/system";
import type {RenderOptions, RenderResult} from "@testing-library/react";

type WrapperProps = {children: React.ReactNode};

/** Test 要與 main.tsx 一樣包 Chakra 及 intl，否則 Chakra component 取不到 system。 */
function AppProviders({children}: WrapperProps): React.ReactElement {
    const intlProvider = React.createElement(IntlProvider, {locale: DEFAULT_LOCALE, defaultLocale: DEFAULT_LOCALE, messages: intlMessages, children});
    return React.createElement(ChakraProvider, {value: system, children: intlProvider});
}

export function renderWithIntl(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult {
    return render(ui, {wrapper: AppProviders, ...options});
}
