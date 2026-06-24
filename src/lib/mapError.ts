export function mapError(error: unknown): string {
  const msg = String(error).toLowerCase()

  // Database errors
  if (msg.includes('unique constraint failed')) return 'This item already exists. Please check for duplicates.'
  if (msg.includes('foreign key constraint failed')) return 'Cannot complete this action. Related data may be missing.'
  if (msg.includes('not null constraint failed')) return 'Please fill in all required fields.'
  if (msg.includes('check constraint failed')) return 'Invalid data format. Please check your input.'
  if (msg.includes('database disk image is malformed')) return 'Database error. Please contact support.'
  if (msg.includes('database is locked')) return 'System is busy. Please try again.'
  if (msg.includes('no such table') || msg.includes('no such column')) return 'System error. Please contact support.'
  if (msg.includes('failed to open database')) return 'Cannot access database. Please contact support.'

  // File system errors
  if (msg.includes('permission denied')) return 'Permission denied. Please check file access.'
  if (msg.includes('file not found')) return 'File not found.'
  if (msg.includes('is a directory')) return 'Expected a file but found a directory.'
  if (msg.includes('entity not found')) return 'File or folder not found.'

  // Network errors
  if (msg.includes('connection refused')) return 'Connection failed. Please check your network.'
  if (msg.includes('timeout')) return 'Request timed out. Please try again.'
  if (msg.includes('dns')) return 'Cannot reach server. Please check your connection.'
  if (msg.includes('connection reset')) return 'Connection lost. Please try again.'

  // Auth errors
  if (msg.includes('invalid username or password')) return 'Invalid username or password.'
  if (msg.includes('session expired')) return 'Session expired. Please log in again.'
  if (msg.includes('invalid or expired session')) return 'Session expired. Please log in again.'
  if (msg.includes('authentication required')) return 'Please log in to continue.'
  if (msg.includes('account is disabled')) return 'Your account has been disabled.'
  if (msg.includes('user not found or disabled')) return 'Account not found or disabled.'

  // Business logic errors
  if (msg.includes('backup file not found')) return 'Backup file not found.'
  if (msg.includes('campaign already sent')) return 'This campaign has already been sent.'
  if (msg.includes('no customers selected')) return 'Please select at least one customer.'
  if (msg.includes('no ai provider available')) return 'AI service is unavailable. Please try again.'
  if (msg.includes('fonnte api token is empty')) return 'WhatsApp not configured. Please check settings.'
  if (msg.includes('smtp')) return 'Email configuration error. Please check settings.'

  // Default — hide raw error from user
  console.error('Unhandled error:', error)
  return 'Something went wrong. Please try again.'
}
