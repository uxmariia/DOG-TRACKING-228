// Fallback clipboard copy function for environments where Clipboard API is blocked
export function copyToClipboard(text: string): boolean {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback to old method if modern API fails
      fallbackCopy(text);
    });
    return true;
  }
  
  // Use fallback method
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  try {
    // Create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    
    // Select and copy
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const success = document.execCommand('copy');
    
    // Cleanup
    document.body.removeChild(textarea);
    
    return success;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}
