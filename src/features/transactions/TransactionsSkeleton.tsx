import {Skeleton, Stack} from "@chakra-ui/react";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

/** 交易列表 skeleton；固定行高，避免載入完成後 layout 跳動。 */
export const TransactionsSkeleton = () => {
    return (
        <Stack gap="2" aria-hidden="true">
            {SKELETON_ROWS.map(index => (
                <Skeleton key={index} h="4rem" rounded="xl" />
            ))}
        </Stack>
    );
};
