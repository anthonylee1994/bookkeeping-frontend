import React from "react";
import {Alert, Button, Field, HStack, Input, Stack, Text} from "@chakra-ui/react";
import {useIntl} from "react-intl";
import {MAX_INTERPRET_TEXT, ReceiptsRepository} from "@/data/receiptsRepository";
import type {AiPreview} from "@/data/types";
import {confidencePercent, isLowConfidence} from "@/features/receiptScan/scanModel";
import {messages} from "@/lib/i18n";
import {useAuthStore} from "@/stores/authStore";

type NaturalLanguageEntryProps = {
    /** 解讀成功；由父層將 preview 映射落交易表單並記住 log id。 */
    onInterpreted: (preview: AiPreview) => void;
};

/** 「解讀唔到」：AI 冇回 parsed、冇金額，或者整體 status 係 failed。 */
function isUnusable(preview: AiPreview): boolean {
    if (preview.status === "failed") return true;
    const amount = preview.parsed?.amount_cents;
    return amount === null || amount === undefined;
}

/** 新增交易表單頂部嘅自然語言入口：打一句話 → `/ai/interpret` → 預填同一張表單。 */
export const NaturalLanguageEntry = ({onInterpreted}: NaturalLanguageEntryProps) => {
    const intl = useIntl();
    const token = useAuthStore(state => state.token);
    const [text, setText] = React.useState("");
    const [isInterpreting, setInterpreting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [prefilled, setPrefilled] = React.useState<AiPreview | null>(null);
    // 取消／重新解讀會遞增；舊 run 回來時 generation 唔同就唔寫 state。
    const runRef = React.useRef(0);

    const trimmed = text.trim();
    const canSubmit = token !== null && trimmed !== "" && trimmed.length <= MAX_INTERPRET_TEXT && !isInterpreting;

    const cancel = () => {
        runRef.current += 1;
        setInterpreting(false);
        setError(intl.formatMessage(messages.interpret.cancelled));
    };

    const run = async () => {
        if (token === null || trimmed === "") return;
        const generation = runRef.current + 1;
        runRef.current = generation;
        setInterpreting(true);
        setError(null);
        setPrefilled(null);

        const result = await new ReceiptsRepository(token).interpret(trimmed);
        if (runRef.current !== generation) return;
        setInterpreting(false);

        if (!result.ok) {
            setError(result.error.message);
            return;
        }
        if (isUnusable(result.value)) {
            setError(intl.formatMessage(messages.interpret.failed));
            return;
        }
        setPrefilled(result.value);
        onInterpreted(result.value);
        // 成功預填後清空文字欄；失敗／取消保留原文方便重試。
        setText("");
    };

    return (
        <Stack gap="2" colorPalette="blue" borderWidth="1px" borderColor="ai.border" bg="ai.bg" rounded="lg" p="3">
            <Field.Root>
                <Field.Label color="ai.fg">{intl.formatMessage(messages.interpret.title)}</Field.Label>
                <Text fontSize="sm" color="fg.muted">
                    {intl.formatMessage(messages.interpret.description)}
                </Text>
                <Input
                    mt="1"
                    borderColor="blue.200"
                    value={text}
                    maxLength={MAX_INTERPRET_TEXT}
                    placeholder={intl.formatMessage(messages.interpret.placeholder)}
                    aria-label={intl.formatMessage(messages.interpret.title)}
                    onChange={event => setText(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            void run();
                        }
                    }}
                />
            </Field.Root>

            {isInterpreting ? (
                <Text fontSize="sm" aria-live="polite">
                    {intl.formatMessage(messages.interpret.interpreting)}
                </Text>
            ) : null}

            {error === null ? null : (
                <Alert.Root status="error" role="alert" rounded="lg">
                    <Alert.Indicator />
                    <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
            )}

            {prefilled === null ? null : (
                <Alert.Root status="info" rounded="lg" aria-live="polite" backgroundColor="blue.200">
                    <Alert.Indicator />
                    <Alert.Title>
                        {isLowConfidence(prefilled) ? intl.formatMessage(messages.scan.lowConfidence, {percent: confidencePercent(prefilled)}) : intl.formatMessage(messages.interpret.prefilled)}
                    </Alert.Title>
                </Alert.Root>
            )}

            <HStack justifyContent="flex-end">
                {isInterpreting ? (
                    <Button type="button" size="sm" variant="outline" _hover={{bg: "blue.subtle", color: "blue.fg", borderColor: "blue.fg"}} onClick={cancel}>
                        {intl.formatMessage(messages.interpret.cancel)}
                    </Button>
                ) : null}
                {error === null ? null : (
                    <Button type="button" size="sm" variant="outline" _hover={{bg: "blue.subtle", color: "blue.fg", borderColor: "blue.fg"}} onClick={() => void run()}>
                        {intl.formatMessage(messages.scan.retry)}
                    </Button>
                )}
                <Button type="button" size="sm" colorPalette="blue" loading={isInterpreting} disabled={!canSubmit} onClick={() => void run()}>
                    {intl.formatMessage(messages.interpret.submit)}
                </Button>
            </HStack>
        </Stack>
    );
};
