import React from "react";
import {Button, Field, Input, InputGroup, Stack} from "@chakra-ui/react";
import {PlusIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {MerchantsRepository} from "@/data/merchantsRepository";
import type {Merchant} from "@/data/types";
import {messages} from "@/lib/i18n";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

type MerchantAutocompleteProps = {
    merchants: Merchant[];
    value: string;
    onChange: (merchant: Merchant | null) => void;
    error?: string;
};

export const MerchantAutocomplete = ({merchants, value, onChange, error}: MerchantAutocompleteProps) => {
    const intl = useIntl();
    const token = useAuthStore(state => state.token);
    const selected = merchants.find(merchant => merchant.id === value) ?? null;
    const [query, setQuery] = React.useState(selected?.name ?? "");
    const [results, setResults] = React.useState(merchants);
    const [isCreating, setCreating] = React.useState(false);
    const [createError, setCreateError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (token === null) return;
        const timer = window.setTimeout(() => {
            void new MerchantsRepository(token).search(query).then(result => {
                if (result.ok) setResults(result.value);
            });
        }, 300);
        return () => window.clearTimeout(timer);
    }, [query, token]);

    const updateQuery = (next: string) => {
        setQuery(next);
        const exact = merchants.find(merchant => merchant.name.localeCompare(next, "zh-HK", {sensitivity: "accent"}) === 0) ?? null;
        onChange(exact);
        setCreateError(null);
    };

    const createMerchant = async () => {
        if (token === null || query.trim() === "") return;
        setCreating(true);
        setCreateError(null);
        const result = await new MerchantsRepository(token).create({name: query.trim()});
        setCreating(false);
        if (!result.ok) {
            setCreateError(result.error.message || intl.formatMessage(messages.transactions.form.merchantCreateFailed));
            return;
        }
        const current = useAppStore.getState().merchants;
        useAppStore.getState().setMerchants([...current.filter(merchant => merchant.id !== result.value.id), result.value]);
        setResults(previous => [...previous.filter(merchant => merchant.id !== result.value.id), result.value]);
        setQuery(result.value.name);
        onChange(result.value);
    };

    const hasExactMatch = merchants.some(merchant => merchant.name.localeCompare(query.trim(), "zh-HK", {sensitivity: "accent"}) === 0);
    const listId = React.useId();

    return (
        <Field.Root invalid={error !== undefined}>
            <Field.Label>{intl.formatMessage(messages.transactions.form.merchant)}</Field.Label>
            <Stack gap="2" width="full">
                <InputGroup>
                    <Input
                        role="combobox"
                        aria-autocomplete="list"
                        aria-controls={listId}
                        list={listId}
                        value={query}
                        placeholder={intl.formatMessage(messages.transactions.form.merchantPlaceholder)}
                        onChange={event => updateQuery(event.target.value)}
                    />
                </InputGroup>
                <datalist id={listId}>
                    {results.map(merchant => (
                        <option key={merchant.id} value={merchant.name} />
                    ))}
                </datalist>
                {query.trim() !== "" && !hasExactMatch ? (
                    <Button type="button" size="sm" variant="outline" alignSelf="flex-start" loading={isCreating} onClick={createMerchant}>
                        <PlusIcon />
                        {intl.formatMessage(messages.transactions.form.createMerchant, {name: query.trim()})}
                    </Button>
                ) : null}
            </Stack>
            {error === undefined ? null : <Field.ErrorText>{error}</Field.ErrorText>}
            {createError === null ? null : <Field.ErrorText>{createError}</Field.ErrorText>}
        </Field.Root>
    );
};
