export type MessageType =
  | 'GET_WORKFLOWS'
  | 'SAVE_WORKFLOW'
  | 'DELETE_WORKFLOW'
  | 'EXECUTE_PROMPT'
  | 'RUN_WORKFLOW'
  | 'STOP_EXECUTION'
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  | 'GET_EXECUTIONS'
  | 'GET_CURRENT_EXECUTION'
  | 'ANALYZE_PAGE'
  | 'EXECUTE_STEP'
  | 'UPLOAD_DOCUMENT';

export interface Message {
  type: MessageType;
  [key: string]: any;
}

export interface Response {
  success: boolean;
  [key: string]: any;
}

export const sendMessageToBackground = (message: Message): Promise<Response> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response ?? { success: false, error: 'No response from extension — try reloading the extension' });
      }
    });
  });
};

export const sendMessageToContentScript = (
  tabId: number,
  message: Message
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
};

export const getCurrentTab = (): Promise<chrome.tabs.Tab> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(tabs[0]);
      }
    });
  });
};
