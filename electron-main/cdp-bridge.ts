/**
 * electron-main/cdp-bridge.ts
 * Chrome DevTools Protocol interface via Electron debugger API
 * Dependencies: electron, shared/types
 */

import { BrowserWindow, WebContents } from 'electron';
import type { CDPSession, NodeId, AXNode } from '../shared/types';

/**
 * Attach CDP session to browser window or web contents view
 */
export async function attachCDP(target: { webContents: WebContents }): Promise<CDPSession> {
  try {
    if (!target.webContents.debugger.isAttached()) {
      target.webContents.debugger.attach('1.3');
      console.log('[CDP] Attached to window');
    } else {
      console.log('[CDP] Already attached, reusing existing session');
    }
  } catch (err) {
    console.error('[CDP] Failed to attach:', err);
    throw err;
  }
  
  // Return CDP session-like object
  return {
    send: async (method: string, params?: Record<string, unknown>) => {
      return await target.webContents.debugger.sendCommand(method, params);
    },
    on: (event: string, handler: (...args: any[]) => void) => {
      target.webContents.debugger.on('message', (_, method, params) => {
        if (method === event) {
          handler(params);
        }
      });
    },
    off: () => {
      // Electron debugger doesn't support selective event removal
    },
  };
}

/**
 * Get full accessibility tree
 */
export async function getAccessibilityTree(session: CDPSession): Promise<AXNode[]> {
  try {
    const result = await session.send('Accessibility.getFullAXTree') as any;
    const nodes = result?.nodes || [];
    
    // Convert CDP AXNode format to our format
    const converted = nodes.map((node: any) => convertAXNode(node));
    return converted;
  } catch (err) {
    console.error('[CDP] Failed to get AX tree:', err);
    return [];
  }
}

/**
 * Convert CDP AX node to our format
 */
function convertAXNode(node: any): AXNode {
  return {
    nodeId: node.nodeId || '',
    role: node.role?.value || '',
    name: node.name?.value || '',
    value: node.value?.value,
    description: node.description?.value,
    children: [],
    domNodeId: node.backendDOMNodeId,
    properties: node.properties || {},
  };
}

/**
 * Query selector and return node ID
 */
export async function querySelector(
  session: CDPSession,
  selector: string
): Promise<NodeId | null> {
  try {
    const result = await session.send('DOM.getDocument') as any;
    const rootNodeId = result?.root?.nodeId;
    
    if (!rootNodeId) return null;
    
    const queryResult = await session.send('DOM.querySelector', {
      nodeId: rootNodeId,
      selector,
    }) as any;
    
    return queryResult?.nodeId || null;
  } catch (err) {
    console.error('[CDP] querySelector failed:', err);
    return null;
  }
}

/**
 * Click element by node ID
 */
export async function clickElement(
  session: CDPSession,
  nodeId: NodeId
): Promise<void> {
  try {
    // Get box model for click coordinates
    const boxModel = await session.send('DOM.getBoxModel', { nodeId }) as any;
    const { content } = boxModel.model;
    
    // Click at center of element
    const x = (content[0] + content[4]) / 2;
    const y = (content[1] + content[5]) / 2;
    
    await session.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    
    await session.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
  } catch (err) {
    console.error('[CDP] Click failed:', err);
    throw err;
  }
}

/**
 * Fill input field by node ID
 */
export async function fillInput(
  session: CDPSession,
  nodeId: NodeId,
  value: string
): Promise<void> {
  try {
    // Focus the input
    await session.send('DOM.focus', { nodeId });
    
    // Clear existing value
    await session.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'a',
      code: 'KeyA',
      windowsVirtualKeyCode: 65,
      modifiers: 2, // Ctrl/Cmd
    });
    
    await session.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'a',
      code: 'KeyA',
      windowsVirtualKeyCode: 65,
      modifiers: 2,
    });
    
    // Type new value
    for (const char of value) {
      await session.send('Input.dispatchKeyEvent', {
        type: 'char',
        text: char,
      });
    }
  } catch (err) {
    console.error('[CDP] Fill input failed:', err);
    throw err;
  }
}

/**
 * Navigate to URL
 */
export async function navigateTo(
  session: CDPSession,
  url: string
): Promise<void> {
  try {
    await session.send('Page.navigate', { url });
  } catch (err) {
    console.error('[CDP] Navigation failed:', err);
    throw err;
  }
}

/**
 * Execute JavaScript in page context
 */
export async function executeScript<T>(
  session: CDPSession,
  script: string
): Promise<T> {
  try {
    const result = await session.send('Runtime.evaluate', {
      expression: script,
      returnByValue: true,
    }) as any;
    
    return result?.result?.value as T;
  } catch (err) {
    console.error('[CDP] Script execution failed:', err);
    throw err;
  }
}

/**
 * Extract page source metadata
 */
export async function extractPageSource(
  session: CDPSession
): Promise<{ url: string; title: string }> {
  try {
    const url = await executeScript<string>(session, 'window.location.href');
    const title = await executeScript<string>(session, 'document.title');
    
    return { url, title };
  } catch (err) {
    console.error('[CDP] Page source extraction failed:', err);
    return { url: '', title: '' };
  }
}
