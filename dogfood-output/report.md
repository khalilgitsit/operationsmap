# Dogfood Report: Ops Map — Document View (Phase 2.3)

| Field | Value |
|-------|-------|
| **Date** | 2026-02-25 |
| **App URL** | http://localhost:3000 |
| **Session** | docview-dogfood |
| **Scope** | New Document View features: TipTap editor, collapsible properties, fullscreen, sidebar toggle, side panel mode, paste-to-tasklist for SOP/Checklist/Template objects |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 1 |
| Medium | 1 |
| Low | 0 |
| **Total** | **3** |

## Issues

### ISSUE-001: TipTap editor crashes with SSR hydration error on Document View

| Field | Value |
|-------|-------|
| **Severity** | critical |
| **Category** | functional |
| **URL** | http://localhost:3000/sops/{id} |
| **Repro Video** | N/A |

**Description**

Opening any document record (SOP, Checklist, Template) crashes with a runtime error: "Tiptap Error: SSR has been detected, please set `immediatelyRender` explicitly to `false` to avoid hydration mismatches." The TipTap `useEditor` hook needs the `immediatelyRender: false` option in Next.js SSR environments.

**Repro Steps**

1. Navigate to SOPs list, click on "New Employee Onboarding Procedure"
   ![Result](screenshots/dv-sop-document-view.png)

2. **Observe:** Runtime error overlay appears, page is blank/broken

---

### ISSUE-002: Content area not scrollable — Trigger, End State, Description sections unreachable

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | functional |
| **URL** | http://localhost:3000/sops/{id} |
| **Repro Video** | N/A |

**Description**

The document view's ScrollArea was not constraining its height, causing the Trigger, End State, and Description editor sections to be rendered below the fold but unreachable by scrolling. The Radix ScrollArea viewport auto-expanded to fit content instead of showing a scrollbar. Root cause: `flex-1` on the ScrollArea needed `min-h-0` to allow the flex item to shrink below content height.

**Fix Applied:** Added `min-h-0` class to ScrollArea in document-view.tsx.

---

### ISSUE-003: Duplicate TipTap extension warnings for Link and Underline

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | console-error |
| **URL** | http://localhost:3000/sops/{id} |
| **Repro Video** | N/A |

**Description**

Browser console shows warnings: "Duplicate extension names found: ['link', 'underline']". The TipTap StarterKit (v2.x) now bundles both the Link and Underline extensions. The editor was also importing them separately, causing each to be registered twice. While not a crash, this can cause unpredictable behavior when extensions conflict.

**Fix Applied:** Removed separate `Underline` and `Link` extension imports. Configured link options through `StarterKit.configure({ link: { ... } })` instead.

---

