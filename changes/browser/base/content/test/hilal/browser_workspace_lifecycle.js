/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

add_task(async function test_workspace_initialization() {
  ok(window.gHilalWorkspaces, "HilalWorkspaces should be initialized");
  ok(window.gHilalWorkspaces._workspaces.length >= 1, "Should have at least one workspace");
  let defaultWs = window.gHilalWorkspaces._workspaces[0];
  is(defaultWs.id, "default", "Default workspace should be named 'default'");
});

add_task(async function test_workspace_tab_assignment() {
  let tab = await BrowserTestUtils.openNewForegroundTab(gBrowser, "about:blank");
  
  // Verify the tab is assigned to the current active workspace
  let activeId = window.gHilalWorkspaces._activeId;
  let tabWs = window.gHilalWorkspaces._getTabWorkspace(tab);
  
  is(tabWs, activeId, "New tab should be assigned to the active workspace");
  
  BrowserTestUtils.removeTab(tab);
});

add_task(async function test_workspace_creation_and_switch() {
  // Scenario 1 & 2: Create a workspace, switch to it, and verify tab state
  let initialActiveId = window.gHilalWorkspaces._activeId;
  
  // Add a new workspace
  let newWorkspaceId = "test-ws-" + Date.now();
  window.gHilalWorkspaces._workspaces.push({
    id: newWorkspaceId,
    name: "Test Workspace",
    emoji: "🚀",
    color: "blue",
    containerId: 0,
  });
  window.gHilalWorkspaces._saveData();
  
  // Switch to new workspace
  window.gHilalWorkspaces._activeId = newWorkspaceId;
  window.gHilalWorkspaces._saveActive();
  window.gHilalWorkspaces._apply();
  
  is(window.gHilalWorkspaces._activeId, newWorkspaceId, "Active workspace should be the new one");
  
  let tab = await BrowserTestUtils.openNewForegroundTab(gBrowser, "about:blank");
  let tabWs = window.gHilalWorkspaces._getTabWorkspace(tab);
  is(tabWs, newWorkspaceId, "New tab should be assigned to the new workspace");
  
  // Switch back
  window.gHilalWorkspaces._activeId = initialActiveId;
  window.gHilalWorkspaces._saveActive();
  window.gHilalWorkspaces._apply();
  
  // The tab from the other workspace should now be hidden
  ok(tab.hidden, "Tab from inactive workspace should be hidden");
  
  // Switch to new workspace again
  window.gHilalWorkspaces._activeId = newWorkspaceId;
  window.gHilalWorkspaces._saveActive();
  window.gHilalWorkspaces._apply();
  
  ok(!tab.hidden, "Tab from active workspace should be visible again");
  
  BrowserTestUtils.removeTab(tab);
  
  // Cleanup
  window.gHilalWorkspaces._activeId = initialActiveId;
  window.gHilalWorkspaces._saveActive();
  window.gHilalWorkspaces._apply();
  window.gHilalWorkspaces._workspaces = window.gHilalWorkspaces._workspaces.filter(ws => ws.id !== newWorkspaceId);
  window.gHilalWorkspaces._saveData();
});

add_task(async function test_workspace_reordering() {
  let initialWorkspaces = [...window.gHilalWorkspaces._workspaces];
  
  let ws1Id = "test-ws-1-" + Date.now();
  let ws2Id = "test-ws-2-" + Date.now();
  
  window.gHilalWorkspaces._workspaces.push({
    id: ws1Id,
    name: "Workspace 1",
    emoji: "1",
    color: "blue",
    containerId: 0,
  });
  window.gHilalWorkspaces._workspaces.push({
    id: ws2Id,
    name: "Workspace 2",
    emoji: "2",
    color: "green",
    containerId: 0,
  });
  window.gHilalWorkspaces._saveData();
  
  let ws1IndexBefore = window.gHilalWorkspaces._workspaces.findIndex(w => w.id === ws1Id);
  let ws2IndexBefore = window.gHilalWorkspaces._workspaces.findIndex(w => w.id === ws2Id);
  
  ok(ws1IndexBefore !== -1 && ws2IndexBefore !== -1, "Test workspaces should exist");
  
  // Test reorderWorkspaces
  window.gHilalWorkspaces.reorderWorkspaces(ws1Id, ws2Id);
  
  let ws1IndexAfter = window.gHilalWorkspaces._workspaces.findIndex(w => w.id === ws1Id);
  let ws2IndexAfter = window.gHilalWorkspaces._workspaces.findIndex(w => w.id === ws2Id);
  
  is(ws1IndexAfter, ws2IndexBefore, "Workspace 1 should be moved to Workspace 2's position");
  
  // Test moveWorkspaceByIndex (Move Up)
  let indexToMove = window.gHilalWorkspaces._workspaces.findIndex(w => w.id === ws2Id);
  window.gHilalWorkspaces.moveWorkspaceByIndex(indexToMove, -1);
  
  let indexAfterMoveUp = window.gHilalWorkspaces._workspaces.findIndex(w => w.id === ws2Id);
  is(indexAfterMoveUp, indexToMove - 1, "Workspace 2 should have moved up by one position");
  
  // Restore initial state
  window.gHilalWorkspaces._workspaces = initialWorkspaces;
  window.gHilalWorkspaces._saveData();
});
