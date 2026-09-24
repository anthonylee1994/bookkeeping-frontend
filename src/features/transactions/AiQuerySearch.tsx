import React from "react";
import {Alert, Button, Field, Flex, Input, Stack, Text} from "@chakra-ui/react";
import {SparklesIcon} from "lucide-react";
import {useIntl} from "react-intl";
import {MAX_QUERY_TEXT, ReceiptsRepository} from "@/data/receiptsRepository";
import type {TransactionFilters} from "@/data/types";
import {aiQueryToFilters, hasAiQueryFilters} from "@/features/transactions/aiQuery";
import {messages} from "@/lib/i18n";
import {useAuthStore} from "@/stores/authStore";

type AiQuerySearchProps = {
    /** 解讀成功並有可用條件；由父層寫入交易列表 URL。 */
    onApply: (filters: TransactionFilters, explanation: string | null) => void;
};

/**
 * 交易列表嘅 AI 搜尋入口：打一句問題 → `POST /ai/query` → 將回傳嘅 filter params
 * 交俾父層寫入 URL。沿用 AI 藍色系，同一般品牌綠區分；AI 唔會改任何資料。
 */
export const AiQuerySearch = ({onApply}: AiQuerySearchProps) => {
    const intl = useIntl();
    const token = useAuthStore(state => state.token);
    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState("");
    const [searching, setSearching] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [applied, setApplied] = React.useState<string | null>(null);
    // 取消／重新搜尋會遞增；舊 run 回來時 generation 唔同就唔寫 state。
    const runRef = React.useRef(0);

    const trimmed = text.trim();
    const canSubmit = token !== null && trimmed !== "" && trimmed.length <= MAX_QUERY_TEXT && !searching;

    const cancel = () => {
        runRef.current += 1;
        setSearching(false);
        setError(intl.formatMessage(messages.query.cancelled));
    };

    /** 收起面板時清走提示同中止未完成嘅 run；原文保留方便下次再試。 */
    const toggle = () => {
        if (open) {
            runRef.current += 1;
            setSearching(false);
            setError(null);
            setApplied(null);
        }
        setOpen(!open);
    };

    const run = async () => {
        if (token === null || trimmed === "") return;
        const generation = runRef.current + 1;
        runRef.current = generation;
        setSearching(true);
        setError(null);
        setApplied(null);

        const result = await new ReceiptsRepository(token).query(trimmed);
        if (runRef.current !== generation) return;
        setSearching(false);

        if (!result.ok) {
            setError(result.error.message);
            return;
        }

        const filters = aiQueryToFilters(result.value.filters);
        if (!hasAiQueryFilters(filters)) {
            setError(intl.formatMessage(messages.query.failed));
            return;
        }

        onApply(filters, result.value.explanation ?? null);
        setText("");
        setApplied(result.value.explanation == null ? intl.formatMessage(messages.query.applied) : intl.formatMessage(messages.query.appliedWithExplanation, {explanation: result.value.explanation}));
    };

    return (
        <Stack gap="2" align="flex-start">
            <Button
                _hover={{bg: "blue.subtle", color: "blue.fg", borderColor: "blue.fg"}}
                width={{md: "auto", base: "full"}}
                size="sm"
                colorPalette="blue"
                variant="outline"
                aria-expanded={open}
                onClick={toggle}
            >
                <SparklesIcon />
                {intl.formatMessage(open ? messages.query.close : messages.query.open)}
            </Button>

            {open ? (
                <Stack gap="2" w="full" colorPalette="blue" borderWidth="1px" borderColor="ai.border" bg="ai.bg" rounded="lg" p="3">
                    <Field.Root>
                        <Field.Label color="ai.fg">{intl.formatMessage(messages.query.title)}</Field.Label>
                        <Text fontSize="sm" color="fg.muted">
                            {intl.formatMessage(messages.query.description)}
                        </Text>
                        <Input
                            mt="1"
                            borderColor="blue.200"
                            value={text}
                            maxLength={MAX_QUERY_TEXT}
                            placeholder={intl.formatMessage(messages.query.placeholder)}
                            aria-label={intl.formatMessage(messages.query.title)}
                            onChange={event => setText(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    void run();
                                }
                            }}
                        />
                    </Field.Root>

                    {searching ? (
                        <Text fontSize="sm" aria-live="polite">
                            {intl.formatMessage(messages.query.searching)}
                        </Text>
                    ) : null}

                    {error === null ? null : (
                        <Alert.Root status="error" role="alert" rounded="lg">
                            <Alert.Indicator />
                            <Alert.Title>{error}</Alert.Title>
                        </Alert.Root>
                    )}

                    {applied === null ? null : (
                        <Alert.Root status="info" rounded="lg" aria-live="polite" backgroundColor="blue.200">
                            <Alert.Indicator />
                            <Alert.Title>{applied}</Alert.Title>
                        </Alert.Root>
                    )}

                    <Flex justifyContent="flex-end" gap="2">
                        {searching ? (
                            <Button type="button" size="sm" variant="outline" _hover={{bg: "blue.subtle", color: "blue.fg", borderColor: "blue.fg"}} onClick={cancel}>
                                {intl.formatMessage(messages.query.cancel)}
                            </Button>
                        ) : null}
                        {error === null ? null : (
                            <Button type="button" size="sm" variant="outline" _hover={{bg: "blue.subtle", color: "blue.fg", borderColor: "blue.fg"}} onClick={() => void run()}>
                                {intl.formatMessage(messages.common.retry)}
                            </Button>
                        )}
                        <Button type="button" size="sm" colorPalette="blue" loading={searching} disabled={!canSubmit} onClick={() => void run()}>
                            {intl.formatMessage(messages.query.submit)}
                        </Button>
                    </Flex>
                </Stack>
            ) : null}
        </Stack>
    );
};
