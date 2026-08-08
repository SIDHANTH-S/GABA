Implementation Order:
Phase 1 — Foundation (types, database, CDP access):

shared/types.ts, shared/constants.ts, shared/utils.ts, shared/schema.sql
electron-main/db.ts
electron-main/cdp-bridge.ts
package.json, tsconfig files, vite.config.ts, .env.example
Phase 2 — Semantic Parser (local, zero LLM, fully testable): 5. semantic-parser/dom-extractor.ts 6. semantic-parser/entity-detector.ts 7. semantic-parser/form-analyzer.ts 8. semantic-parser/page-classifier.ts 9. semantic-parser/document-detector.ts 10. semantic-parser/action-discoverer.ts 11. semantic-parser/tab-intent-classifier.ts 12. semantic-parser/semantic-model-builder.ts 13. scripts/test-parser.ts (verification CLI)

Phase 3 — Agent Core (pipeline, planning, execution): 14. agent-core/llm-client.ts 15. agent-core/memory-manager.ts 16. agent-core/verifier.ts 17. agent-core/planner.ts 18. agent-core/executor.ts 19. agent-core/extractor.ts 20. agent-core/workflow-recorder.ts 21. agent-core/workflow-replayer.ts 22. agent-core/pipeline.ts

Phase 4 — Electron Main (IPC, window management): 23. electron-main/ipc-handlers.ts 24. electron-main/window-manager.ts 25. electron-main/tab-manager.ts 26. electron-main/global-shortcuts.ts 27. electron-main/index.ts

Phase 5 — Renderer (React UI): 28. renderer/store/ui-store.ts, page-store.ts, agent-store.ts 29. renderer/hooks/ (all 5 hooks) 30. renderer/components/HUD/ 31. renderer/components/Checkpoint/ 32. renderer/components/CommandBar/ 33. renderer/components/Sidebar/ 34. renderer/App.tsx, main.tsx, index.html 35. Tailwind globals.css

Phase 6 — Testing & Demo: 36. scripts/seed-memory.ts 37. Mock pages (renderer/public/mock/) 38. Manual smoke test verification