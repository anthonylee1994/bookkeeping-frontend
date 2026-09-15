import {Button, EmptyState, Stack} from "@chakra-ui/react";
import {PlusIcon, ScanLineIcon, WalletIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

/** 未有交易時的主要動作：新增第一筆交易（次要動作：掃描單據）。 */
export const DashboardEmptyState = () => {
    const intl = useIntl();

    return (
        <EmptyState.Root rounded="xl" borderWidth="1px" borderColor="border" bg="bg.panel" shadow="xs" py="10">
            <EmptyState.Content>
                <EmptyState.Indicator>
                    <WalletIcon />
                </EmptyState.Indicator>
                <EmptyState.Title>{intl.formatMessage(messages.dashboard.emptyTitle)}</EmptyState.Title>
                <EmptyState.Description>{intl.formatMessage(messages.dashboard.emptyDescription)}</EmptyState.Description>
                <Stack direction="row" gap="3" mt="2" flexWrap="wrap" justify="center">
                    <Button asChild size="lg" rounded="xl">
                        <Link to={ROUTES.transactionNew}>
                            <PlusIcon />
                            {intl.formatMessage(messages.dashboard.emptyAction)}
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" rounded="xl">
                        <Link to={ROUTES.scan}>
                            <ScanLineIcon />
                            {intl.formatMessage(messages.dashboard.scanReceipt)}
                        </Link>
                    </Button>
                </Stack>
            </EmptyState.Content>
        </EmptyState.Root>
    );
};
