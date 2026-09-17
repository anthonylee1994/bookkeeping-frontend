import React from "react";
import {Button, CloseButton, Dialog, Drawer, Portal, Stack} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {DrawerBody} from "@/components/layout/DrawerBody";
import type {Account, Category, Merchant, RecurringRule} from "@/data/types";
import {RecurringRuleForm} from "@/features/recurringRules/RecurringRuleForm";
import {DESKTOP_QUERY, useMediaQuery} from "@/hooks/useMediaQuery";
import {messages} from "@/lib/i18n";

type RecurringRuleFormDrawerProps = {
    /** `null` 代表新增。 */
    rule: RecurringRule | null;
    accounts: Account[];
    categories: Category[];
    merchants: Merchant[];
    onSaved: (rule: RecurringRule) => void;
    onClose: () => void;
};

/** 新增／修改定期交易，用右側（desktop）或底部（mobile）drawer；有未儲存改動離開時先確認。 */
export const RecurringRuleFormDrawer = ({rule, accounts, categories, merchants, onSaved, onClose}: RecurringRuleFormDrawerProps) => {
    const intl = useIntl();
    const isDesktop = useMediaQuery(DESKTOP_QUERY);
    const [isDirty, setDirty] = React.useState(false);
    const [confirmOpen, setConfirmOpen] = React.useState(false);

    const requestClose = () => {
        if (isDirty) {
            setConfirmOpen(true);
            return;
        }
        onClose();
    };

    const discard = () => {
        setConfirmOpen(false);
        onClose();
    };

    return (
        <React.Fragment>
            <Drawer.Root open placement={isDesktop ? "end" : "bottom"} size={isDesktop ? "md" : "full"} onOpenChange={event => (!event.open ? requestClose() : undefined)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content maxH={isDesktop ? "100dvh" : "92dvh"} roundedTop={isDesktop ? undefined : "2xl"}>
                            <Drawer.Header>
                                <Drawer.Title>{intl.formatMessage(rule === null ? messages.recurring.createTitle : messages.recurring.editTitle)}</Drawer.Title>
                                <Drawer.CloseTrigger asChild>
                                    <CloseButton aria-label={intl.formatMessage(messages.common.close)} />
                                </Drawer.CloseTrigger>
                            </Drawer.Header>
                            <DrawerBody>
                                <RecurringRuleForm rule={rule} accounts={accounts} categories={categories} merchants={merchants} onSaved={onSaved} onCancel={requestClose} onDirtyChange={setDirty} />
                            </DrawerBody>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>

            <Dialog.Root open={confirmOpen} placement="center" role="alertdialog" onOpenChange={event => setConfirmOpen(event.open)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(messages.transactions.form.leaveTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Stack gap="3">{intl.formatMessage(messages.transactions.form.leaveDescription)}</Stack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                                    {intl.formatMessage(messages.transactions.form.stay)}
                                </Button>
                                <Button type="button" colorPalette="red" onClick={discard}>
                                    {intl.formatMessage(messages.transactions.form.leave)}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </React.Fragment>
    );
};
