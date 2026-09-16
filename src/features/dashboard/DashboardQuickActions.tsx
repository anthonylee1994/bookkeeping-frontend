import {Button, HStack} from "@chakra-ui/react";
import {PlusIcon, ScanLineIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

/**
 * Dashboard 快速新增交易同掃描單據。只喺 mobile 顯示：desktop／tablet 已經有 sidebar
 * 「新增交易」同 header 掃描 icon，唔需要重複佔位。
 */
export const DashboardQuickActions = () => {
    const intl = useIntl();

    return (
        <HStack gap="3" flexWrap="wrap" display={{base: "flex", md: "none"}}>
            <Button asChild size="lg" flex="1" minW={0}>
                <Link to={ROUTES.transactionNew}>
                    <PlusIcon />
                    {intl.formatMessage(messages.dashboard.addTransaction)}
                </Link>
            </Button>
            <Button asChild size="lg" variant="outline" flex="1" minW={0}>
                <Link to={ROUTES.scan}>
                    <ScanLineIcon />
                    {intl.formatMessage(messages.dashboard.scanReceipt)}
                </Link>
            </Button>
        </HStack>
    );
};
