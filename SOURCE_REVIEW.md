# Windows error guide source and content review

- Dataset: `windows-data.json`
- App: `windows-error-guide`
- Source checking date: 2026-10-27 (Asia/Seoul)
- Inventory: 24 independently authored contextual entries, 5 categories, 6 languages (`ko`, `en`, `es`, `zh`, `ja`, `de`).
- Sources: 17 distinct HTTPS Microsoft Support/Microsoft Learn URLs. Each was opened through the web tool and its article content inspected. Search-result snippets alone were not treated as final verification.

## Scope and decisions

| Category | Entries | Boundary |
| --- | ---: | --- |
| Device Manager | 8 | Codes 10, 14, 22, 28, 31, 43, 45, 52; device status context only. Code 52 is explicitly limited to 64-bit Windows. |
| Windows Update | 6 | 0x80070002, 0x80070005, 0x80072EE2, 0x80240020, 0x80242014, 0x800F081F. The last entry is limited to Windows 10 because the inspected relevant Support section names Windows 10. |
| Activation | 5 | 0x803F7001, 0xC004F074, 0xC004C003, 0xC004F211, 0xC004F212. Edition, account, OEM/organization and hardware-change context remain visible. |
| Setup/upgrade | 4 | 0xC1900101 family and the full combinations 0xC1900208 – 0x4000C, 0x80070070 – 0x50011, 0xC1900200 – 0x20008. Additional setup codes are not treated as interchangeable aliases. |
| Optional feature | 1 | 0x800F081F when installing .NET Framework 3.5 on Windows 10/Windows Server. It is separate from the same code during Windows Update. |

The dataset explains reported states and plausible investigation paths. It does not infer a unique root cause, identify damaged components from a code alone, promise successful repair, or establish a Windows edition's current servicing entitlement. An older Windows version appearing in Microsoft documentation does not establish that every edition/build is currently supported.

Every text object has two concrete checks, an explicit scope and a named official escalation route. Category filter labels and the root title/description are independently authored in all six languages. Product names, symbols, codes, KB and API/file names remain unchanged where appropriate.

## Verified first-party references

1. [Microsoft Support — Device Manager error codes](https://support.microsoft.com/en-gb/windows/hardware/drivers/error-codes-in-device-manager-in-windows?nochrome=true)
   Inspected the device-status lookup instructions and code-specific sections. Used as user-facing follow-up beside each individual Learn code page. A yellow warning or Code 43 is not presented as proof of a particular broken component.

2. [Microsoft Learn — Code 10](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-failed-start)
   Verified `CM_PROB_FAILED_START` and the device-start context.

3. [Microsoft Learn — Code 14](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-need-restart)
   Verified `CM_PROB_NEED_RESTART` and the restart requirement. The check reminds users to save work before a normal restart.

4. [Microsoft Learn — Code 22](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-disabled)
   Verified `CM_PROB_DISABLED`. Checks inspect state and management context; they do not bypass organizational policy.

5. [Microsoft Learn — Code 28](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-failed-install)
   Verified `CM_PROB_FAILED_INSTALL` and missing driver context. The authored checks ask users to match the exact device/model, Windows architecture and official driver support.

6. [Microsoft Learn — Code 31](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-failed-add)
   Verified `CM_PROB_FAILED_ADD` and the required-driver loading context.

7. [Microsoft Learn — Code 43](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-failed-post-start)
   Verified `CM_PROB_FAILED_POST_START` and the driver's reported problem. No failing part is identified.

8. [Microsoft Learn — Code 45](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-phantom)
   Verified `CM_PROB_PHANTOM` and absent-device context. The entry accounts for an old/hidden device record instead of assuming a currently attached device failed.

9. [Microsoft Learn — Code 52](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/cm-prob-unsigned-driver)
   Verified `CM_PROB_UNSIGNED_DRIVER` and the article's 64-bit Windows condition. Only official signed-package checking is suggested.

10. [Microsoft Support — Troubleshoot problems updating Windows](https://support.microsoft.com/en-us/windows/deployment/updates-lifecycle/troubleshoot-problems-updating-windows)
    Verified 0x80070002 and the Windows 10 section for 0x800F081F. Checks use update history, failure stage, space and restart state. The source contains additional invasive steps; those steps were not reproduced.

11. [Microsoft Learn — Common Windows Update errors](https://learn.microsoft.com/en-us/troubleshoot/windows-client/installing-updates-features-roles/common-windows-update-errors)
    Verified 0x80072EE2 (`WININET_E_TIMEOUT`), 0x80240020 (`WU_E_NO_INTERACTIVE_USER`) and 0x80242014 (`WU_E_UH_POSTREBOOTSTILLPENDING`). Network-source distinctions (Microsoft/WSUS/management services) are preserved. A general working internet connection is not claimed to prove update-endpoint reachability.

12. [Microsoft Learn — Windows Update 0x80070005](https://learn.microsoft.com/en-us/troubleshoot/windows-client/installing-updates-features-roles/troubleshoot-windows-update-error-0x80070005)
    Verified the update-specific `E_ACCESSDENIED` context and the relevance of CBS/update records. The portal does not change ACLs, ownership or registry permissions.

13. [Microsoft Support — Activation errors](https://support.microsoft.com/en-us/windows/activation/get-help-with-windows-activation-errors)
    Inspected all five selected activation code sections. Windows edition/key mismatch, organization-network context and hardware-change context remain distinct. A key is not presumed counterfeit or transferable solely because a code appears.

14. [Microsoft Support — Windows 10 0x803F7001](https://support.microsoft.com/en-us/windows/activation/fix-windows-10-activation-error-0x803f7001)
    Inspected the dedicated Windows 10 article. Its narrower version scope is supplemented by the broader activation article for Windows 11.

15. [Microsoft Support — Reactivation after hardware changes](https://support.microsoft.com/en-us/windows/activation/reactivating-windows-after-a-hardware-change)
    Inspected license/account/edition context for 0xC004F211. The entry does not promise that any OEM license or motherboard replacement qualifies for a transfer.

16. [Microsoft Support — Upgrade and installation errors](https://support.microsoft.com/en-us/windows/deployment/install-upgrade/get-help-with-windows-upgrade-and-installation-errors)
    Inspected both Windows 11 and Windows 10 sections for the four selected setup entries. The additional setup code and target OS requirements remain relevant. Published legacy free-space numbers were not copied or recast as sufficient Windows 11 requirements.

17. [Microsoft Learn — .NET Framework 3.5 installation errors](https://learn.microsoft.com/en-us/troubleshoot/windows-client/application-management/dotnet-framework-35-installation-error)
    Verified 0x800F081F (`CBS_E_SOURCE_MISSING`), source-path/readability/completeness/version conditions and Windows 10/Server installation context. The same article explicitly says 0x800F0922 is not specific to .NET; no .NET-specific diagnosis was invented from that code.

Some Learn pages included an authorization banner in their surrounding chrome while the article body, codes, explanations and source metadata were readable through the web tool. This review establishes article-content access at the checking date; it does not claim an authenticated service session.

## Authorship, attribution and safety

Microsoft Support/Microsoft Learn are cited as the factual sources. The JSON contains original short titles, explanations, checks, scope statements and translations. It contains no copied paragraphs, tables, repair command blocks, screenshots, logos, installer files, firmware or manual redistribution. This review does not claim permission to republish Microsoft prose. Source titles/URLs serve attribution and official next-step access.

The portal does not execute repairs. Its checks avoid protection/signature enforcement bypass, registry changes, permission changes, forced deletion, partition operations and automatic repair scripts. Original sources containing such operations are linked for their official context; those operations were not incorporated into the portal's own checks. Logging and observational checks do not upload product keys, account information, logs or hardware identifiers.

## Validation performed

A read-only PowerShell validator was executed through the explicitly invoked workspace `rtk.exe test` wrapper. Exit code: 0.

Verified:
- 24 entries and 24 unique lowercase ASCII IDs/slugs.
- 144 complete localized text objects and 288 nonempty checks; exactly two checks per localized entry.
- All required metadata, entry fields, source objects and six-language category labels.
- 17 unique source URLs, all HTTPS and hosted by `support.microsoft.com` or `learn.microsoft.com`.
- Exactly one intentionally repeated human-facing code: 0x800F081F, with two distinct category/operation IDs.
- Category counts: Device Manager 8, Windows Update 6, Activation 5, Setup 4, Optional feature 1.

A separate initial attempt to run an inline generator via the Windows Store `python.exe` alias failed before execution. No file was produced by that attempt. The final JSON was built directly and validated from its saved UTF-8 contents.

Not performed by this data task: app rendering, generated detail-page checks, CI, Git mutations, publication, browser UI testing or repair on physical hardware. No unrelated app/repository files were changed.
