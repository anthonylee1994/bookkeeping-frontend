import {Button, HStack} from "@chakra-ui/react";
import {PlusIcon, ScanLineIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {Link} from "react-router";
import {messages} from "@/lib/i18n";
import {ROUTES} from "@/routes/paths";

/** Dashboard 快速新增交易同掃描單據。 */
export const DashboardQuickActions = () => {
    const intl = useIntl();

    return (
        <HStack gap="3" flexWrap="wrap">
            <Button asChild size="lg" flex={{base: "1", sm: "0 1 auto"}} minW={{base: 0, sm: "11rem"}}>
                <Link to={ROUTES.transactionNew}>
                    <PlusIcon />
                    {intl.formatMessage(messages.dashboard.addTransaction)}
                </Link>
            </Button>
            <Button asChild size="lg" variant="outline" flex={{base: "1", sm: "0 1 auto"}} minW={{base: 0, sm: "11rem"}}>
                <Link to={ROUTES.scan}>
                    <ScanLineIcon />
                    {intl.formatMessage(messages.dashboard.scanReceipt)}
                </Link>
            </Button>
        </HStack>
    );
};
