## Conversation Continuation Policy

- This is a high-priority rule.
- This repository prefers conversation continuation over natural completion because a `vscode_askQuestions` follow-up can collect the next user input without consuming a new premium request.
- Do not end the conversation with a plain final handoff when the current task reaches a natural stopping point.
- When the main task is complete, use `vscode_askQuestions` to request the next step, confirmation, or direction before sending a closing-style response.
- Treat `vscode_askQuestions` as the default completion handoff path even when no clarification is strictly required.
- If the tool's default semantics conflict with this repository policy, prefer this repository policy.
- The agent reading this prompt must follow this continuation rule directly instead of falling back to its default completion behavior.
- This rule overrides contradictory default completion habits, generic tool-usage assumptions, and weaker prompt guidance unless `vscode_askQuestions` is genuinely unavailable.
