import React from "react";
import {Alert, Button, Dialog, EmptyState, Portal, Stack, Text, VStack} from "@chakra-ui/react";
import {PlusIcon, RepeatIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link, useSearchParams} from "react-router";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import {PageHeader} from "@/components/layout/PageHeader";
import {RecurringRulesRepository} from "@/data/recurringRulesRepository";
import type {RecurringRule, TransactionRow} from "@/data/types";
import {RecurringRuleFormDrawer} from "@/features/recurringRules/RecurringRuleFormDrawer";
import {RecurringRuleList} from "@/features/recurringRules/RecurringRuleList";
import type {RecurringRuleNameMaps} from "@/features/recurringRules/RecurringRuleList";
import {RecurringStatusTabs} from "@/features/recurringRules/RecurringStatusTabs";
import {useRecurringRules} from "@/features/recurringRules/useRecurringRules";
import {useDomainReference} from "@/hooks/useDomainReference";
import {toDisplayDate} from "@/lib/date";
import {messages} from "@/lib/i18n";
import {parseRecurringStatus, serializeRecurringStatus} from "@/lib/searchParams";
import {transactionDetailPath} from "@/routes/paths";
import {useAuthStore} from "@/stores/authStore";

type ConfirmAction = {
    type: "run" | "skip" | "delete";
    rule: RecurringRule;
};

export const RecurringRulesPage = () => {
    const intl = useIntl();
    const token = useAuthStore(state => state.token);
    const [searchParams, setSearchParams] = useSearchParams();
    const status = parseRecurringStatus(searchParams);
    const {rules, isLoading, error, reload} = useRecurringRules(status);
    const reference = useDomainReference();

    const [editor, setEditor] = React.useState<{rule: RecurringRule | null} | null>(null);
    const [confirm, setConfirm] = React.useState<ConfirmAction | null>(null);
    const [isActing, setActing] = React.useState(false);
    const [actionError, setActionError] = React.useState<string | null>(null);
    const [runNowTransaction, setRunNowTransaction] = React.useState<TransactionRow | null>(null);

    const names: RecurringRuleNameMaps = {
        accounts: React.useMemo(() => new Map(reference.accounts.map(account => [account.id, account.name])), [reference.accounts]),
        categories: React.useMemo(() => new Map(reference.categories.map(category => [category.id, category.name])), [reference.categories]),
        merchants: React.useMemo(() => new Map(reference.merchants.map(merchant => [merchant.id, merchant.name])), [reference.merchants]),
    };

    const changeStatus = (next: typeof status) => {
        setActionError(null);
        setRunNowTransaction(null);
        setSearchParams(serializeRecurringStatus(next));
    };

    const pause = async (rule: RecurringRule) => {
        if (token === null) return;
        setActionError(null);
        const result = await new RecurringRulesRepository(token).pause(rule.id);
        if (!result.ok) {
            setActionError(result.error.message);
            return;
        }
        reload();
    };

    const resume = async (rule: RecurringRule) => {
        if (token === null) return;
        setActionError(null);
        const result = await new RecurringRulesRepository(token).resume(rule.id);
        if (!result.ok) {
            setActionError(result.error.message);
            return;
        }
        reload();
    };

    const runConfirmedAction = async () => {
        if (confirm === null || token === null) return;
        const repository = new RecurringRulesRepository(token);
        setActing(true);
        setActionError(null);

        if (confirm.type === "run") {
            const result = await repository.runNow(confirm.rule.id);
            setActing(false);
            setConfirm(null);
            if (!result.ok) {
                setActionError(result.error.message);
                return;
            }
            setRunNowTransaction(result.value);
            reload();
            return;
        }

        const result = confirm.type === "skip" ? await repository.skipNext(confirm.rule.id) : await repository.delete(confirm.rule.id);
        setActing(false);
        setConfirm(null);
        if (!result.ok) {
            setActionError(result.error.message);
            return;
        }
        reload();
    };

    const handleSaved = (saved: RecurringRule) => {
        setEditor(null);
        if (saved.status === status) {
            reload();
            return;
        }
        setSearchParams(serializeRecurringStatus(saved.status));
    };

    const emptyTitle = status === "active" ? messages.recurring.emptyActive : status === "paused" ? messages.recurring.emptyPaused : messages.recurring.emptyEnded;

    const renderBody = () => {
        if (isLoading) return <LoadingIndicator minH="20rem" />;

        if (error !== null) {
            return (
                <Alert.Root status="error" role="alert" rounded="xl">
                    <Alert.Indicator />
                    <Alert.Title flex="1">{error.message}</Alert.Title>
                    <Button size="sm" variant="outline" onClick={reload}>
                        {intl.formatMessage(messages.common.retry)}
                    </Button>
                </Alert.Root>
            );
        }

        if (rules.length === 0) {
            return (
                <EmptyState.Root bg="bg.panel" borderWidth="1px" borderColor="border" rounded="xl" py="12">
                    <EmptyState.Content>
                        <EmptyState.Indicator>
                            <RepeatIcon />
                        </EmptyState.Indicator>
                        <VStack gap="1" textAlign="center">
                            <EmptyState.Title>{intl.formatMessage(emptyTitle)}</EmptyState.Title>
                            <Text fontSize="sm" color="fg.muted">
                                {intl.formatMessage(messages.recurring.emptyDescription)}
                            </Text>
                        </VStack>
                        <Button onClick={() => setEditor({rule: null})}>
                            <PlusIcon />
                            {intl.formatMessage(messages.recurring.createAction)}
                        </Button>
                    </EmptyState.Content>
                </EmptyState.Root>
            );
        }

        return (
            <RecurringRuleList
                rules={rules}
                names={names}
                accounts={reference.accounts}
                categories={reference.categories}
                onEdit={rule => setEditor({rule})}
                onPause={pause}
                onResume={resume}
                onRunNow={rule => setConfirm({type: "run", rule})}
                onSkipNext={rule => setConfirm({type: "skip", rule})}
                onDelete={rule => setConfirm({type: "delete", rule})}
            />
        );
    };

    const confirmTitle = confirm?.type === "run" ? messages.recurring.runNowTitle : confirm?.type === "skip" ? messages.recurring.skipNextTitle : messages.recurring.deleteTitle;

    return (
        <React.Fragment>
            <PageHeader
                title={intl.formatMessage(messages.nav.recurringRules)}
                actions={
                    <Button w={{base: "full", md: "auto"}} onClick={() => setEditor({rule: null})}>
                        <PlusIcon />
                        {intl.formatMessage(messages.recurring.createAction)}
                    </Button>
                }
            />

            <Stack gap="4">
                <RecurringStatusTabs status={status} onChange={changeStatus} />

                {actionError === null ? null : (
                    <Alert.Root status="error" role="alert" rounded="xl">
                        <Alert.Indicator />
                        <Alert.Title>{actionError}</Alert.Title>
                    </Alert.Root>
                )}

                {runNowTransaction === null ? null : (
                    <Alert.Root status="success" rounded="xl">
                        <Alert.Indicator />
                        <Alert.Title flex="1">{intl.formatMessage(messages.recurring.runNowSuccess)}</Alert.Title>
                        <Button asChild size="sm" variant="outline">
                            <Link to={transactionDetailPath(runNowTransaction.id)}>{intl.formatMessage(messages.recurring.viewTransaction)}</Link>
                        </Button>
                    </Alert.Root>
                )}

                {renderBody()}
            </Stack>

            {editor === null ? null : (
                <RecurringRuleFormDrawer
                    rule={editor.rule}
                    accounts={reference.accounts}
                    categories={reference.categories}
                    merchants={reference.merchants}
                    onSaved={handleSaved}
                    onClose={() => setEditor(null)}
                />
            )}

            <Dialog.Root open={confirm !== null} placement="center" role="alertdialog" onOpenChange={event => (!event.open ? setConfirm(null) : undefined)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(confirmTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                {confirm?.type === "run" ? intl.formatMessage(messages.recurring.runNowDescription) : null}
                                {confirm?.type === "skip" ? intl.formatMessage(messages.recurring.skipNextDescription, {date: toDisplayDate(confirm.rule.next_run_at)}) : null}
                                {confirm?.type === "delete" ? intl.formatMessage(messages.recurring.deleteDescription) : null}
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button type="button" variant="outline" disabled={isActing} onClick={() => setConfirm(null)}>
                                    {intl.formatMessage(messages.common.cancel)}
                                </Button>
                                <Button type="button" colorPalette={confirm?.type === "delete" ? "red" : "brand"} loading={isActing} onClick={runConfirmedAction}>
                                    {intl.formatMessage(confirm?.type === "delete" ? messages.common.delete : messages.common.confirm)}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </React.Fragment>
    );
};
