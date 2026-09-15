import {Drawer, IconButton} from "@chakra-ui/react";
import {XIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {LoadingIndicator} from "@/components/layout/LoadingIndicator";
import type {Transaction} from "@/data/types";
import {TransactionDetailContent} from "@/features/transactions/TransactionDetailContent";
import type {TransactionNameMaps} from "@/features/transactions/transactionsFormat";
import {messages} from "@/lib/i18n";

type TransactionPanelProps = {
    transaction: Transaction | null;
    names: TransactionNameMaps;
    isOpen: boolean;
    onClose: () => void;
};

/** Desktop 右側交易詳情面板；由 URL `selected` 參數控制開關，關閉後保留列表 scroll。 */
export const TransactionPanel = ({transaction, names, isOpen, onClose}: TransactionPanelProps) => {
    const intl = useIntl();
    const closeLabel = intl.formatMessage(messages.transactions.detail.close);

    return (
        <Drawer.Root
            open={isOpen}
            onOpenChange={details => {
                if (!details.open) onClose();
            }}
            placement="end"
            size="md"
        >
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
                    <Drawer.Body>{transaction === null ? <LoadingIndicator minH="20rem" /> : <TransactionDetailContent transaction={transaction} names={names} />}</Drawer.Body>
                </Drawer.Content>
            </Drawer.Positioner>
        </Drawer.Root>
    );
};
