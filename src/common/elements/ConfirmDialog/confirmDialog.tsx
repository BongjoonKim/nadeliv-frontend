// 앱 전역 공용 확인 모달 (window.confirm 대체).
// toaster 와 같은 싱글톤 패턴: 사용처에서 `await confirmDialog({...})` 호출,
// 화면 렌더링은 App 루트에 마운트된 <ConfirmDialogHost /> 가 담당한다.
//
//   const ok = await confirmDialog({
//     title: "휴지통으로 옮길까요?",
//     description: "휴지통에서 90일 안에 복구할 수 있어요.",
//     confirmText: "옮기기",
//     tone: "danger",
//   });
//   if (!ok) return;

import React, { ReactNode, useCallback, useSyncExternalStore } from "react";
import { Portal } from "@chakra-ui/react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import CusModal from "../CusModal";
import {
  DangerButton,
  OutlineButton,
  PrimaryButton,
  profileTokens as c,
} from "../../../component/page/profile/profileUi";
import { homeTokens as t } from "../../../component/page/MainPage/MainBody/homeTokens";

export interface ConfirmDialogOptions {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** danger: 삭제·탈퇴 등 되돌리기 어려운 동작 (빨간 확인 버튼) */
  tone?: "default" | "danger";
}

interface PendingConfirm extends ConfirmDialogOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

// ---- 모듈 레벨 스토어 (컴포넌트 밖에서도 호출 가능하도록)
let queue: PendingConfirm[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function getSnapshot(): PendingConfirm | null {
  return queue[0] ?? null;
}
function settle(id: number, ok: boolean) {
  const target = queue.find((q) => q.id === id);
  if (!target) return;
  queue = queue.filter((q) => q.id !== id);
  target.resolve(ok);
  emit();
}

/** window.confirm 대체. 확인이면 true, 취소·닫기·ESC 면 false. */
export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    queue = [...queue, { ...options, id: ++seq, resolve }];
    emit();
  });
}

// ---- 렌더링 호스트 (App 루트에 1회 마운트)
export function ConfirmDialogHost() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const onCancel = useCallback(() => {
    if (current) settle(current.id, false);
  }, [current]);
  const onConfirm = useCallback(() => {
    if (current) settle(current.id, true);
  }, [current]);

  if (!current) return null;

  const isDanger = current.tone === "danger";
  const ConfirmButton = isDanger ? DangerButton : PrimaryButton;

  return (
    // 다른 Chakra 모달(Portal) 위에 뜨도록 Portal 로 감싼다 — 나중에 마운트된 Portal 이 위에 쌓임.
    <Portal>
      <CusModal
        isOpen
        onClose={onCancel}
        size="xs"
        variant="dark"
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", width: "100%" }}>
            {/* 초기 포커스는 취소(첫 버튼) — 실수로 Enter 를 눌러도 삭제되지 않도록 */}
            <OutlineButton type="button" onClick={onCancel}>
              {current.cancelText ?? "취소"}
            </OutlineButton>
            <ConfirmButton type="button" onClick={onConfirm}>
              {current.confirmText ?? "확인"}
            </ConfirmButton>
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "20px 4px 8px",
            textAlign: "center",
            fontFamily: t.font.sans,
          }}
        >
          {isDanger ? (
            <AlertTriangle size={40} color={c.danger} strokeWidth={1.5} />
          ) : (
            <HelpCircle size={40} color={t.color.accent} strokeWidth={1.5} />
          )}
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              lineHeight: 1.4,
              color: t.color.text,
              fontFamily: t.font.serif,
              whiteSpace: "pre-line",
            }}
          >
            {current.title}
          </h3>
          {current.description && (
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                lineHeight: 1.55,
                color: t.color.textMuted,
                whiteSpace: "pre-line",
              }}
            >
              {current.description}
            </p>
          )}
        </div>
      </CusModal>
    </Portal>
  );
}

export default ConfirmDialogHost;
