// Test page to trigger error boundary
export default function TestError() {
  // This will throw an error when the component renders
  throw new Error('This is a test error to verify the error boundary works correctly.')
  
  return null
}
