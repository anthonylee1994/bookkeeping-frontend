import React from "react";
import {Button, Dialog, Portal} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import type {Blocker} from "react-router";
import {messages} from "@/lib/i18n";

type DirtyLeaveDialogProps = {
    blocker: Blocker;
};

export const DirtyLeaveDialog = ({blocker}: DirtyLeaveDialogProps) => {
    const intl = useIntl();
    const isBlocked = blocker.state === "blocked";

    return (
        <React.Fragment>
            <Dialog.Root open={isBlocked} placement="center" role="alertdialog" onOpenChange={event => (!event.open && isBlocked ? blocker.reset() : undefined)}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{intl.formatMessage(messages.transactions.form.leaveTitle)}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>{intl.formatMessage(messages.transactions.form.leaveDescription)}</Dialog.Body>
                            <Dialog.Footer>
                                <Button type="button" variant="outline" onClick={() => blocker.state === "blocked" && blocker.reset()}>
                                    {intl.formatMessage(messages.transactions.form.stay)}
                                </Button>
                                <Button type="button" colorPalette="red" onClick={() => blocker.state === "blocked" && blocker.proceed()}>
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
