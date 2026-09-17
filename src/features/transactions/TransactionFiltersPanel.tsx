import React from "react";
import {Badge, Box, Button, CloseButton, Drawer, Field, Input, NativeSelect, Popover, Portal, SimpleGrid, Stack, Text} from "@chakra-ui/react";
import {SlidersHorizontalIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {DrawerActions} from "@/components/layout/DrawerActions";
import {DrawerBody} from "@/components/layout/DrawerBody";
import type {Account, Category, Merchant, TransactionFilters} from "@/data/types";
import {EMPTY_FILTER_DRAFT, toFilterDraft, toTransactionFilters} from "@/features/transactions/transactionsFormat";
import type {TransactionFilterDraft} from "@/features/transactions/transactionsFormat";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {messages} from "@/lib/i18n";

const FORM_ID = "transaction-filters-form";

type TransactionFiltersPanelProps = {
    filters: TransactionFilters;
    activeCount: number;
    accounts: Account[];
    categories: Category[];
    merchants: Merchant[];
    onApply: (next: TransactionFilters) => void;
    onReset: () => void;
};

/**
 * 進階篩選：desktop 用貼住按鈕的 popover（不要佔滿整頁），mobile 用底部彈出的 drawer。
 * 草稿只在按「套用篩選」時才寫入 URL，避免每改一個欄位就重新查詢。
 */
export const TransactionFiltersPanel = ({filters, activeCount, accounts, categories, merchants, onApply, onReset}: TransactionFiltersPanelProps) => {
    const intl = useIntl();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const [open, setOpen] = React.useState(false);
    const [prevOpen, setPrevOpen] = React.useState(false);
    const [draft, setDraft] = React.useState<TransactionFilterDraft>(() => toFilterDraft(filters));

    // 每次打開都以目前生效的 filter 為準，不留下上次未套用的草稿。
    if (prevOpen !== open) {
        setPrevOpen(open);
        if (open) setDraft(toFilterDraft(filters));
    }

    const update = (field: keyof TransactionFilterDraft, value: string) => {
        setDraft(previous => ({...previous, [field]: value}));
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onApply(toTransactionFilters(draft));
        setOpen(false);
    };

    const reset = () => {
        setDraft(EMPTY_FILTER_DRAFT);
        onReset();
        setOpen(false);
    };

    const trigger = (
        <Button aria-label={intl.formatMessage(messages.transactions.filters.toggle)} variant="outline" size="sm">
            <SlidersHorizontalIcon />
            <Box as="span" display={{base: "none", sm: "inline"}}>
                {intl.formatMessage(messages.transactions.filters.toggle)}
            </Box>
            {activeCount === 0 ? null : (
                <Badge colorPalette="brand" variant="solid" rounded="full">
                    {activeCount}
                </Badge>
            )}
        </Button>
    );

    const heading = (
        <Stack gap="0.5" pe="8">
            <Text fontWeight="semibold">{intl.formatMessage(messages.transactions.filters.title)}</Text>
        </Stack>
    );

    const fields = (
        <form id={FORM_ID} onSubmit={submit}>
            <Stack gap="4">
                <SimpleGrid columns={{base: 1, sm: 2}} gap="3">
                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.filters.from)}</Field.Label>
                        <Input type="date" value={draft.from} onChange={event => update("from", event.target.value)} />
                    </Field.Root>
                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.filters.to)}</Field.Label>
                        <Input type="date" value={draft.to} onChange={event => update("to", event.target.value)} />
                    </Field.Root>
                </SimpleGrid>

                {/* 四個下拉排成兩欄，popover 才不用滾動。 */}
                <SimpleGrid columns={{base: 1, sm: 2}} gap="3">
                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.filters.kind)}</Field.Label>
                        <NativeSelect.Root>
                            <NativeSelect.Field value={draft.kind} onChange={event => update("kind", event.target.value)}>
                                <option value="">{intl.formatMessage(messages.transactions.filters.allKinds)}</option>
                                <option value="income">{intl.formatMessage(messages.transactions.income)}</option>
                                <option value="expense">{intl.formatMessage(messages.transactions.expense)}</option>
                                <option value="transfer">{intl.formatMessage(messages.transactions.transfer)}</option>
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.filters.account)}</Field.Label>
                        <NativeSelect.Root>
                            <NativeSelect.Field value={draft.accountId} onChange={event => update("accountId", event.target.value)}>
                                <option value="">{intl.formatMessage(messages.transactions.filters.allAccounts)}</option>
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.filters.category)}</Field.Label>
                        <NativeSelect.Root>
                            <NativeSelect.Field value={draft.categoryId} onChange={event => update("categoryId", event.target.value)}>
                                <option value="">{intl.formatMessage(messages.transactions.filters.allCategories)}</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.filters.merchant)}</Field.Label>
                        <NativeSelect.Root>
                            <NativeSelect.Field value={draft.merchantId} onChange={event => update("merchantId", event.target.value)}>
                                <option value="">{intl.formatMessage(messages.transactions.filters.allMerchants)}</option>
                                {merchants.map(merchant => (
                                    <option key={merchant.id} value={merchant.id}>
                                        {merchant.name}
                                    </option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </Field.Root>
                </SimpleGrid>

                <SimpleGrid columns={{base: 1, sm: 2}} gap="3">
                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.filters.minAmount)}</Field.Label>
                        <Input type="number" min="0" step="0.01" inputMode="decimal" value={draft.min} onChange={event => update("min", event.target.value)} />
                    </Field.Root>
                    <Field.Root>
                        <Field.Label>{intl.formatMessage(messages.transactions.filters.maxAmount)}</Field.Label>
                        <Input type="number" min="0" step="0.01" inputMode="decimal" value={draft.max} onChange={event => update("max", event.target.value)} />
                    </Field.Root>
                </SimpleGrid>
            </Stack>
        </form>
    );

    const actions = (
        <React.Fragment>
            <Button type="button" variant="ghost" onClick={reset}>
                {intl.formatMessage(messages.transactions.filters.reset)}
            </Button>
            <Button type="submit" form={FORM_ID}>
                {intl.formatMessage(messages.transactions.filters.apply)}
            </Button>
        </React.Fragment>
    );

    if (isDesktop) {
        return (
            <Popover.Root open={open} onOpenChange={event => setOpen(event.open)} positioning={{placement: "bottom-end", gutter: 8}}>
                <Popover.Trigger asChild>{trigger}</Popover.Trigger>
                <Portal>
                    <Popover.Positioner>
                        <Popover.Content w="sm" maxW="calc(100vw - 2rem)" shadow="lg">
                            <Popover.Header>
                                {heading}
                                <Popover.CloseTrigger asChild>
                                    <CloseButton aria-label={intl.formatMessage(messages.common.close)} size="sm" position="absolute" top="2" insetEnd="2" />
                                </Popover.CloseTrigger>
                            </Popover.Header>
                            <Popover.Body maxH="min(60dvh, 28rem)" overflowY="auto">
                                {fields}
                            </Popover.Body>
                            <Popover.Footer justifyContent="flex-end" gap="2">
                                {actions}
                            </Popover.Footer>
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            </Popover.Root>
        );
    }

    return (
        <Drawer.Root open={open} onOpenChange={event => setOpen(event.open)} placement="bottom">
            <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content roundedTop="2xl" maxH="85dvh">
                        <Drawer.Header>
                            {heading}
                            <Drawer.CloseTrigger asChild>
                                <CloseButton aria-label={intl.formatMessage(messages.common.close)} size="sm" />
                            </Drawer.CloseTrigger>
                        </Drawer.Header>
                        <DrawerBody>
                            <Stack gap="4">
                                {fields}
                                <DrawerActions pt="2">{actions}</DrawerActions>
                            </Stack>
                        </DrawerBody>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};
