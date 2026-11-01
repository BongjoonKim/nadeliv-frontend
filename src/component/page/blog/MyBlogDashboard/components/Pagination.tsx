import { Box, HStack, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styled from "styled-components";

interface PaginationProps {
  /** 현재 페이지 (1부터) */
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onChange: (page: number) => void;
}

// FilterTabs 의 활성 탭 밑줄과 같은 세이지 그린
const ACCENT = "#5a8a73";

/**
 * 보여줄 페이지 번호 목록. 현재 페이지 양옆 1칸 + 처음/끝은 항상, 사이는 "…".
 * 예) 1 … 4 [5] 6 … 12
 */
function buildPageItems(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((n) => pages.add(n));

  const sorted = Array.from(pages)
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push("ellipsis");
    items.push(n);
  });
  return items;
}

function Pagination({ page, totalPages, totalCount, pageSize, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const items = buildPageItems(page, totalPages);

  return (
    <HStack justify={"space-between"} align={"center"} mt={"1rem"} flexWrap={"wrap"} gap={"0.75rem"}>
      <Text fontSize={"13px"} color={"rgba(255,255,255,0.4)"}>
        {from}–{to} of {totalCount}
      </Text>

      <HStack gap={"0.25rem"} as={"nav"} aria-label={"Pagination"}>
        <PageButton
          ariaLabel={"Previous page"}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={15} />
        </PageButton>

        {items.map((item, idx) =>
          item === "ellipsis" ? (
            <Text
              key={`ellipsis-${idx}`}
              width={"32px"}
              textAlign={"center"}
              fontSize={"13px"}
              color={"rgba(255,255,255,0.3)"}
              userSelect={"none"}
            >
              …
            </Text>
          ) : (
            <PageButton
              key={item}
              active={item === page}
              ariaLabel={`Page ${item}`}
              ariaCurrent={item === page ? "page" : undefined}
              onClick={() => onChange(item)}
            >
              {item}
            </PageButton>
          ),
        )}

        <PageButton
          ariaLabel={"Next page"}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={15} />
        </PageButton>
      </HStack>
    </HStack>
  );
}

interface PageButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  ariaCurrent?: "page";
}

function PageButton({ children, onClick, active, disabled, ariaLabel, ariaCurrent }: PageButtonProps) {
  return (
    <StyledPageButton
      type={"button"}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      $active={active}
    >
      {children}
    </StyledPageButton>
  );
}

// FilterTabs 의 StyledSelect 와 같은 다크 톤 (0.5px 보더, 6px 라운드, 13px)
const StyledPageButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  border-radius: 6px;
  border: 0.5px solid ${(p) => (p.$active ? ACCENT : "rgba(255, 255, 255, 0.12)")};
  background: ${(p) => (p.$active ? "rgba(90, 138, 115, 0.18)" : "rgba(255, 255, 255, 0.04)")};
  color: ${(p) => (p.$active ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.65)")};
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled):not([aria-current="page"]) {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.95);
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px ${ACCENT};
  }
  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

export default Pagination;
