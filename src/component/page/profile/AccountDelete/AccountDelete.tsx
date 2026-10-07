import React from "react";
import { AlertTriangle, Lock } from "lucide-react";
import CusModal from "../../../../common/elements/CusModal";
import useAccountDelete from "./useAccountDelete";
import {
  DangerCard,
  DangerTitle,
  DangerText,
  Field,
  Label,
  PasswordInput,
  DangerButton,
  OutlineButton,
  Actions,
  Alert,
  Spinner,
  profileTokens as c,
} from "../profileUi";

export default function AccountDelete() {
  const {
    password,
    setPassword,
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
    handleDelete,
    isDeleting,
    errorMsg,
    setErrorMsg,
  } = useAccountDelete();

  return (
    <>
      <DangerCard>
        <DangerTitle>Delete Account</DangerTitle>
        <DangerText>
          Once you delete your account, there is no going back. Your name,
          email, birthday, profile photo, follows, and bookmarks are
          permanently erased. Posts, comments, and travel albums you shared
          stay on Nadeliv under &ldquo;Deleted user&rdquo;.
        </DangerText>

        <div style={{ marginTop: 18 }}>
          {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

          <Field style={{ marginTop: errorMsg ? 16 : 0 }}>
            <Label>Confirm your password</Label>
            <PasswordInput
              value={password}
              onChange={(v) => {
                setPassword(v);
                setErrorMsg("");
              }}
              placeholder="Enter your password"
              leftIcon={<Lock size={16} />}
              autoComplete="current-password"
            />
          </Field>

          <div style={{ marginTop: 20 }}>
            <DangerButton onClick={handleOpenModal}>
              Delete My Account
            </DangerButton>
          </div>
        </div>
      </DangerCard>

      {/* 확인 모달 — nadeliv 다크 브랜드 톤 */}
      <CusModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Confirm Account Deletion"
        size="sm"
        variant="dark"
        footer={
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", width: "100%" }}>
            <OutlineButton onClick={handleCloseModal} disabled={isDeleting}>
              Cancel
            </OutlineButton>
            <DangerButton onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Spinner /> : "Delete"}
            </DangerButton>
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "12px 4px 8px",
            textAlign: "center",
          }}
        >
          <AlertTriangle size={44} color={c.danger} strokeWidth={1.5} />
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.7)", margin: 0 }}>
            Are you sure you want to delete your account? This action cannot be
            undone.
          </p>
        </div>
      </CusModal>
    </>
  );
}
