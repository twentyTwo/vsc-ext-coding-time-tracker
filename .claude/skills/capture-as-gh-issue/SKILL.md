---
name: capture-as-gh-issue
description: Capture the idea, concept, or bug being brainstormed in the current chat and file it as a GitHub issue in the current repository. Use whenever the user asks to capture, file, log, save, or push something as a GitHub issue, wants to turn a discussion or concept into an issue, or says "make an issue for this" — even if they never say the word "issue".
---

# Capture as GitHub issue

Turn the outcome of a brainstorm in this conversation into a GitHub issue:
distill the chat into a title and a structured body, show the draft, and create
the issue only after the user approves it.

Creating an issue is public and effectively permanent — anyone watching the repo
gets notified, and a mis-titled issue lingers in the tracker. That is why the
flow stops at a draft first; treat the confirmation step as the point of the
skill, not as friction.

## Step 1 — Find the concept

Re-read the conversation and identify the thing being brainstormed: the problem
or wish that started it, the shape of the solution that emerged, decisions made
or rejected along the way, and questions left open. Write for a reader who was
not in the chat — no "as we discussed", no pronouns without an antecedent, no
references to "the conversation".

If the chat contains no discernible concept (the skill was invoked cold), ask
what to file rather than inventing something. An empty catch-all issue is worse
than none.

## Step 2 — Check for duplicates

Before drafting, search the repo's open issues for the same idea:

```sh
gh issue list --state open --search "<key terms from the concept>"
```

Filing a duplicate buries the original discussion. If a near-duplicate exists,
show it and ask whether to add a comment to it instead of creating a new issue.

## Step 3 — Draft

**Title.** One line, sentence case, imperative, roughly 50–72 characters,
naming the outcome — "Add a microphone selector to Settings", not "Mic issue"
and not "Issue: microphone selector feature".

**Body.** Three sections, in this order. Drop a heading only if its content is
genuinely empty.

**Problem** — what is wrong or missing today, in terms a reader can verify.

**Proposal** — what to build or change. This is the distilled outcome of the
brainstorm, including alternatives that were considered and rejected, and why.
That rationale is the main thing the chat has that the repo does not; losing it
is how issues get re-litigated months later.

**Notes** — open questions, constraints, links, and anything that did not fit
above.

Example of the shape (abridged):

> **Title:** Add a microphone selector to Settings
>
> **Problem**
> Bolo records from the Windows default input device. Anyone with a headset and
> a webcam mic has to change the system default to change what Bolo hears.
>
> **Proposal**
> Add a Microphone tab to Settings listing input devices. The discussion
> rejected per-app device profiles as out of scope for now.
>
> **Notes**
> Needs a fallback when the selected device is unplugged.

## Step 4 — Show the draft, get approval

Show the full title and body in the chat and stop. Apply the edits the user
asks for and re-show. Create the issue only on an explicit go-ahead — "yes",
"looks good", "ship it". Silence, a new question, or a tangent is not approval.

## Step 5 — Create the issue

Write the body to a temp file and pass `--body-file`. The body contains quotes,
backticks, and apostrophes; an inline `--body "..."` argument breaks on them
(especially through Windows shells), while a file sidesteps quoting entirely:

```sh
gh issue create --title "<title>" --body-file "<temp file>"
```

Run it from the repo root so `gh` targets the workspace's repository; if the
user named a different repository when invoking the skill, add
`--repo owner/name`. Delete the temp file afterwards and report the issue URL
`gh` prints — that URL is the deliverable.

## Prerequisites

- `gh` must be installed and authenticated. If `gh auth status` fails, say so
  and offer the draft for manual filing instead of stopping silently.
- The current directory must be a git repo with a GitHub remote. If it is not,
  ask which `owner/name` to target rather than guessing.
