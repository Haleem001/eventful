export const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This request conflicts with the current state. Please refresh and try again.',
  422: 'Unable to process the provided data.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'The service is temporarily unavailable. Please try again.',
  503: 'The service is under maintenance. Please try again later.',
};
