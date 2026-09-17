import {Button, HStack} from "@chakra-ui/react";
import {PlusIcon, ScanLineIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {useScan} from "@/features/receiptScan/ScanProvider";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

/**
 * Dashboard 快速新增交易與掃描單據。只於 mobile 顯示：desktop／tablet 已有 sidebar
 * 「新增交易」及 header 掃描 icon，無需重複佔位。
 */
export const DashboardQuickActions = () => {
    const intl = useIntl();
    const {startScan} = useScan();

    return (
        <HStack gap="3" flexWrap="wrap" display={{base: "flex", md: "none"}}>
            <Button asChild size="lg" flex="1" minW={0}>
                <Link to={ROUTES.transactionNew}>
                    <PlusIcon />
                    {intl.formatMessage(messages.dashboard.addTransaction)}
                </Link>
            </Button>
            <Button size="lg" variant="outline" flex="1" minW={0} onClick={startScan}>
                <ScanLineIcon />
                {intl.formatMessage(messages.dashboard.scanReceipt)}
            </Button>
        </HStack>
    );
};
