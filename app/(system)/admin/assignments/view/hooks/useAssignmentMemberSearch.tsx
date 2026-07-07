"use client";

import { useEffect, useMemo, useState } from "react";
import type { Assignment, SiteMember } from "./useAssignmentViewData";

type GroupedVisibleAssignment = {
  rows: Assignment[];
};

type Props = {
  memberSearchQuery: string;
  groupedVisibleAssignments: GroupedVisibleAssignment[];
  displayDates: string[];
  getMembers: (assignmentId: string, workDate: string) => SiteMember[];
  matchElementMapRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  tableScrollRef: React.MutableRefObject<HTMLDivElement | null>;
};

type MemberSearchMatch = {
  key: string;
  employee_name: string;
};

export function useAssignmentMemberSearch({
  memberSearchQuery,
  groupedVisibleAssignments,
  displayDates,
  getMembers,
  matchElementMapRef,
  tableScrollRef,
}: Props) {
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const memberSearchMatches = useMemo<MemberSearchMatch[]>(() => {
    const query = memberSearchQuery.trim().toLowerCase();

    if (!query) return [];

    const matches: MemberSearchMatch[] = [];

    groupedVisibleAssignments.forEach((group) => {
      group.rows.forEach((assignment) => {
        displayDates.forEach((workDate) => {
          const members = getMembers(assignment.id, workDate);

          members.forEach((member) => {
            if (!member.employee_name.toLowerCase().includes(query)) return;

            matches.push({
              key: `${assignment.id}__${workDate}__${member.id}`,
              employee_name: member.employee_name,
            });
          });
        });
      });
    });

    return matches;
  }, [memberSearchQuery, groupedVisibleAssignments, displayDates, getMembers]);

  const memberSearchMatchKeySet = useMemo(() => {
    return new Set(memberSearchMatches.map((match) => match.key));
  }, [memberSearchMatches]);

  const goToNextMatch = () => {
    if (memberSearchMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % memberSearchMatches.length);
  };

  const goToPrevMatch = () => {
    if (memberSearchMatches.length === 0) return;
    setActiveMatchIndex((prev) =>
      prev === 0 ? memberSearchMatches.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [memberSearchQuery]);

  useEffect(() => {
    if (memberSearchMatches.length === 0) {
      setActiveMatchIndex(0);
      return;
    }

    if (activeMatchIndex >= memberSearchMatches.length) {
      setActiveMatchIndex(0);
    }
  }, [activeMatchIndex, memberSearchMatches]);

  useEffect(() => {
    if (memberSearchMatches.length === 0) return;
  
    const activeMatch = memberSearchMatches[activeMatchIndex];
    if (!activeMatch) return;
  
    const element = matchElementMapRef.current[activeMatch.key];
    const container = tableScrollRef.current;
  
    if (!element || !container) return;
  
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
  
    const currentScrollLeft = container.scrollLeft;
    const currentScrollTop = container.scrollTop;
  
    const elementLeftInContainer =
      elementRect.left - containerRect.left + currentScrollLeft;
    const elementTopInContainer =
      elementRect.top - containerRect.top + currentScrollTop;
  
    container.scrollTo({
      left: Math.max(
        elementLeftInContainer - container.clientWidth / 2 + elementRect.width / 2,
        0
      ),
      top: Math.max(
        elementTopInContainer - container.clientHeight / 2 + elementRect.height / 2,
        0
      ),
      behavior: "smooth",
    });
  
    requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    });
  }, [activeMatchIndex, memberSearchMatches, matchElementMapRef, tableScrollRef]);

  const highlightMemberName = (text: string) => {
    const query = memberSearchQuery.trim();

    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <mark style={memberSearchMarkStyle}>
          {text.slice(index, index + query.length)}
        </mark>
        {text.slice(index + query.length)}
      </>
    );
  };

  return {
    activeMatchIndex,
    memberSearchMatches,
    memberSearchMatchKeySet,
    goToNextMatch,
    goToPrevMatch,
    highlightMemberName,
  };
}

const memberSearchMarkStyle: React.CSSProperties = {
  backgroundColor: "#fde68a",
  color: "#111827",
  padding: 0,
};