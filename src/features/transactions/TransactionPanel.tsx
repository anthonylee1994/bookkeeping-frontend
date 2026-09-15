import React from "react";
import {Drawer, IconButton, Portal, Stack} from "@chakra-ui/react";
import {XIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import type {Transaction} from "@/data/types";
import {TransactionDetailActions} from "@/features/transactions/TransactionDetailActions";
import {TransactionDetailContent} from "@/features/transactions/TransactionDetailContent";
import type {TransactionNameMaps} from "@/features/transactions/transactionsFormat";
import {messages} from "@/lib/i18n";

type TransactionPanelProps = {
    transaction: Transaction | null;
    names: TransactionNameMaps;
    isOpen: boolean;
    onClose: () => void;
    onDeleted: () => void;
};

/** Desktop 右側交易詳情面板；由 URL `selected` 參數控制開關，關閉後保留列表 scroll。 */
export const TransactionPanel = ({transaction, names, isOpen, onClose, onDeleted}: TransactionPanelProps) => {
    const intl = useIntl();
    const closeLabel = intl.formatMessage(messages.transactions.detail.close);

    return (
        <React.Fragment>
            <Drawer.Root
                open={isOpen}
                onOpenChange={details => {
                    if (!details.open) onClose();
                }}
                placement="end"
                size="md"
            >
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title fontSize="lg">{intl.formatMessage(messages.transactions.detail.panelTitle)}</Drawer.Title>
                            </Drawer.Header>
                            <Drawer.CloseTrigger asChild>
                                <IconButton aria-label={closeLabel} title={closeLabel} variant="ghost" size="sm">
                                    <XIcon />
                                </IconButton>
                            </Drawer.CloseTrigger>
                            <Drawer.Body pb="8">
                                {transaction === null ? (
                                    <LoadingIndicator minH="20rem" />
                                ) : (
                                    <Stack gap="4">
                                        <TransactionDetailContent transaction={transaction} names={names} />
                                        <TransactionDetailActions transaction={transaction} onDeleted={onDeleted} />
                                    </Stack>
                                )}
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </React.Fragment>
    );
};
