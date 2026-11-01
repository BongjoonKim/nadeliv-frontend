import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

// 앱 전역 공용 toaster 싱글톤 (Chakra UI v3 표준 패턴).
// 사용처에서 `import { toaster } from ".../toaster"` 후 toaster.create({...}) 호출.
// 화면 렌더링은 App 루트에 마운트된 <Toaster /> 가 담당한다.
export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
  max: 3,
});

// 자동저장 등에서 쓰는 작고 차분한 다크 테마 토스트.
export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast : any) => (
          <Toast.Root
            css={{
              // 토스트 영역(group)의 폭이 0 이라 width:auto 는 min-content 로 풀려
              // 짧은 제목이 한 글자씩 세로로 쌓였음 → max-content 로 고정
              width: "max-content",
              minWidth: "0",
              maxWidth: "min(380px, calc(100vw - 32px))",
              wordBreak: "keep-all",
              background: "#14191a",
              color: "#e8eaeb",
              border: "1px solid rgba(127, 184, 154, 0.28)",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
              padding: "10px 14px",
              fontSize: "13px",
            }}
          >
            {toast.type === "loading" ? (
              <Spinner size="sm" color="#7fb89a" />
            ) : (
              <Toast.Indicator
                css={{
                  color:
                    toast.type === "error"
                      ? "#e07a7a"
                      : toast.type === "warning"
                        ? "#e0b96a"
                        : "#7fb89a",
                }}
              />
            )}
            {/* maxWidth:100% 는 max-content 부모 안에서 최소 폭으로 풀려 제목이 줄바꿈되므로 두지 않는다 */}
            <Stack gap="1" flex="1" minWidth="0">
              {toast.title && (
                <Toast.Title css={{ fontWeight: 500, fontSize: "13px", color: "#e8eaeb" }}>
                  {toast.title}
                </Toast.Title>
              )}
              {toast.description && (
                <Toast.Description css={{ fontSize: "12px", color: "rgba(232, 234, 235, 0.7)" }}>
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>
            {toast.closable && (
              <Toast.CloseTrigger css={{ color: "rgba(255, 255, 255, 0.5)" }} />
            )}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
}

export default Toaster;
