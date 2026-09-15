import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {Alert, Button, Dialog, Field, Input, Portal, Stack, Textarea} from "@chakra-ui/react";
import {useForm} from "react-hook-form";
import {useIntl} from "react-intl";
import {TransactionsRepository} from "@/data/transactionsRepository";
import type {Transaction} from "@/data/types";
import {defaultRefundFormValues, refundFormSchema, refundFormValuesToInput} from "@/features/transactions/refundModel";
import type {RefundFormValues} from "@/features/transactions/refundModel";
import {messages} from "@/lib/i18n";
import {centsToDollars} from "@/lib/money";
import {useAppStore} from "@/stores/appStore";
import {useAuthStore} from "@/stores/authStore";

type TransactionRefundDialogProps = {
    transaction: Transaction;
    remainingCents: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 退款成功後回傳更新咗淨額嘅原交易，畀詳情即時反映。 */
    onRefunded: (original: Transaction, refund: Transaction) => void;
};

type RefundFormProps = Omit<TransactionRefundDialogProps, "open">;

/** 只喺 dialog 打開時 mount，令每次開都係全新預設值（唔使喺 effect 內 reset）。 */
const RefundForm = ({transaction, remainingCents, onOpenChange, onRefunded}: RefundFormProps) => {
    const intl = useIntl();
    const token = useAuthStore(state => state.token);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const schema = React.useMemo(() => refundFormSchema(remainingCents), [remainingCents]);
    const {register, handleSubmit, formState} = useForm<RefundFormValues>({
        resolver: zodResolver(schema),
        defaultValues: defaultRefundFormValues(remainingCents),
    });

    const submit = handleSubmit(async values => {
        if (token === null) return;
        setSubmitError(null);
        const result = await new TransactionsRepository(token).refund(transaction.id, refundFormValuesToInput(values));
        if (!result.ok) {
            setSubmitError(result.error.message);
            return;
        }

        const original: Transaction = {...transaction, net_amount_cents: transaction.net_amount_cents - result.value.amount_cents};
        const store = useAppStore.getState();
        store.setTransactions([result.value, ...store.transactions.map(item => (item.id === original.id ? original : item))], store.transactionsMeta);
        onOpenChange(false);
        onRefunded(original, result.value);
    });

    return (
        <Dialog.Content>
            <form onSubmit={submit} noValidate>
                <Dialog.Header>
                    <Dialog.Title>{intl.formatMessage(messages.transactions.detail.refundTitle)}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <Stack gap="4">
                        <Dialog.Description>{intl.formatMessage(messages.transactions.detail.refundDescription)}</Dialog.Description>

                        <Field.Root required invalid={formState.errors.amount !== undefined}>
                            <Field.Label>{intl.formatMessage(messages.transactions.detail.refundAmount)}</Field.Label>
                            <Input autoFocus inputMode="decimal" {...register("amount")} />
                            <Field.HelperText>{intl.formatMessage(messages.transactions.detail.refundCapHint, {amount: centsToDollars(remainingCents)})}</Field.HelperText>
                            {formState.errors.amount === undefined ? null : <Field.ErrorText>{formState.errors.amount.message}</Field.ErrorText>}
                        </Field.Root>

                        <Field.Root required invalid={formState.errors.occurredAt !== undefined}>
                            <Field.Label>{intl.formatMessage(messages.transactions.detail.refundOccurredAt)}</Field.Label>
                            <Input type="datetime-local" {...register("occurredAt")} />
                            {formState.errors.occurredAt === undefined ? null : <Field.ErrorText>{formState.errors.occurredAt.message}</Field.ErrorText>}
                        </Field.Root>

                        <Field.Root>
                            <Field.Label>{intl.formatMessage(messages.transactions.detail.refundNote)}</Field.Label>
                            <Textarea rows={2} {...register("note")} />
                        </Field.Root>

                        {submitError === null ? null : (
                            <Alert.Root status="error" role="alert" rounded="lg">
                                <Alert.Indicator />
                                <Alert.Title>{submitError}</Alert.Title>
                            </Alert.Root>
                        )}
                    </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                    <Button type="button" variant="outline" disabled={formState.isSubmitting} onClick={() => onOpenChange(false)}>
                        {intl.formatMessage(messages.common.cancel)}
                    </Button>
                    <Button type="submit" loading={formState.isSubmitting}>
                        {intl.formatMessage(messages.transactions.detail.refundSubmit)}
                    </Button>
                </Dialog.Footer>
            </form>
        </Dialog.Content>
    );
};

export const TransactionRefundDialog = ({open, ...formProps}: TransactionRefundDialogProps) => {
    return (
        <Dialog.Root open={open} onOpenChange={event => formProps.onOpenChange(event.open)}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>{open ? <RefundForm {...formProps} /> : null}</Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};
