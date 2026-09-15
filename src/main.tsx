import * as ReactDOM from "react-dom/client";
import {IntlProvider} from "react-intl";
import "./index.css";
import {App} from "./app.tsx";
import {DEFAULT_LOCALE, intlMessages} from "./lib/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <IntlProvider locale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={intlMessages}>
        <App />
    </IntlProvider>
);
