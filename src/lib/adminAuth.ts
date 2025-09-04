export function validateAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  
  try {
    // Decode the base64 token
    const decoded = Buffer.from(token, 'base64').toString();
    const [prefix, timestampStr] = decoded.split(':');
    
    if (prefix !== 'admin') return false;
    
    const timestamp = parseInt(timestampStr);
    if (isNaN(timestamp)) return false;
    
    // Check if token is expired (24 hours)
    const now = Date.now();
    const tokenAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
    
    return tokenAge < maxAge;
  } catch (error) {
    return false;
  }
}

export function validateEmployeeToken(token: string | undefined): { isValid: boolean; employeeId?: string } {
  if (!token) return { isValid: false };
  
  try {
    // Decode the base64 token
    const decoded = Buffer.from(token, 'base64').toString();
    const [employeeId, timestampStr] = decoded.split(':');
    
    if (!employeeId || !timestampStr) return { isValid: false };
    
    const timestamp = parseInt(timestampStr);
    if (isNaN(timestamp)) return { isValid: false };
    
    // Check if token is expired (8 hours)
    const now = Date.now();
    const tokenAge = now - timestamp;
    const maxAge = 8 * 60 * 60 * 1000; // 8 hours in ms
    
    if (tokenAge >= maxAge) return { isValid: false };
    
    return { isValid: true, employeeId };
  } catch (error) {
    return { isValid: false };
  }
}