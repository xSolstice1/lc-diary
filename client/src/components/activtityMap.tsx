import React, { useMemo } from "react";
import { Box, Flex, Tooltip } from "@chakra-ui/react";
import { eachDayOfInterval, subDays, format } from "date-fns";
import type { Problem } from "../types/Problems";

interface ActivityMapProps {
  problems: Problem[];
}

interface Contribution {
  date: string;
  count: number;
}

const getColor = (count: number): string => {
  if (count === 0) return "gray.100";
  if (count < 2) return "green.100";
  if (count < 4) return "green.300";
  if (count < 6) return "green.500";
  return "green.700";
};

const ActivityMap: React.FC<ActivityMapProps> = ({ problems }) => {
  const contributionData: Contribution[] = useMemo(() => {
    const today = new Date();
    const oneYearAgo = subDays(today, 364);
    const days = eachDayOfInterval({ start: oneYearAgo, end: today });

    const map: Record<string, number> = {};
    problems.forEach((p) => {
      if (!p.created_time) return;
      if (!p.completed) return;
      const dateStr = format(new Date(p.created_time), "yyyy-MM-dd");
      map[dateStr] = (map[dateStr] || 0) + 1;
    });

    return days.map((day: Date): Contribution => {
      const dateStr = format(day, "yyyy-MM-dd");
      return {
        date: dateStr,
        count: map[dateStr] || 0,
      };
    });
  }, [problems]);

  return (
    <Flex wrap="wrap" gap="2px" maxW="300px">
      {contributionData.map(({ date, count }: Contribution) => (
        <Tooltip key={date} label={`${count} problem${count !== 1 ? "s" : ""} on ${date}`}>
          <Box
            width="12px"
            height="12px"
            borderRadius="2px"
            bg={getColor(count)}
            cursor="pointer"
          />
        </Tooltip>
      ))}
    </Flex>
  );
};

export default ActivityMap;
