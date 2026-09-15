import {SimpleGrid, Skeleton, Stack} from "@chakra-ui/react";

/** Dashboard loading 骨架；尺寸大致對應真實內容，避免 layout jump。 */
export const DashboardSkeleton = () => {
    return (
        <Stack gap="5" aria-hidden="true">
            <SimpleGrid columns={{base: 2, md: 4}} gap="3">
                {[0, 1, 2, 3].map(index => (
                    <Skeleton key={index} h="5.5rem" rounded="xl" />
                ))}
            </SimpleGrid>
            <Skeleton h="3rem" maxW="sm" rounded="xl" />
            <SimpleGrid columns={{base: 1, lg: 2}} gap="4">
                <Skeleton h="18rem" rounded="xl" />
                <Skeleton h="18rem" rounded="xl" />
            </SimpleGrid>
            <Skeleton h="16rem" rounded="xl" />
        </Stack>
    );
};
