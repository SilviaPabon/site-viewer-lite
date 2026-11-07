import type { Issue, IssueRepository } from "../domain/issue.js";

// shortcut: issues live in memory and vanish on restart; swap for a file or DB repository if they must persist.
export function createMemoryIssueRepository(): IssueRepository & {
  all(): Issue[];
} {
  const issues: Issue[] = [];
  return {
    async save(issue) {
      issues.push(issue);
    },
    all: () => [...issues],
  };
}
